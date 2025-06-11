import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { URL } from "url";
import { Readable } from "stream";
import { limitConcurrentStreams } from "./limiter";

import { scrape as scrape_mov } from "./movie_providers/scrape";
import { scrape as scrape_show } from "./show_providers/scrape";

import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { jsonLock, USER_AGENT } from "./globals";
import { handleVideoRequest } from "./utils/stream_helpers";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/watch", async (req: Request, res: Response): Promise<void> => {
    const filePath = path.join(__dirname, "pages", "watch.html");
    res.status(200).sendFile(filePath);
});

app.get(
    "/movie/:tmdb_id/",
    limitConcurrentStreams,
    async (req: Request, res: Response): Promise<void> => {
        const { tmdb_id } = req.params;

        if (!tmdb_id) {
            res.status(400).send('Missing "tmdb_id" query parameter.');
            return;
        }

        let scrapeResult = await scrape_mov(tmdb_id, req);

        if (!scrapeResult) {
            res.status(404).send("Media stream not found!");
            return;
        }

        /*const quality = requested_quality || scrapeResult.qualities[0];

        if (!scrapeResult.qualities.includes(quality)) {
            res.status(404).send(
                `Unable to find requested quality. We currently only have the following qualities: ${scrapeResult.qualities}`
            );
            return;
        }
        */

        const src = scrapeResult.sources[scrapeResult.qualities[0]];

        //console.log(src);

        if (!src) {
            res.status(404).send(
                "Unable to find a movie with the provided id."
            );
            return;
        }

        handleVideoRequest(req, res, src);
    }
);

app.get(
    "/show/:id/:season/:episode",
    limitConcurrentStreams,
    async (req: Request, res: Response): Promise<void> => {
        const { id, season, episode } = req.params;

        if (!id) {
            res.status(400).send('Missing "id" query parameter.');
            return;
        }

        if (!season) {
            res.status(400).send("Missing the season number");
            return;
        }

        if (!episode) {
            res.status(400).send("Missing the episode number");
            return;
        }

        let scrapeResult = await scrape_show(id, season, episode, req);

        if (!scrapeResult) {
            res.status(404).send("Media stream not found!");
            return;
        }

        /*const quality = requested_quality || scrapeResult.qualities[0];

        if (!scrapeResult.qualities.includes(quality)) {
            res.status(404).send(
                `Unable to find requested quality. We currently only have the following qualities: ${scrapeResult.qualities}`
            );
            return;
        }
        */

        const src = scrapeResult.sources[scrapeResult.qualities[0]];

        //console.log(src);

        if (!src) {
            res.status(404).send(
                "Unable to find a movie with the provided id."
            );
            return;
        }

        handleVideoRequest(req, res, src);
    }
);

const MAX_SIZE = 5 * 1024 * 1024;

app.get(
    "/proxy",
    limitConcurrentStreams,
    async (req: Request, res: Response): Promise<void> => {
        const targetUrl = req.query.url as string;
        const origin = req.query.org as string;
        const referer = req.query.ref as string;

        if (!targetUrl) {
            res.status(400).send('Missing "url" query parameter.');
            return;
        }

        try {
            const parsedUrl = new URL(targetUrl);

            const response = await fetch(parsedUrl.toString(), {
                method: "GET",
                headers: {
                    "User-Agent": USER_AGENT,
                    Referer: referer || parsedUrl.origin,
                    Origin: origin || parsedUrl.origin,
                },
            });

            if (!response.ok || !response.body) {
                res.status(response.status).send(
                    `Failed to fetch media: ${response.statusText}`
                );
                return;
            }

            res.setHeader(
                "Content-Type",
                response.headers.get("content-type") ||
                    "application/octet-stream"
            );

            const contentLength = response.headers.get("content-length");
            if (contentLength) {
                res.setHeader("Content-Length", contentLength);
            }

            let totalBytes = 0;

            const reader = response.body.getReader();
            const stream = new Readable({
                async read() {
                    try {
                        const { done, value } = await reader.read();
                        if (done) {
                            this.push(null);
                            return;
                        }

                        totalBytes += value.length;

                        if (totalBytes > MAX_SIZE) {
                            this.destroy(
                                new Error("Data limit exceeded (5MB).")
                            );
                            return;
                        }

                        this.push(value);
                    } catch (err) {
                        this.destroy(err as Error);
                    }
                },
            });

            stream.on("error", (err) => {
                res.destroy(err as Error);
            });

            stream.pipe(res);
        } catch (err) {
            console.error("Error proxying media:", err);
            res.status(500).send("Internal Server Error");
        }
    }
);

createServer(app).listen(PORT, () => {
    console.log(`Media proxy server running on http://localhost:${PORT}`);
});

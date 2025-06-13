import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { URL } from "url";
import { Readable } from "stream";
import { limitConcurrentStreams } from "./limiter";

import { allScrapes, fastest } from "./providers/scrape";

import dotenv from "dotenv";
dotenv.config();

import path from "path";
import { jsonLock, USER_AGENT } from "./globals";
import { handleVideoRequest } from "./utils/stream_helpers";
import {
    mediaQuality,
    MovieProviderContext,
    ProviderContext,
    ScrapeResult,
    ShowProviderContext,
} from "./utils/types";
import { mapQuality, unmapQuality } from "./utils/helpers";
import { fromCache, saveCache } from "./utils/cache";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/watch", async (req: Request, res: Response): Promise<void> => {
    const filePath = path.join(__dirname, "pages", "watch.html");
    res.status(200).sendFile(filePath);
});

app.get(
    "/availability/movie/:tmdb_id", // WIP; DONT USE YET
    async (req: Request, res: Response): Promise<void> => {
        const { tmdb_id } = req.params;

        res.setHeader("Access-Control-Allow-Origin", "*");

        let scrapeContext: MovieProviderContext = {
            type: "movie",
            id: +tmdb_id,
            user_agent: req.headers["user-agent"],
            range: req.headers.range,
        };

        let qualities: string[] = [];

        const cached = await fromCache(scrapeContext);
        if (cached) {
            cached.qualities.forEach((quality) => {
                qualities.push(unmapQuality(quality));
            });
            res.status(200).send(qualities);
            return;
        }

        if (!tmdb_id) {
            res.status(400).send('Missing "tmdb_id" query parameter.');
            return;
        }

        const scrapeResult = await allScrapes(scrapeContext);

        console.log(scrapeResult);

        if (!scrapeResult) {
            res.status(404).send("Media not found");
            return;
        }

        saveCache(scrapeContext, scrapeResult);

        scrapeResult.qualities.forEach((quality) => {
            qualities.push(unmapQuality(quality));
        });

        res.status(200).send(qualities);
    }
);

app.get(
    "/stream/movie/:tmdb_id/:quality",
    limitConcurrentStreams,
    async (req: Request, res: Response): Promise<void> => {
        const { tmdb_id, quality } = req.params;
        let movieQuality: mediaQuality = mapQuality(quality);

        const query: ProviderContext = { type: "movie", id: +tmdb_id };
        const cached = await fromCache(query);

        if (!cached) {
            res.status(404).send(
                "Unable to find source in cache, Please fetch from /availability/movie/:tmdb_id first."
            );
            return;
        }

        if (movieQuality === "auto") {
            movieQuality = cached.qualities[cached.qualities.length - 1];
        }

        const src = cached.sources[movieQuality];
        if (!src) {
            res.status(404).send(
                "Unable to find a movie source with the requested quality."
            );
            return;
        }
        handleVideoRequest(req, res, src);
    }
);

app.get(
    "/availability/show/:tmdb_id/:season/:episode",
    async (req: Request, res: Response): Promise<void> => {
        const { tmdb_id, season, episode } = req.params;

        res.setHeader("Access-Control-Allow-Origin", "*");

        let scrapeContext: ShowProviderContext = {
            type: "tv",
            id: +tmdb_id,
            season: +season,
            episode: +episode,
            user_agent: req.headers["user-agent"],
            range: req.headers.range,
        };

        let qualities: string[] = [];

        const cached = await fromCache(scrapeContext);
        if (cached) {
            cached.qualities.forEach((quality) => {
                qualities.push(unmapQuality(quality));
            });
            res.status(200).send(qualities);
            return;
        }

        if (!tmdb_id) {
            res.status(400).send('Missing "tmdb_id" query parameter.');
            return;
        }

        const scrapeResult = await allScrapes(scrapeContext);

        console.log(scrapeResult);

        if (!scrapeResult) {
            res.status(404).send("Media not found");
            return;
        }

        saveCache(scrapeContext, scrapeResult);

        scrapeResult.qualities.forEach((quality) => {
            qualities.push(unmapQuality(quality));
        });

        res.status(200).send(qualities);
    }
);

app.get(
    "/stream/show/:tmdb_id/:season/:episode/:quality",
    limitConcurrentStreams,
    async (req: Request, res: Response): Promise<void> => {
        const { tmdb_id, season, episode, quality } = req.params;
        let movieQuality: mediaQuality = mapQuality(quality);

        let query: ShowProviderContext = {
            type: "tv",
            id: +tmdb_id,
            season: +season,
            episode: +episode,
            user_agent: req.headers["user-agent"],
            range: req.headers.range,
        };
        const cached = await fromCache(query);

        if (!cached) {
            res.status(404).send(
                "Unable to find source in cache, Please fetch from /availability/movie/:tmdb_id first."
            );
            return;
        }

        if (movieQuality === "auto") {
            movieQuality = cached.qualities[cached.qualities.length - 1];
        }

        const src = cached.sources[movieQuality];
        if (!src) {
            res.status(404).send(
                "Unable to find a movie source with the requested quality."
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

import express, { Request, Response } from "express";
import { createServer } from "http";
import { URL } from "url";
import { Readable } from "stream";
import { limitConcurrentStreams } from "./limiter";

import sources from "./providers/all";

const app = express();
const PORT = process.env.PORT || 3000;

/*
app.get(
    "/scrape",
    limitConcurrentStreams,
    async (req: Request, res: Response): Promise<void> => {
        const tmdb_key = req.query.tmdb_key as string;
        const tmdb_id = req.query.tmdb_id as string;

        if (!tmdb_key) {
            res.status(400).send('Missing "url" query parameter.');
            return;
        }

        if (!tmdb_id) {
            res.status(400).send('Missing "url" query parameter.');
            return;
        }

        
    }
);
*/

app.get(
    "/ee3_test",
    limitConcurrentStreams,
    async (req: Request, res: Response): Promise<void> => {
        const tmdb_id = req.query.tmdb_id as string;

        if (!tmdb_id) {
            res.status(400).send('Missing "tmdb_id" query parameter.');
            return;
        }

        const response = await sources.ee3(
            tmdb_id,
            req.headers.range || "bytes=0-"
        );

        if (!response.ok || !response.body) {
            res.status(response.status).send(
                `Failed to fetch media: ${response.statusText}`
            );
            return;
        }

        res.setHeaders(response.headers);

        res.status(response.status);

        const reader = response.body.getReader();
        const stream = new Readable({
            async read() {
                try {
                    const { done, value } = await reader.read();
                    if (done) {
                        this.push(null);
                    } else {
                        this.push(value);
                    }
                } catch (err) {
                    this.destroy(err as Error);
                }
            },
        });

        stream.pipe(res);
    }
);

app.get(
    "/proxy",
    limitConcurrentStreams,
    async (req: Request, res: Response): Promise<void> => {
        const targetUrl = req.query.url as string;

        if (!targetUrl) {
            res.status(400).send('Missing "url" query parameter.');
            return;
        }

        try {
            const parsedUrl = new URL(targetUrl);

            const response = await fetch(parsedUrl.toString(), {
                method: "GET",
                headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; ProxyServer/1.0)",
                    Referer: parsedUrl.origin,
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

            const reader = response.body.getReader();
            const stream = new Readable({
                async read() {
                    try {
                        const { done, value } = await reader.read();
                        if (done) {
                            this.push(null);
                        } else {
                            this.push(value);
                        }
                    } catch (err) {
                        this.destroy(err as Error);
                    }
                },
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

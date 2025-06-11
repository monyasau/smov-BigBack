import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { pipe } from "../pipe";

export async function handleVideoRequest(
    req: Request,
    res: Response,
    src: string | globalThis.Response
): Promise<void> {
    if (typeof src === "string") {
        if (src.startsWith("file:")) {
            const filePath = path.resolve("./", src.substring(7)); // Properly remove "file://"

            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error("Error getting file stats:", err);
                    res.status(404).send("Video file not found.");
                    return;
                }

                const range = req.headers.range || "bytes=0-";

                const videoSize = stats.size;
                const CHUNK_SIZE = videoSize;
                const start = Number(range.replace(/\D/g, ""));
                const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

                const contentLength = end - start + 1;
                const headers = {
                    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
                    "Accept-Ranges": "bytes",
                    "Content-Length": contentLength,
                    "Content-Type": "video/mp4",
                };

                res.writeHead(206, headers);

                const videoStream = fs.createReadStream(filePath, {
                    start,
                    end,
                });
                videoStream.pipe(res);
            });
        } else {
            //pipe(req, res, await fetch(src));
            res.redirect(302, src);
        }
        return;
    }

    pipe(req, res, src);
}

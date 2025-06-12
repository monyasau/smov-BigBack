import { Request, Response } from "express";
import { Readable } from "stream";

export function pipe(req: Request, res: Response, src: globalThis.Response) {
    if (!src) {
        res.status(500).send(
            `Failed to fetch media, Tell the site owner to check the console.`
        );
        return;
    }

    if (!src.ok || !src.body) {
        res.status(src.status).send(`Failed to fetch media: ${src.statusText}`);
        return;
    }

    res.setHeaders(src.headers);

    res.setHeader("content-type", "video/mp4");

    res.setHeader("Content-Disposition", "inline");

    res.setHeader("Access-Control-Allow-Origin", "*");

    res.status(src.status);

    const reader = src.body.getReader();
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

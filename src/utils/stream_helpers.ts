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
        pipe(
            req,
            res,
            await fetch(src, {
                headers: { Range: req.headers?.range || "bytes=0-" },
            })
        );
        return;
    }

    pipe(req, res, src);
}

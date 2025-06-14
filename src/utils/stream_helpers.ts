import { Request, Response } from "express";
import { pipe } from "../pipe";
import { fetchInformation } from "./types";

export async function handleVideoRequest(
    req: Request,
    res: Response,
    src: fetchInformation
): Promise<void> {
    let headers = new Headers(src.headers);
    headers.set("Range", req.headers.range || "bytes=0-");
    pipe(
        req,
        res,
        await fetch(src.url, {
            headers,
        })
    );
    return;
}

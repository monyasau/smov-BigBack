import { Request, Response } from "express";
import sources from "./all";
import firstTruthy from "../utils/first_truthy";
import { promises as fs } from "fs";
import { jsonLock } from "../globals";

export async function scrape(
    tmdb_id: string,
    req: Request
): Promise<string | globalThis.Response | undefined> {
    const fetchEE3 = () =>
        sources.ee3(tmdb_id, {
            user_agent: req.headers["user-agent"],
            range: req.headers.range,
        });
    const fetchXprime = () => sources.xprime(tmdb_id, req);
    const fetchCache = async () => {
        const json = await jsonLock.withLock("./cache/index.json", async () => {
            const raw = fs.readFile("./cache/index.json");
            return JSON.parse((await raw).toString());
        });

        try {
            const path = json[tmdb_id][0];
            return `file:./cache/${path}`;
        } catch (err) {
            return;
        }
    };

    if (tmdb_id == "69420") {
        return "https://www.sample-videos.com/video321/mp4/720/big_buck_bunny_720p_2mb.mp4";
    }

    const fastest = firstTruthy([fetchXprime, fetchEE3, fetchCache]);

    try {
        return await fastest;
    } catch (error) {
        return;
    }
}

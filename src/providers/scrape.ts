import { Request, Response } from "express";
import sources from "./all";
import firstTruthy from "../utils/first_truthy";

export async function scrape(tmdb_id: string, req: Request) {
    const fetchEE3 = () => sources.ee3(tmdb_id, req);
    const fetchXprime = () => sources.xprime(tmdb_id, req);

    if (tmdb_id == "69420") {
        return "https://www.sample-videos.com/video321/mp4/720/big_buck_bunny_720p_2mb.mp4";
    }

    const fastest = firstTruthy([fetchXprime]);

    try {
        return await fastest;
    } catch (error) {
        return;
    }
}

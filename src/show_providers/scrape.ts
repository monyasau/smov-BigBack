import { Request, Response } from "express";
import sources from "./all";
import firstTruthy from "../utils/first_truthy";
import { ScrapeResult } from "../utils/types";

export async function scrape(
    tmdb_id: string,
    season: string,
    episode: string,
    req: Request
): Promise<ScrapeResult> {
    const fetch_xprime = () => sources.xprime(tmdb_id, season, episode, req);
    const fetch_feds = async (): Promise<ScrapeResult> => {
        const ua = req.headers["user-agent"] || "";
        if (/firefox/i.test(ua)) {
            return;
        }

        return sources.fetch_fed(tmdb_id, season, episode);
    };

    const fastest = firstTruthy([fetch_feds, fetch_xprime]);

    try {
        return fastest;
    } catch (error) {
        return;
    }
}

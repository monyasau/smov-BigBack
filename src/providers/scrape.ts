import { Request, Response } from "express";
import sources from "./all";
import firstTruthy from "../utils/first_truthy";
import { ScrapeResult } from "../utils/types";

export async function scrape(
    tmdb_id: string,
    req: Request
): Promise<ScrapeResult> {
    const fetchEE3 = () =>
        sources.ee3(tmdb_id, {
            user_agent: req.headers["user-agent"],
            range: req.headers.range,
        });
    const fetchXprime = () => sources.xprime(tmdb_id, req);
    const fetch_feds = (): Promise<ScrapeResult> => {
        const ua = req.headers["user-agent"] || "";
        if (/firefox/i.test(ua)) {
            return Promise.reject(null);
        }

        return sources.fetch_fed(tmdb_id);
    };

    const fastest = firstTruthy([fetchXprime, fetchEE3, fetch_feds]);

    try {
        return fastest;
    } catch (error) {
        return;
    }
}

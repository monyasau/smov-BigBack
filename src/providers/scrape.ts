import { Request, Response } from "express";
import sources from "./all";

export async function scrape(tmdb_id: string, req: Request) {
    if (tmdb_id == "69420") {
        return "https://www.sample-videos.com/video321/mp4/720/big_buck_bunny_720p_2mb.mp4";
    }

    let ee3 = sources.ee3(tmdb_id, req.headers.range || "bytes=0-");

    console.log("scraping da sources!!");

    if (await ee3) {
        console.log("Using EE3 as source!");
        return ee3;
    }

    return;
}

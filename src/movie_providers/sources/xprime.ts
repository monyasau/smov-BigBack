import { Request, Response } from "express";
import { USER_AGENT } from "../../globals";
import { getExternalIds, getMovieDetails } from "../../utils/tmdb";
import firstTruthy from "../../utils/first_truthy";
import { ScrapeResult } from "../../utils/types";

export async function fetch_primebox(
    id: string,
    User_Agent?: string
): Promise<ScrapeResult> {
    let external_ids = await getExternalIds(Number(id));
    let movie_data = await getMovieDetails(external_ids.id);

    console.log(movie_data);

    let name = movie_data.original_title;
    console.log(name);
    let year = movie_data.release_date.slice(0, 4);
    console.log(year);
    let imdb = external_ids.imdb_id;
    let url = `https://backend.xprime.tv/primebox?name=${name}&year=${year}&id=${id}&imdb=${imdb}`;
    console.log(url);
    let resp = await fetch(url, {
        headers: {
            "User-Agent": User_Agent || USER_AGENT,
        },
    });

    try {
        let json = await resp.json();
        let qualities = json["available_qualities"];
        let links = json["streams"];
        return { qualities: qualities, sources: links };
    } catch (err) {
        return;
    }
}

export async function fetch_primenet(id: string, User_Agent?: string) {
    // M3U8, i wont touch m3u8. Fuck m3u8.
    let resp = await fetch(`https://backend.xprime.tv/primenet?id=${id}`, {
        headers: {
            "User-Agent": User_Agent || USER_AGENT,
        },
    });
}

export async function scrape_all(
    id: string,
    req: Request
): Promise<ScrapeResult> {
    let primebox_fetcher = () =>
        fetch_primebox(id, req.headers["user-agent"] || USER_AGENT);

    const fastest = await firstTruthy([primebox_fetcher]);

    try {
        return fastest;
    } catch (error) {
        return;
    }
}

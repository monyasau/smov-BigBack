import { Request, Response } from "express";
import { USER_AGENT } from "../../globals";
import { getExternalIds, getTvDetails } from "../../utils/tmdb";
import firstTruthy from "../../utils/first_truthy";
import { ScrapeResult } from "../../utils/types";

export async function fetch_primebox(
    id: string,
    season: string,
    episode: string,
    User_Agent?: string
): Promise<ScrapeResult> {
    let external_ids = await getExternalIds(Number(id));
    let show_data = await getTvDetails(external_ids.id);

    let name = show_data.original_name;
    let resp = await fetch(
        `https://backend.xprime.tv/primebox?name=${name}&id=t${id}&season=${season}&episode=${episode}`,
        {
            headers: {
                "User-Agent": User_Agent || USER_AGENT,
            },
        }
    );

    try {
        let json = await resp.json();
        console.log(json);
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
    season: string,
    episode: string,
    req: Request
): Promise<ScrapeResult> {
    let primebox_fetcher = () =>
        fetch_primebox(
            id,
            season,
            episode,
            req.headers["user-agent"] || USER_AGENT
        );

    const fastest = await firstTruthy([primebox_fetcher]);

    try {
        return fastest;
    } catch (error) {
        return;
    }
}

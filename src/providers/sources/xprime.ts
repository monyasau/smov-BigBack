import { Request, Response } from "express";
import { USER_AGENT } from "../../globals";
import { getExternalIds } from "../../utils/tmdb";
import firstTruthy from "../../utils/first_truthy";

async function fetch_nas(id: string, User_Agent: string) {
    let imdb_id = (await getExternalIds(Number(id))).imdb_id;
    let resp = await fetch(`https://xprime.tv/nas?imdb=${imdb_id}`, {
        headers: {
            "User-Agent": User_Agent,
        },
    });
    let json = await resp.json();
    let quality = json["available_qualities"][0];
    let link = json["streams"][quality];

    return link;
}

async function fetch_prime(id: string, User_Agent: string) {
    let resp = await fetch(`https://xprime.tv/primebox?id=${id}`, {
        headers: {
            "User-Agent": User_Agent,
        },
    });
    let json = await resp.json();

    let quality = json["available_qualities"][0];
    let link = json["streams"][quality];

    return link;
}

async function scrape(id: string, req: Request) {
    let nas_fetcher = () =>
        fetch_nas(id, req.headers["user-agent"] || USER_AGENT);
    let prime_fetcher = () =>
        fetch_prime(id, req.headers["user-agent"] || USER_AGENT);

    const fastest = await firstTruthy([nas_fetcher, prime_fetcher]);
    console.log(fastest);

    try {
        return fastest;
    } catch (error) {
        return;
    }
}

export = scrape;

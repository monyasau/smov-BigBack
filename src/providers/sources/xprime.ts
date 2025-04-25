import { Request, Response } from "express";
import { USER_AGENT } from "../../globals";

async function fetch_prime(id: string, User_Agent: string) {
    let resp = await fetch(`https://xprime.tv/primebox?id=${id}`, {
        headers: {
            "User-Agent": User_Agent,
        },
    });
    let json = await resp.json();
    let quality = json.get("available_qualities")[0];
    return json.get("streams").get(quality);
}

async function scrape(id: string, req: Request) {
    return fetch_prime(id, req.headers["user-agent"] || USER_AGENT);
}

export = scrape;

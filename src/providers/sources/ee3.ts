import { Request, Response } from "express";
import { USER_AGENT } from "../../globals";
import { ScrapeResult } from "../../utils/types";

async function fetch_movie(id: string, ee3_auth: string, User_Agent: string) {
    let token = await fetch(
        "https://borg.rips.cc/api/collections/users/auth-with-password?expand=lists_liked",
        {
            method: "POST",
            headers: {
                "User-Agent": User_Agent,
                Origin: "https://ee3.me",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                identity: "sudo-flix",
                password: ee3_auth,
            }),
        }
    ).then(async (resp) => {
        if (resp.status != 200) return;

        var ContentType = resp.headers.get("content-type")?.split("; ");

        if (!ContentType) return;
        if (ContentType[0].toLowerCase() != "application/json") return;

        const jsonResponse = await resp.json();
        try {
            return jsonResponse.token;
        } catch (error) {
            return;
        }
    });

    let movie_id = await fetch(
        `https://borg.rips.cc/api/collections/movies/records?page=1&perPage=48&filter=tmdb_data.id%20~%20${id}`,
        {
            headers: {
                "User-Agent": User_Agent,
                Authorization: token,
                Origin: "https://ee3.me",
            },
        }
    ).then(async (resp) => {
        if (resp.status != 200) return;

        var ContentType = resp.headers.get("content-type")?.split("; ");

        if (!ContentType) return;
        if (ContentType[0].toLowerCase() != "application/json") return;

        const jsonResponse = await resp.json();
        try {
            return jsonResponse.items[0].video;
        } catch (error) {
            return;
        }
    });

    if (!movie_id) return;

    let key = await fetch(`https://borg.rips.cc/video/${movie_id}/key`, {
        headers: {
            "User-Agent": User_Agent,
            Authorization: token,
            Origin: "https://ee3.me",
        },
    }).then(async (resp) => {
        if (resp.status != 200) return;

        var ContentType = resp.headers.get("content-type")?.split("; ");

        if (!ContentType) return;
        if (ContentType[0].toLowerCase() != "application/json") return;

        const jsonResponse = await resp.json();
        try {
            return jsonResponse.key;
        } catch (error) {
            return;
        }
    });

    return `${movie_id}?k=${key}`;
}

async function scrape(
    tmdb_id: string,
    options?: { user_agent?: string; range?: string }
): Promise<ScrapeResult> {
    if (!process.env.EE3_AUTH) {
        console.log("No EE3 auth key found");
        return;
    }
    var mov_data = await fetch_movie(
        tmdb_id,
        process.env.EE3_AUTH,
        options?.user_agent || USER_AGENT
    );

    const res = await fetch(`https://borg.rips.cc/video/${mov_data}`, {
        headers: {
            "User-Agent": options?.user_agent || USER_AGENT,
            Origin: "https://ee3.me",
            Range: options?.range || "bytes=0-",
        },
    });

    if (res.status >= 200 && res.status < 300) {
        return { qualities: ["unknown"], sources: { unknown: res } };
    }

    return;
}

export = scrape;

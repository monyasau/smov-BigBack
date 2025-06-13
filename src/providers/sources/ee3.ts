import { USER_AGENT } from "../../globals";
import { probeMediaQuality } from "../../utils/ffmpeg";
import {
    fetchInformation,
    mediaQuality,
    MovieProviderContext,
    ProviderContext,
    ScrapeResult,
} from "../../utils/types";

async function fetch_movie(ctx: MovieProviderContext, ee3_auth: string) {
    let token = await fetch(
        "https://borg.rips.cc/api/collections/users/auth-with-password?expand=lists_liked",
        {
            method: "POST",
            headers: {
                ...(ctx.user_agent ? { "User-Agent": ctx.user_agent } : {}),
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
        `https://borg.rips.cc/api/collections/movies/records?page=1&perPage=48&filter=tmdb_data.id%20~%20${ctx.id}`,
        {
            headers: {
                ...(ctx.user_agent ? { "User-Agent": ctx.user_agent } : {}),
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
            ...(ctx.user_agent ? { "User-Agent": ctx.user_agent } : {}),
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

export async function scrape(
    ctx: ProviderContext
): Promise<ScrapeResult | undefined> {
    if (ctx.type !== "movie") return;

    if (!process.env.EE3_AUTH) {
        console.log("No EE3 auth key found");
        return;
    }
    var mov_data = await fetch_movie(ctx, process.env.EE3_AUTH);

    let fetchHeaders = new Headers();

    fetchHeaders.set("User-Agent", ctx?.user_agent || USER_AGENT);
    fetchHeaders.set("Origin", "https://ee3.me");
    fetchHeaders.set("Range", ctx?.range || "bytes=0-");

    const quality = await probeMediaQuality(
        `https://borg.rips.cc/video/${mov_data}`,
        new Headers(fetchHeaders)
    );

    let sources: Partial<Record<mediaQuality, fetchInformation>> = {};
    sources[quality] = {
        url: `https://borg.rips.cc/video/${mov_data}`,
        headers: fetchHeaders,
    };

    return {
        qualities: [quality],
        sources: sources,
        cost: 1,
    };
}

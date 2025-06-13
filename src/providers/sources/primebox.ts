import { USER_AGENT } from "../../globals";
import {
    getExternalIds,
    getMovieDetails,
    getTvDetails,
} from "../../utils/tmdb";
import {
    mediaQuality,
    ProviderContext,
    ScrapeResult,
    VideoSource,
} from "../../utils/types";

const mapQuality = (quality: string): mediaQuality => {
    switch (quality) {
        case "360P":
            return 360;
        case "480P":
            return 480;
        case "720P":
            return 720;
        case "1080P":
            return 1080;
        case "4K":
            return "4K";
        case "ORG":
            return "ORG";
        case "auto":
            return "auto";
        default:
            return "unknown";
    }
};

const buildScrapeResult = (jsonResp: any): ScrapeResult => {
    const qualities: mediaQuality[] = jsonResp.available_qualities
        .map(mapQuality)
        .filter((q: string) => q !== "unknown"); // filter out any unmapped/invalid values

    const sources: VideoSource = {};

    for (const qualityStr of Object.keys(jsonResp.streams)) {
        const quality = mapQuality(qualityStr);
        if (quality !== "unknown") {
            sources[quality] = {
                fetchInfo: {
                    url: jsonResp.streams[qualityStr],
                    headers: new Headers({
                        Origin: "https://xprime.tv",
                        Referer: "https://xprime.tv",
                    }),
                },
                type: "mp4",
            };
        }
    }

    return {
        qualities,
        sources,
        cost: 1, // or calculate cost if needed
    };
};

export async function scrape(
    ctx: ProviderContext
): Promise<ScrapeResult | undefined> {
    let external_ids = await getExternalIds(ctx.id);
    let media_data =
        ctx.type === "movie"
            ? await getMovieDetails(ctx.id)
            : await getTvDetails(ctx.id);

    let name =
        ctx.type === "movie"
            ? media_data.original_title
            : media_data.original_name;
    let year =
        ctx.type === "movie" ? media_data.release_date.slice(0, 4) : undefined;
    let imdb = external_ids.imdb_id;
    let url =
        ctx.type === "movie"
            ? `https://backend.xprime.tv/primebox?name=${name}&year=${year}&id=${ctx.id}&imdb=${imdb}`
            : `https://backend.xprime.tv/primebox?name=${name}&id=t${ctx.id}&season=${ctx.season}&episode=${ctx.episode}`;
    let resp = await fetch(url, {
        headers: {
            "User-Agent": ctx.user_agent || USER_AGENT,
        },
    });

    try {
        let json = await resp.json();
        return buildScrapeResult(json);
    } catch (err) {
        return;
    }
}

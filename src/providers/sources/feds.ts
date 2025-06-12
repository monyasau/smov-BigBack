import {
    FebboxResponse,
    mediaQuality,
    ProviderContext,
    ScrapeResult,
} from "../../utils/types";

const mapQuality = (raw: string): mediaQuality => {
    switch (raw.toUpperCase()) {
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
        case "AUTO":
            return "auto";
        default:
            return "unknown";
    }
};

export async function scrape(ctx: ProviderContext): Promise<ScrapeResult> {
    let url =
        ctx.type === "movie"
            ? `https://h2nexus.arlen.icu/cosmic/${ctx.id}`
            : `https://h2nexus.arlen.icu/cosmic/${ctx.id}/${ctx.season}/${ctx.episode}`;
    let resp = await fetch(url, {
        headers: {
            "ui-token": `${process.env.UI_TOKEN}`,
        },
        method: "GET",
    });

    try {
        let json: FebboxResponse = await resp.json();
        let qualities: mediaQuality[] = [];
        let links: Record<string, string> = {};
        json.streams.forEach((element) => {
            qualities.push(mapQuality(element.quality));
            links[element.quality] = element.url;
        });
        return { qualities: qualities, sources: links };
    } catch (err) {
        return;
    }
}

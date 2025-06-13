import { is_over_quota } from "../../utils/febbox";
import { mapQuality } from "../../utils/helpers";
import {
    FebboxResponse,
    mediaQuality,
    ProviderContext,
    ScrapeResult,
} from "../../utils/types";

export async function scrape(
    ctx: ProviderContext
): Promise<ScrapeResult | undefined> {
    if (!process.env.UI_TOKEN) return;

    if (await is_over_quota(process.env.UI_TOKEN)) return;
    let url =
        ctx.type === "movie"
            ? `https://h2nexus.arlen.icu/cosmic/${ctx.id}`
            : `https://h2nexus.arlen.icu/cosmic/${ctx.id}/${ctx.season}/${ctx.episode}`;
    let resp;
    try {
        resp = await fetch(url, {
            headers: {
                "ui-token": `${process.env.UI_TOKEN}`,
            },
            method: "GET",
        });
    } catch (error) {
        return;
    }

    try {
        let json: FebboxResponse = await resp.json();

        let qualities: mediaQuality[] = [];
        let sources: Record<string, { url: string }> = {};

        json.streams.forEach((element) => {
            const q = mapQuality(element.quality);
            qualities.push(q);

            sources[element.quality] = {
                url: element.url,
                // headers or body can be added here if needed:
                // headers: new Headers({ ... }),
                // body: 'some-body-if-needed',
            };
        });

        return {
            qualities,
            sources,
            cost: 10, // Low priority
        };
    } catch (err) {
        return;
    }
}

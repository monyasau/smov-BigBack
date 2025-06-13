import firstTruthy from "../utils/first_truthy";
import {
    mediaQuality,
    ProviderContext,
    Scraper,
    ScrapeResult,
} from "../utils/types";
import { movieOnlyScrapers, sharedScrapers, showOnlyScrapers } from "./all";

const QUALITY_ORDER: mediaQuality[] = [
    360,
    480,
    720,
    1080,
    "4K",
    "ORG",
    "auto",
    "unknown",
];

export async function allScrapes(
    ctx: ProviderContext
): Promise<ScrapeResult | undefined> {
    // 1. Pick scrapers
    const relevant: Scraper[] =
        ctx.type === "movie"
            ? [...movieOnlyScrapers, ...sharedScrapers]
            : [...showOnlyScrapers, ...sharedScrapers];

    // 2. Run them in parallel
    const results = await Promise.all(relevant.map((s) => s(ctx)));

    // 3. Drop undefined
    const valid = results.filter((r): r is NonNullable<ScrapeResult> => !!r);
    if (valid.length === 0) return;

    // 4. For each quality, pick cheapest
    const bestByQuality = new Map<
        mediaQuality,
        {
            source: NonNullable<ScrapeResult>["sources"][mediaQuality];
            cost: number;
        }
    >();

    for (const res of valid) {
        for (const q of res.qualities) {
            const src = res.sources[q];
            if (src == null) continue;
            const prev = bestByQuality.get(q);
            if (!prev || res.cost < prev.cost) {
                bestByQuality.set(q, { source: src, cost: res.cost });
            }
        }
    }

    // 5. Build and sort the final merged result
    //    (a) Gather all chosen qualities
    let qualities = Array.from(bestByQuality.keys());
    //    (b) Sort them by our predefined order
    qualities.sort(
        (a, b) => QUALITY_ORDER.indexOf(a) - QUALITY_ORDER.indexOf(b)
    );

    //    (c) Build sources map in any order (keys come from qualities)
    const sources = {} as NonNullable<ScrapeResult>["sources"];
    let totalCost = 0;
    for (const q of qualities) {
        const { source, cost } = bestByQuality.get(q)!;
        sources[q] = source;
        totalCost += cost;
    }

    // 6. Compute average cost
    const avgCost = qualities.length > 0 ? totalCost / qualities.length : 0;

    return {
        qualities,
        sources,
        cost: avgCost,
    };
}

export async function fastest(
    ctx: ProviderContext
): Promise<ScrapeResult | undefined> {
    const relevant: Scraper[] =
        ctx.type === "movie"
            ? [...movieOnlyScrapers, ...sharedScrapers]
            : [...showOnlyScrapers, ...sharedScrapers];

    const tasks = relevant.map((scraper) => () => scraper(ctx));
    return await firstTruthy(tasks);
}

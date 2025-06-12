import firstTruthy from "../utils/first_truthy";
import { ProviderContext, Scraper, ScrapeResult } from "../utils/types";
import { movieOnlyScrapers, sharedScrapers, showOnlyScrapers } from "./all";

export async function fastest(ctx: ProviderContext): Promise<ScrapeResult> {
    let relevantScrapers: Scraper[];

    if (ctx.type === "movie") {
        relevantScrapers = [...movieOnlyScrapers, ...sharedScrapers]; // Thanks chatgpt :3
    } else {
        relevantScrapers = [...showOnlyScrapers, ...sharedScrapers];
    }

    const tasks = relevantScrapers.map((scraper) => () => scraper(ctx));
    return await firstTruthy(tasks);
}

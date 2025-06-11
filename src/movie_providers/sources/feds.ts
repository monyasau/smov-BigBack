import { FebboxResponse, ScrapeResult } from "../../utils/types";

export async function fetch_fed(id: string): Promise<ScrapeResult> {
    let resp = await fetch(`https://h2nexus.arlen.icu/cosmic/${id}`, {
        headers: {
            "ui-token": `${process.env.UI_TOKEN}`,
        },
        method: "GET",
    });

    try {
        let json: FebboxResponse = await resp.json();
        let qualities: string[] = [];
        let links: Record<string, string> = {};
        json.streams.forEach((element) => {
            qualities.push(element.quality);
            links[element.quality] = element.url;
        });
        return { qualities: qualities, sources: links };
    } catch (err) {
        return;
    }
}

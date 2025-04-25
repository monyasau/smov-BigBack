import { Request, Response } from "express";
import sources from "./all";

/**
 * Race multiple async sources and return the first truthy result.
 * @param sources An array of functions that return Promises of T
 * @returns The first truthy T, or throws an AggregateError if none do.
 */
async function firstTruthy<T>(sources: Array<() => Promise<T>>): Promise<T> {
    // Wrap each source so that falsy results become rejections
    const wrapped = sources.map((fn) =>
        fn().then((value) => {
            if (value) return value;
            // convert falsy to rejection so Promise.any will skip it
            return Promise.reject(new Error("Falsy value"));
        })
    );

    // Promise.any returns the first fulfilled promise; if all reject, it rejects
    return Promise.any(wrapped);
}

export async function scrape(tmdb_id: string, req: Request) {
    const fetchEE3 = () => sources.ee3(tmdb_id, req);

    if (tmdb_id == "69420") {
        return "https://www.sample-videos.com/video321/mp4/720/big_buck_bunny_720p_2mb.mp4";
    }

    const fastest = firstTruthy([fetchEE3]);

    try {
        return await fastest;
    } catch (error) {
        return;
    }
}

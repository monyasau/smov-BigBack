import sources from "../providers/all";
import fs from "fs";
import { promises } from "fs";
import { pickBestVideo } from "./ffmpeg";
import { jsonLock } from "../globals";
import { Readable } from "stream";

async function download_from_response(
    path: string,
    res: globalThis.Response
): Promise<boolean> {
    var success = true;
    try {
        // Create a writable stream to the file
        const fileStream = fs.createWriteStream(path);

        // Pipe the response's readable stream directly to the file stream
        if (!res.body) {
            throw new Error("Response body is null");
        }
        const bodyStream = Readable.from(res.body);
        bodyStream.pipe(fileStream);

        // Wait for the file to finish writing
        await new Promise<void>((resolve, reject) => {
            fileStream.on("finish", resolve);
            fileStream.on("error", reject);
        });
    } catch (err) {
        console.error(err);
        success = false;
    }

    return success;
}

async function download_from_link(
    path: string,
    link: string,
    range?: string
): Promise<boolean> {
    const resp = await fetch(link, { headers: { Range: range || "bytes=0-" } });

    return download_from_response(path, resp);
}

export async function cache_movie(tmdb_id: string): Promise<boolean> {
    const json = await jsonLock.withLock("./cache/index.json", async () => {
        const raw = promises.readFile("./cache/index.json");
        return JSON.parse((await raw).toString());
    });

    if (json[tmdb_id]) {
        return true;
    }

    jsonLock.withLock("./cache/index.json", async () => {
        const raw = promises.readFile("./cache/index.json");
        let data = JSON.parse((await raw).toString());
        data[tmdb_id] = {
            status: "caching",
        };

        promises.writeFile("./cache/index.json", JSON.stringify(data));
    });

    let success = false;

    const path = `./tmp/cache_data/movies/${tmdb_id}`;
    let paths: Record<string, any> = {};

    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
    }

    const ee3_fetch = sources.ee3(tmdb_id, {
        range: `bytes=0-${(5 * 1024 * 1024).toString()}`,
    });
    const xprime_nas_fetch = sources.xprime_nas(tmdb_id);
    const xprime_primebox_fetch = sources.xprime_primebox(tmdb_id);

    const ee3 = await ee3_fetch;
    if (ee3) {
        if (await download_from_response(`${path}/ee3.mp4`, ee3)) {
            paths[`${path}/ee3.mp4`] = sources.ee3;
        }
    }

    const xprime_nas = await xprime_nas_fetch;
    if (xprime_nas) {
        if (
            await download_from_link(
                `${path}/xprime_nas.mp4`,
                xprime_nas,
                `bytes=0-${(5 * 1024 * 1024).toString()}`
            )
        ) {
            paths[`${path}/xprime_nas.mp4`] = sources.xprime_nas;
        }
    }

    const xprime_primebox = await xprime_primebox_fetch;
    if (xprime_primebox) {
        if (
            await download_from_link(
                `${path}/xprime_primebox.mp4`,
                xprime_primebox,
                `bytes=0-${(5 * 1024 * 1024).toString()}`
            )
        ) {
            paths[`${path}/xprime_primebox.mp4`] = sources.xprime_primebox;
        }
    }

    const videoInfo = await pickBestVideo(Object.keys(paths));

    fs.rmSync(path, { recursive: true, force: true });

    const best_source = await paths[videoInfo.path](tmdb_id);

    if (typeof best_source === "string") {
        success = await download_from_link(
            `./cache/movies/${tmdb_id}.mp4`,
            best_source
        );
    }
    success = await download_from_response(
        `./cache/movies/${tmdb_id}.mp4`,
        best_source
    );

    await jsonLock.withLock("./cache/index.json", async () => {
        const raw = promises.readFile("./cache/index.json");
        let data = JSON.parse((await raw).toString());
        data[tmdb_id] = {
            path: `./cache/movies/${tmdb_id}.mp4`,
            quality: [videoInfo.width, videoInfo.height, videoInfo.bitrate],
            status: "cached",
            last_fetched: Date.now(),
        };

        promises.writeFile("./cache/index.json", JSON.stringify(data));
    });

    return success;
}

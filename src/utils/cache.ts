import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import type { ProviderContext, ScrapeResult } from "./types";

let dbPromise: Promise<Database<sqlite3.Database, sqlite3.Statement>>;

/** Initialize (or reuse) the SQLite database connection */
async function getDb() {
    if (!dbPromise) {
        dbPromise = open({
            filename: "cache.sqlite",
            driver: sqlite3.Database,
        }).then(async (db) => {
            // Create table if missing
            await db.run(`
        CREATE TABLE IF NOT EXISTS cache (
          ctx_key     TEXT PRIMARY KEY,
          result_json TEXT NOT NULL,
          expires_at  INTEGER NOT NULL
        )
      `);
            return db;
        });
    }
    return dbPromise;
}

/** Serialize only relevant parts of the context into a stable key */
function makeKey(ctx: ProviderContext): string {
    return ctx.type === "movie"
        ? JSON.stringify({
              type: ctx.type,
              id: ctx.id,
          })
        : JSON.stringify({
              type: ctx.type,
              id: ctx.id,
              season: ctx.season,
              episode: ctx.episode,
          });
}

/**
 * Save a ScrapeResult in cache under the given context key,
 * with a 7‑day expiration.
 */
export async function saveCache(
    ctx: ProviderContext,
    result: ScrapeResult
): Promise<void> {
    const db = await getDb();
    const key = makeKey(ctx);
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days in ms

    // Serialize Headers inside fetchInformation entries
    const serializableSources: Record<string, any> = {};
    for (const [quality, info] of Object.entries(result.sources)) {
        const entry: any = { url: info.url };
        if (info.headers instanceof Headers) {
            entry.headers = Object.fromEntries(info.headers.entries());
        } else if (info.headers) {
            entry.headers = info.headers;
        }
        if (info.body) {
            entry.body = info.body;
        }
        serializableSources[quality] = entry;
    }

    const toStore = {
        qualities: result.qualities,
        sources: serializableSources,
        cost: result.cost,
    };

    const json = JSON.stringify(toStore);

    await db.run(
        `INSERT INTO cache (ctx_key, result_json, expires_at)
     VALUES (?, ?, ?)
     ON CONFLICT(ctx_key) DO UPDATE SET
       result_json = excluded.result_json,
       expires_at  = excluded.expires_at`,
        key,
        json,
        expiresAt
    );
}

/**
 * Try to load a ScrapeResult from cache for the given context.
 * Returns undefined if missing or expired.
 */
export async function fromCache(
    ctx: ProviderContext
): Promise<ScrapeResult | undefined> {
    const db = await getDb();
    const key = makeKey(ctx);
    const row = await db.get<{
        result_json: string;
        expires_at: number;
    }>(
        `SELECT result_json, expires_at
     FROM cache
     WHERE ctx_key = ?`,
        key
    );

    if (!row) {
        // no entry
        return undefined;
    }
    if (row.expires_at < Date.now()) {
        // expired—clean up and report miss
        await db.run(`DELETE FROM cache WHERE ctx_key = ?`, key);
        return undefined;
    }

    try {
        const parsed = JSON.parse(row.result_json) as {
            qualities: ScrapeResult["qualities"];
            sources: Record<string, any>;
            cost: number;
        };

        // Rehydrate Headers inside fetchInformation entries
        const rehydratedSources: ScrapeResult["sources"] = {};
        for (const [quality, info] of Object.entries(parsed.sources)) {
            const fetchInfo: any = { url: info.url };
            if (info.headers) {
                fetchInfo.headers = new Headers(info.headers);
            }
            if (info.body) {
                fetchInfo.body = info.body;
            }
            rehydratedSources[quality as keyof typeof rehydratedSources] =
                fetchInfo;
        }

        return {
            qualities: parsed.qualities,
            sources: rehydratedSources,
            cost: parsed.cost,
        } as ScrapeResult;
    } catch {
        // corrupted data? delete and return miss
        await db.run(`DELETE FROM cache WHERE ctx_key = ?`, key);
        return undefined;
    }
}

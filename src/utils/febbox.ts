import https from "https";
import { IncomingMessage } from "http";
import { createGunzip } from "zlib"; // TY CHATGPT ::33

interface Flow {
    traffic_usage_mb?: number;
    traffic_limit_mb?: number;
    [key: string]: any;
}

interface ApiResponse {
    data: {
        flow: Flow;
        [key: string]: any;
    };
    [key: string]: any;
}

/**
 * Checks if the current traffic usage exceeds the quota.
 *
 * @param UI_TOKEN - Your PHP session token (PHPSESSID)
 * @returns true if over quota, false otherwise
 */
export async function is_over_quota(UI_TOKEN: string): Promise<boolean> {
    const options = {
        hostname: "www.febbox.com",
        port: 443,
        path: "/console/user_cards",
        method: "GET",
        headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "Cache-Control": "no-cache",
            Cookie: `ui=${UI_TOKEN};`,
        },
    };

    return new Promise<boolean>((resolve, reject) => {
        const req = https.request(options, (res: IncomingMessage) => {
            const encoding = res.headers["content-encoding"];
            let stream: NodeJS.ReadableStream = res;

            // Decompress if gzipped
            if (encoding === "gzip") {
                const gunzip = createGunzip();
                stream = res.pipe(gunzip);
            }

            const chunks: Buffer[] = [];
            stream.on("data", (chunk: Buffer) => chunks.push(chunk));
            stream.on("end", () => {
                try {
                    const buffer = Buffer.concat(chunks);
                    const json: ApiResponse = JSON.parse(
                        buffer.toString("utf8")
                    );
                    const flow = json.data.flow;

                    const used = Number(flow.traffic_usage_mb ?? 0);
                    const limit = Number(flow.traffic_limit_mb ?? 0);
                    if (isNaN(used) || isNaN(limit)) {
                        throw new Error("Invalid numeric values in flow data");
                    }

                    resolve(used > limit);
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on("error", (err) => reject(err));
        req.end();
    });
}

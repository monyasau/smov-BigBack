import { Request, Response } from "express";
import fetch from "node-fetch";
import { URL } from "node:url";

const web_server_url = `http://${process.env.HOST || "0.0.0.0"}:${process.env.PORT || 3000}`;

/**
 * @description Proxies M3U8 files and replaces the content to point to bigback.
 * @param url The URL of the M3U8 file to proxy
 * @param headers headers to include in the request
 */
export async function proxyM3U8(url: string, headers: Record<string, string>, res: Response) {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
                ...headers,
            },
        });

        if (!response.ok) {
            res.status(response.status).send(response.statusText);
            return;
        }

        const m3u8 = await response.text();
        const lines = m3u8.split("\n");
        const newLines: string[] = [];

        if (m3u8.includes("RESOLUTION=")) {
            for (const line of lines) {
                if (line.startsWith("#")) {
                    if (line.startsWith("#EXT-X-KEY:") || line.startsWith("#EXT-X-MEDIA:")) {
                        const regex = /https?:\/\/[^\""\s]+/g;
                        const match = regex.exec(line);
                        if (match) {
                            const proxyPath = line.startsWith("#EXT-X-KEY:") ? "/ts-proxy" : "/m3u8-proxy";
                            const proxyUrl = `${web_server_url}${proxyPath}?url=${encodeURIComponent(match[0])}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
                            newLines.push(line.replace(regex, proxyUrl));
                        } else {
                            newLines.push(line);
                        }
                    } else {
                        newLines.push(line);
                    }
                } else if (line.trim()) {
                    const uri = new URL(line, url);
                    newLines.push(`${web_server_url}/m3u8-proxy?url=${encodeURIComponent(uri.href)}&headers=${encodeURIComponent(JSON.stringify(headers))}`);
                } else {
                    newLines.push(line);
                }
            }
        } else {
            for (const line of lines) {
                if (line.startsWith("#")) {
                    if (line.startsWith("#EXT-X-KEY:") || line.startsWith("#EXT-X-MEDIA:")) {
                        const regex = /https?:\/\/[^\""\s]+/g;
                        const match = regex.exec(line);
                        if (match) {
                            const proxyPath = line.startsWith("#EXT-X-KEY:") ? "/ts-proxy" : "/m3u8-proxy";
                            const proxyUrl = `${web_server_url}${proxyPath}?url=${encodeURIComponent(match[0])}&headers=${encodeURIComponent(JSON.stringify(headers))}`;
                            newLines.push(line.replace(regex, proxyUrl));
                        } else {
                            newLines.push(line);
                        }
                    } else {
                        newLines.push(line);
                    }
                } else if (line.trim()) {
                    const uri = new URL(line, url);
                    newLines.push(`${web_server_url}/ts-proxy?url=${encodeURIComponent(uri.href)}&headers=${encodeURIComponent(JSON.stringify(headers))}`);
                } else {
                    newLines.push(line);
                }
            }
        }

        res.set({
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
        });

        res.send(newLines.join("\n"));
    } catch (err: any) {
        res.status(500).send(err.message);
    }
}

/**
 * @description Proxies TS files
 * @param url The URL to proxy
 * @param headers headers to include in request
 */
export async function proxyTs(url: string, headers: Record<string, string>, req: Request, res: Response) {
    try {
        const response = await fetch(url, {
            method: req.method,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
                ...headers,
            },
        });

        if (!response.ok) {
            res.status(response.status).send(response.statusText);
            return;
        }

        res.set({
            "Content-Type": "video/mp2t",
            "Access-Control-Allow-Origin": "*",
        });

        response.body?.pipe(res);
    } catch (err: any) {
        res.status(500).send(err.message);
    }
}
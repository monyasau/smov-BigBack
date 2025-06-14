import { PassThrough } from "stream";
import ffmpeg from "fluent-ffmpeg";
import { mediaQuality } from "./types";

export async function probeMediaQuality(
    url: string,
    headers: Headers
): Promise<mediaQuality> {
    // Download the first 8 MB (initialization segment)

    headers.set("Range", "bytes=0-8388607");

    console.log(headers);

    const res = await fetch(url, {
        headers,
    });
    if (!(res.ok || res.status === 206)) {
        throw new Error(`Unexpected HTTP status ${res.status}`);
    }

    // Pipe the partial data into ffprobe
    const stream = new PassThrough();
    if (res.body) {
        const reader = res.body.getReader();
        async function push() {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                stream.write(value);
            }
            stream.end();
        }
        push();
    }

    return new Promise<mediaQuality>((resolve, reject) => {
        ffmpeg(stream).ffprobe((err, info) => {
            if (err) return reject(err);
            const videoStream = info.streams?.find(
                (s) => s.codec_type === "video"
            );
            if (!videoStream || !videoStream.height) {
                return resolve("unknown");
            }

            const height = videoStream.height;
            let quality: mediaQuality;

            switch (true) {
                case height <= 360:
                    quality = 360;
                    break;
                case height <= 480:
                    quality = 480;
                    break;
                case height <= 720:
                    quality = 720;
                    break;
                case height <= 1080:
                    quality = 1080;
                    break;
                case height >= 2160:
                    quality = "4K";
                    break;
                default:
                    quality = "unknown";
            }

            resolve(quality);
        });
    });
}

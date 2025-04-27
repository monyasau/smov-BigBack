import ffmpeg from "fluent-ffmpeg";

export type VideoInfo = {
    path: string;
    width: number;
    height: number;
    bitrate: number;
};

export function getVideoInfo(path: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(path, (err, metadata) => {
            if (err) {
                return reject(err);
            }

            const videoStream = metadata.streams.find(
                (stream) => stream.codec_type === "video"
            );

            if (!videoStream) {
                return reject(new Error(`No video stream found in ${path}`));
            }

            const width = videoStream.width || 0;
            const height = videoStream.height || 0;
            const bitrate = parseInt(
                (
                    videoStream.bit_rate ||
                    metadata.format.bit_rate ||
                    "0"
                ).toString(),
                10
            );

            resolve({
                path,
                width,
                height,
                bitrate,
            });
        });
    });
}

export async function pickBestVideo(paths: string[]): Promise<VideoInfo> {
    const infos = await Promise.all(paths.map(getVideoInfo));

    // Sort by resolution first, then by bitrate
    infos.sort((a, b) => {
        const resA = a.width * a.height;
        const resB = b.width * b.height;
        if (resB !== resA) {
            return resB - resA; // Higher resolution wins
        }
        return b.bitrate - a.bitrate; // If same resolution, higher bitrate wins
    });

    return infos[0];
}

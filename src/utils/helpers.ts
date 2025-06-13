import { mediaQuality } from "./types";

export const mapQuality = (raw: string): mediaQuality => {
    switch (raw.toUpperCase()) {
        case "360P":
            return 360;
        case "480P":
            return 480;
        case "720P":
            return 720;
        case "1080P":
            return 1080;
        case "4K":
            return "4K";
        case "ORG":
            return "ORG";
        case "AUTO":
            return "auto";
        default:
            return "unknown";
    }
};

export const unmapQuality = (mapped: mediaQuality): string => {
    switch (mapped) {
        case 360:
            return "360P";
        case 480:
            return "480P";
        case 720:
            return "720P";
        case 1080:
            return "1080P";
        case "4K":
            return "4K";
        case "ORG":
            return "ORG";
        case "auto":
            return "AUTO";
        default:
            return "UNKNOWN";
    }
};

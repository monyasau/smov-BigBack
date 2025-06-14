// limiter.ts
import { Request, Response, NextFunction } from "express";

const allowed_origins = [
    // WIP; DONT USE YET FFS
    "https://beta.pstream.org",
    "https://pstream.org",
    "https://sudo-flix.nl",
    "https://willow.arlen.icu",
];

export function handleCors(
    req: Request,
    res: Response,
    next: NextFunction
): void {}

// limiter.ts
import { Request, Response, NextFunction } from "express";

const maxStreams: number = 250;
const activeStreams: { [key: string]: number } = {};
var totalStreams: number = 0;

export function limitConcurrentStreams(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        const userIP = req.ip || "";

        if (!userIP) {
            res.status(400).send("Could not identify client IP");
            return;
        }

        if (!activeStreams[userIP]) activeStreams[userIP] = 0;

        if (activeStreams[userIP] >= 2) {
            res.status(429).send(
                "Too many concurrent streams, are yo tryna scrape?"
            );
            return;
        }

        if (totalStreams >= maxStreams) {
            res.status(503).send(
                "We're currently at max capacity, Please try again later."
            );
        }

        activeStreams[userIP]++;
        totalStreams++;

        res.setHeader("total_streams", totalStreams);

        res.on("close", () => {
            activeStreams[userIP]--;
            totalStreams--;
            if (activeStreams[userIP] <= 0) delete activeStreams[userIP];
        });

        next();
    } catch (err) {
        console.error("Limiter error:", err);
        next(err);
    }
}

// Uncomment if you need this function
export function resetStreamCount(req: Request, res: Response): void {
    const userIP = req.ip || "";
    if (activeStreams[userIP]) {
        activeStreams[userIP] = 0;
        delete activeStreams[userIP];
    }
}

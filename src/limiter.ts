// limiter.ts
import { Request, Response, NextFunction} from "express";

const activeStreams: { [key: string]: number } = {};

export function limitConcurrentStreams(req: Request, res: Response, next: NextFunction): void {
  try {
    const userIP = req.ip || "";
    
    // Fixed the IP check - it was incorrectly returning early if IP exists
    if(!userIP) {
      res.status(400).send('Could not identify client IP');
      return;
    }

    if (!activeStreams[userIP]) activeStreams[userIP] = 0;

    if (activeStreams[userIP] >= 2) {
      res.status(429).send('Too many concurrent streams');
      return;
    }

    activeStreams[userIP]++;

    res.on('close', () => {
      activeStreams[userIP]--;
      if (activeStreams[userIP] <= 0) delete activeStreams[userIP];
    });

    next();
  }
  catch (err) {
    console.error('Limiter error:', err);
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
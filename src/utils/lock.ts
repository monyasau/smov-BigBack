// json-lock.ts
import { promises as fs } from "fs";
import * as path from "path";

export class JsonLock {
    private lockDir: string;
    private retryDelay: number;
    private maxRetries: number;

    constructor(
        lockDir: string = "./locks",
        retryDelay = 100,
        maxRetries = 50
    ) {
        this.lockDir = lockDir;
        this.retryDelay = retryDelay;
        this.maxRetries = maxRetries;
    }

    private getLockPath(jsonPath: string) {
        const name = path.basename(jsonPath).replace(/\W/g, "_");
        return path.join(this.lockDir, name + ".lock");
    }

    private sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async acquire(jsonPath: string) {
        await fs.mkdir(this.lockDir, { recursive: true });
        const lockPath = this.getLockPath(jsonPath);
        let attempts = 0;
        while (true) {
            try {
                const handle = await fs.open(lockPath, "wx");
                await handle.close();
                return;
            } catch (err: any) {
                if (err.code !== "EEXIST" || attempts++ > this.maxRetries) {
                    throw new Error(`Failed to acquire lock on ${jsonPath}`);
                }
                await this.sleep(this.retryDelay);
            }
        }
    }

    async release(jsonPath: string) {
        const lockPath = this.getLockPath(jsonPath);
        await fs.unlink(lockPath).catch(() => {});
    }

    async withLock<T>(
        jsonPath: string,
        callback: () => Promise<T>
    ): Promise<T> {
        await this.acquire(jsonPath);
        try {
            return await callback();
        } finally {
            await this.release(jsonPath);
        }
    }
}

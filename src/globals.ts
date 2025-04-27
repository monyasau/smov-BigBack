import { JsonLock } from "./utils/lock";

export const USER_AGENT = "Mozilla/5.0 (compatible; ProxyServer/1.0)";
export const jsonLock = new JsonLock("./tmp/locks");

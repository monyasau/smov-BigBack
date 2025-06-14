import { Scraper } from "../utils/types";

import { scrape as ee3 } from "./sources/ee3";
import { scrape as febbox } from "./sources/feds";
import { scrape as primebox } from "./sources/primebox";

// Probaly not the best way. But its the way im doing it. Complaints go straight into the shredder
export const movieOnlyScrapers: Scraper[] = [ee3];
export const showOnlyScrapers: Scraper[] = [];
export const sharedScrapers: Scraper[] = [febbox]; // Primebox is broken rn for some reason ): (primebox works but not for me for some reason (as in just not with this scraper))

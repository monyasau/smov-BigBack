import { Scraper } from "../utils/types";

import { scrape as ee3 } from "./sources/ee3";
import { scrape as febbox } from "./sources/feds";

// Probaly not the best way. But its the way im doing it. Complaints go straight into the shredder
export const movieOnlyScrapers: Scraper[] = [ee3];
export const showOnlyScrapers: Scraper[] = [];
export const sharedScrapers: Scraper[] = [febbox];

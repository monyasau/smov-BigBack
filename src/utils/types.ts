export interface fetchInformation {
    url: string;
    headers?: HeadersInit;
    body?: BodyInit;
}

export interface ScrapeResult {
    qualities: mediaQuality[];
    sources: Partial<Record<mediaQuality, fetchInformation>>; // `Response` is from `fetch`
    cost: number; // So we can provide wichever source is the cheapest for us to provide.
}

export type Scraper = (
    ctx: ProviderContext
) => Promise<ScrapeResult | undefined>;

export type mediaQuality =
    | 360
    | 480
    | 720
    | 1080
    | "4K"
    | "ORG"
    | "auto"
    | "unknown";

export interface MovieProviderContext {
    type: "movie";
    id: number;
    quality?: mediaQuality;
    user_agent?: string;
    range?: string;
}

export interface ShowProviderContext {
    type: "tv" | "show";
    id: number;
    season: number;
    episode: number;
    quality?: mediaQuality;
    user_agent?: string;
    range?: string;
}

export type ProviderContext = MovieProviderContext | ShowProviderContext;

export type VideoSource =
    | {
          type: "link";
          source: string; // a URL string
      }
    | {
          type: "response";
          source: globalThis.Response; // globalThis.Response
      }
    | {
          type: "filepath";
          source: string; // an absolute filepath
      };

interface Genre {
    id: number;
    name: string;
}

interface ProductionCompany {
    id: number;
    logo_path: string | null;
    name: string;
    origin_country: string;
}

interface ProductionCountry {
    iso_3166_1: string;
    name: string;
}

interface SpokenLanguage {
    iso_639_1: string;
    name: string;
}

export interface MovieDetails {
    adult: boolean;
    backdrop_path: string | null;
    budget: number;
    genres: Genre[];
    homepage: string | null;
    id: number;
    imdb_id: string | null;
    original_language: string;
    original_title: string;
    overview: string | null;
    popularity: number;
    poster_path: string | null;
    production_companies: ProductionCompany[];
    production_countries: ProductionCountry[];
    release_date: string; // e.g. "1999-10-15"
    revenue: number;
    runtime: number | null; // in minutes
    spoken_languages: SpokenLanguage[];
    status: string; // e.g. "Released"
    tagline: string | null;
    title: string;
    video: boolean;
    vote_average: number; // e.g. 8.4
    vote_count: number;
    // if TMDB later adds fields you might care about, you can still access them:
    [key: string]: any;
}

interface Network {
    name: string;
    id: number;
    logo_path: string | null;
    origin_country: string;
}

interface CreatedBy {
    id: number;
    credit_id: string;
    name: string;
    gender: number | null;
    profile_path: string | null;
}

interface LastEpisodeToAir {
    air_date: string; // e.g. "2020-05-03"
    episode_number: number;
    id: number;
    name: string;
    overview: string;
    production_code: string;
    season_number: number;
    still_path: string | null;
    vote_average: number;
    vote_count: number;
}

interface Season {
    air_date: string | null;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
}

export interface TvDetails {
    backdrop_path: string | null;
    created_by: CreatedBy[];
    episode_run_time: number[]; // typical runtime(s) in minutes
    first_air_date: string; // e.g. "2008-09-22"
    genres: Genre[];
    homepage: string | null;
    id: number;
    in_production: boolean;
    languages: string[]; // e.g. ["en"]
    last_air_date: string; // most recent air date
    last_episode_to_air: LastEpisodeToAir;
    name: string; // show title
    next_episode_to_air: LastEpisodeToAir | null;
    networks: Network[];
    number_of_episodes: number;
    number_of_seasons: number;
    origin_country: string[]; // e.g. ["US"]
    original_language: string;
    original_name: string;
    overview: string | null;
    popularity: number;
    poster_path: string | null;
    production_companies: ProductionCompany[];
    seasons: Season[];
    status: string; // e.g. "Ended", "Returning Series"
    tagline: string | null;
    type: string; // e.g. "Scripted"
    vote_average: number;
    vote_count: number;
    // fallback for any extra fields
    [key: string]: any;
}

export interface ExternalIds {
    id: number;
    imdb_id: string;
    wikidata_id: string;
    [key: string]: any;
}

export interface FebboxResponse {
    name: string;
    size: string;
    streams: FebboxStream[];
    subtitles: FebboxSubtitle[];
}

export interface FebboxStream {
    type: string;
    url: string;
    quality: string;
}

export interface FebboxSubtitle {
    langCode: string;
    language: string;
    subtitleName: string;
    url: string;
}

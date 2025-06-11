export type ScrapeResult =
    | {
          qualities: string[];
          sources: Record<string, globalThis.Response | string>; // `Response` is from `fetch`
      }
    | undefined;

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

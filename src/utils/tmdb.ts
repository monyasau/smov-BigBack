import { ExternalIds, MovieDetails, TvDetails } from "./types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function getExternalIds(tmdbId: number): Promise<ExternalIds> {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/movie/${tmdbId}/external_ids`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_KEY}`,
                },
            }
        );
        return await response.json();
    } catch (error) {
        console.error("Error fetching external IDs:", error);
        throw error;
    }
}

export async function getMovieDetails(tmdbId: number): Promise<MovieDetails> {
    const url = `${TMDB_BASE_URL}/tv/${tmdbId}`;
    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.TMDB_KEY}` },
    });

    if (!res.ok) {
        throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as MovieDetails;
    return data;
}

export async function getTvDetails(tvId: number): Promise<TvDetails> {
    const url = `${TMDB_BASE_URL}/tv/${tvId}`;

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.TMDB_KEY}` },
    });
    if (!res.ok) {
        throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as TvDetails;
    return data;
}

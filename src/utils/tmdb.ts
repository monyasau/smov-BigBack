const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function getExternalIds(tmdbId: number): Promise<any> {
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

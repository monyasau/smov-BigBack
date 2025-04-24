async function fetch_movie(id: string, ee3_auth: string) {
    let movie_id = await fetch(
        `https://borg.rips.cc/api/collections/movies/records?page=1&perPage=48&filter=tmdb_data.id%20~%20${id}`,
        {
            method: "GET",
            headers: { Authorization: ee3_auth, Origin: "https://ee3.me" },
        }
    ).then(async (resp) => {
        if (resp.status != 200) return;

        var ContentType = resp.headers.get("content-type")?.split("; ");

        if (!ContentType) return;
        if (ContentType[0].toLowerCase() != "application/json") return;

        const jsonResponse = await resp.json();
        try {
            return jsonResponse.items[0].video;
        } catch (error) {
            return;
        }
    });

    if (!movie_id) return;

    let key = await fetch(`https://borg.rips.cc/video/${movie_id}/key`, {
        headers: { Authorization: ee3_auth, Origin: "https://ee3.me" },
    }).then(async (resp) => {
        if (resp.status != 200) return;

        var ContentType = resp.headers.get("content-type")?.split("; ");

        if (!ContentType) return;
        if (ContentType[0].toLowerCase() != "application/json") return;

        const jsonResponse = await resp.json();
        try {
            return jsonResponse.key;
        } catch (error) {
            return;
        }
    });

    return `${movie_id}?k=${key}`;
}

async function scrape(tmdb_id: string) {
    var mov_data = await fetch_movie(
        tmdb_id,
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjb2xsZWN0aW9uSWQiOiJfcGJfdXNlcnNfYXV0aF8iLCJleHAiOjE3NDY2MjI4MDksImlkIjoiMDRzOHRtYXczMHpyYnFqIiwidHlwZSI6ImF1dGhSZWNvcmQifQ.tVDJxT45eIBmSWHcV22xvL6DEqqlZt4uZVwoTDF-Gy4"
    );

    return await fetch(`https://borg.rips.cc/video/${mov_data}`, {
        headers: { Origin: "https://ee3.me" },
    });
}

export = scrape;

// My Api key from TMDB
const api = "api_key=65088f30b11eb50d43a411d49c206b5f";

// base url of the site
const base_url = "https://api.themoviedb.org/3";

// img url
const img_url = "https://image.tmdb.org/t/p/original";

// requests for the movies data
let requests = [];
for (let i = 0; i <= 8; i++) {
    requests[i] = `${base_url}/search/movie?query=${movies["movie" + i]}&${api}`;
}

let firstGenreID;
let secondGenreID;

// used to truncate the string
function truncate(str, n) {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
}

// banner
fetch(requests[0])
    .then((res) => res.json())
    .then((data) => {
        console.log(data.results);

        const setMovie = data.results[0];
        firstGenreID = setMovie.genre_ids[0];
        secondGenreID = setMovie.genre_ids[1];
        console.log(setMovie);
        console.log(firstGenreID);
        console.log(secondGenreID);
        var banner = document.getElementById("banner");
        var banner_title = document.getElementById("banner_title");
        var banner_desc = document.getElementById("banner_desc");
        banner.style.backgroundImage = "url(" + img_url + setMovie.backdrop_path + ")";
        banner_desc.innerText = truncate(setMovie.overview, 150);
        banner_title.innerText = `Movies like ${setMovie.original_title}`;
    })

// top recommendations
const headrow = document.getElementById("headrow");
const row = document.createElement("div");
row.className = "row";
row.classList.add("top_row");
headrow.appendChild(row);
const title = document.createElement("h2");
title.className = "row_title";
title.innerText = "Top Recommendations";
row.appendChild(title);
const row_posters = document.createElement("div");
row_posters.className = "row_posters";
row.appendChild(row_posters);
for (let i = 1; i <= 8; i++) {
    fetch(requests[i])
        .then((res) => res.json())
        .then((data) => {
            const movie = data.results[0];
            const poster = document.createElement("img");
            poster.className = "row_posterLarge";
            poster.src = img_url + movie.poster_path;
            row_posters.appendChild(poster);
        });
}

const waitForFirstGenreID = () => {
    return new Promise((resolve) => {
        const checkFirstGenreID = () => {
            if (firstGenreID) {
                resolve();
            } else {
                setTimeout(checkFirstGenreID, 20);
            }
        };
        checkFirstGenreID();
    });
};
// first genre recommendations

waitForFirstGenreID().then(() => {
    fetch(`${base_url}/discover/movie?${api}&with_genres=${firstGenreID}`)
        .then((res) => res.json())
        .then((data) => {
            const headrow = document.getElementById("headrow");
            const row = document.createElement("div");
            row.className = "row";
            row.classList.add("netflixrow");
            headrow.appendChild(row);
            const title = document.createElement("h2");
            title.className = "row_title";
            title.innerText = `Top ${genreIdToName[firstGenreID]} Movies`;
            row.appendChild(title);
            const row_posters = document.createElement("div");
            row_posters.className = "row_posters";
            row.appendChild(row_posters);
            for (let i = 1; i <= 8; i++) {
                const poster = document.createElement("img");
                poster.className = "row_posterLarge";
                poster.src = img_url + data.results[i].poster_path;
                row_posters.appendChild(poster);
            }
        });
});

// map of the genre names
const genreIdToName = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
};
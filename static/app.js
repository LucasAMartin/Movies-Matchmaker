function changeMovie() {
    const urlParams = new URLSearchParams(window.location.search);
    const movieName = this.id;
    const cleanedMovieName = movieName.replace(/[^a-zA-Z0-9 ]/g, "");
    urlParams.set('movie', encodeURI(cleanedMovieName));
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    window.history.pushState({}, '', newUrl);
    location.reload();
}

function launchMoviePlayer() {
    let bannerID = bannerMovie.id;
    let IMDBurl = `${base_url}/movie/${bannerID}/external_ids?${api}`;
    fetch(IMDBurl)
        .then((res) => res.json())
        .then((data) => {
            console.log(IMDBurl);
            let imdbID = data.imdb_id;
            let movieURL = `https://vidsrc.me/embed/${imdbID}/`;
            window.open(movieURL, "_blank");
        })
}


// My Api key from TMDB
const api = "api_key=65088f30b11eb50d43a411d49c206b5f";

// base url of the site
const base_url = "https://api.themoviedb.org/3";

// img url
const img_url = "https://image.tmdb.org/t/p/original";

const MAX_POSTERS = 12;

// requests for the movies data
let requests = [];
let bannerRequest = `${base_url}/search/movie?query=${movies["movie0"]}&${api}`;
let setMovie;
let bannerMovie;

// fetch the information for the banner movies
fetch(bannerRequest)
    .then((res) => res.json())
    .then((data) => {
        // testing if movie is in database or not
        // if not manually set the url
        console.log(data.results)
        setMovie = data.results[0];
        if (setMovie.id === 893712) {
            bannerRequest = `${base_url}/search/movie?query=${choice}&${api}`;
        }
        // set the banner movie
        fetch(bannerRequest)
            .then((res) => res.json())
            .then((data) => {
                bannerMovie = data.results[0];
                firstGenreID = bannerMovie.genre_ids[0];
                secondGenreID = bannerMovie.genre_ids[1];
                var banner = document.getElementById("banner");
                var banner_title = document.getElementById("banner_title");
                var banner_desc = document.getElementById("banner_desc");
                banner.style.backgroundImage = "url(" + img_url + bannerMovie.backdrop_path + ")";
                banner_desc.innerText = truncate(bannerMovie.overview, 350);
                banner_title.innerText = `Movies like ${bannerMovie.title}`;
            })
    })

// if the banner movie is not in database, we can't give recommendations
// in this case just display the trending movies
const waitForSetMovie = () => {
    return new Promise((resolve) => {
        const checkSetMovie = () => {
            if (setMovie) {
                resolve();
            } else {
                setTimeout(checkSetMovie, 5);
            }
        };
        checkSetMovie();
    });
};

waitForSetMovie().then(() => {
    for (let i = 0; i <= 12; i++) {
        requests[i] = `${base_url}/search/movie?query=${movies["movie" + i]}&${api}`;
        if (setMovie.id === 893712) {
            requests[1] = `${base_url}/trending/all/week?${api}&language=en-US`;
            break;
        }
    }
});


let firstGenreID;
let secondGenreID;

// used to truncate the string
function truncate(str, n) {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
}

waitForSetMovie().then(() => {
    if (!(setMovie.id === 893712)) {
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
        for (let i = 1; i <= MAX_POSTERS; i++) {
            fetch(requests[i])
                .then((res) => res.json())
                .then((data) => {
                    const movie = data.results[0];
                    const poster = document.createElement("img");
                    poster.className = "row_posterLarge";
                    poster.src = img_url + movie.poster_path;
                    poster.setAttribute("id", movie.title);
                    poster.onclick = changeMovie;
                    row_posters.appendChild(poster);
                });
        }
    } else {
        fetch(requests[1])
            .then((res) => res.json())
            .then((data) => {
                const headrow = document.getElementById("headrow");
                const row = document.createElement("div");
                row.className = "row";
                row.classList.add("popularrow");
                headrow.appendChild(row);
                const title = document.createElement("h2");
                title.className = "row_title";
                title.innerText = "Top Recommendations";
                row.appendChild(title);
                const row_posters = document.createElement("div");
                row_posters.className = "row_posters";
                row.appendChild(row_posters);
                data.results.forEach(movie => {
                    if (movie.media_type === 'tv') {
                        return;
                    }
                    const poster = document.createElement("img");
                    poster.className = "row_posterLarge";
                    poster.id = movie.id;
                    poster.src = img_url + movie.poster_path;
                    poster.setAttribute("id", movie.title);
                    poster.onclick = changeMovie;
                    row_posters.appendChild(poster);
                });
            });
    }
});


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
    if (firstGenreID == null)
        firstGenreID = 28;
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
            for (let i = 1; i <= MAX_POSTERS; i++) {
                const poster = document.createElement("img");
                poster.className = "row_posterLarge";
                poster.src = img_url + data.results[i].poster_path;
                poster.setAttribute("id", data.results[i].title);
                poster.onclick = changeMovie;
                row_posters.appendChild(poster);
            }
        });
});

const waitForSecondGenreID = () => {
    return new Promise((resolve) => {
        const checkSecondGenreID = () => {
            if (secondGenreID) {
                resolve();
            } else {
                setTimeout(checkSecondGenreID, 20);
            }
        };
        checkSecondGenreID();
    });
};
// second genre recommendations

waitForSecondGenreID().then(() => {
    if (secondGenreID == null)
        secondGenreID = 10751;
    fetch(`${base_url}/discover/movie?${api}&with_genres=${secondGenreID}`)
        .then((res) => res.json())
        .then((data) => {
            const headrow = document.getElementById("headrow");
            const row = document.createElement("div");
            row.className = "row";
            row.classList.add("netflixrow");
            headrow.appendChild(row);
            const title = document.createElement("h2");
            title.className = "row_title";
            title.innerText = `Top ${genreIdToName[secondGenreID]} Movies`;
            row.appendChild(title);
            const row_posters = document.createElement("div");
            row_posters.className = "row_posters";
            row.appendChild(row_posters);
            for (let i = 1; i <= MAX_POSTERS; i++) {
                const poster = document.createElement("img");
                poster.className = "row_posterLarge";
                poster.src = img_url + data.results[i].poster_path;
                poster.setAttribute("id", data.results[i].title);
                poster.onclick = changeMovie;
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
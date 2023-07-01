// My Api key from TMDB
const api = "api_key=65088f30b11eb50d43a411d49c206b5f";

// base url of the site
const base_url = "https://api.themoviedb.org/3";

// img url
const img_url = "https://image.tmdb.org/t/p/original";

// request for the banner movie, hold this separate, so it can be accessed easier
let bannerMovie;
let bannerMovieResults;

// requests for the main recommendations

// the max number of posters I want displayed

// the top two genre for the banner movie
// used to customize movies shown
let firstGenreID;
let secondGenreID


// main functions, displays a banner and 3 rows
requestBanner();
addBannerRow();
addGenreRow1();
addGenreRow2();

// changes the movie in the banner to a new movie, is called when a movie poster is pressed
// this.id is the id of the banner that it is pressed from
function changeMovie() {
    const urlParams = new URLSearchParams(window.location.search);
    const movieName = this.id;
    const cleanedMovieName = movieName.replace(/[^a-zA-Z0-9 ]/g, "");
    urlParams.set('movie', encodeURI(cleanedMovieName));
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    window.history.pushState({}, '', newUrl);
    location.reload();
}

// takes the TMDB id from the banner, uses it to get the IMDB id, then uses that to launch a movie player
function launchMoviePlayer() {
    let bannerID = bannerMovie.id;
    let IMDBurl = `${base_url}/movie/${bannerID}/external_ids?${api}`;
    fetch(IMDBurl)
        .then((res) => res.json())
        .then((data) => {
            let imdbID = data.imdb_id;
            let movieURL = `https://vidsrc.me/embed/${imdbID}/`;
            window.open(movieURL);
        })
}

// fetch the information for the banner movies
function requestBanner() {
    fetch(bannerRequest)
        .then((res) => res.json())
        .then((data) => {
            // testing if movie is in database or not
            // if not manually set the url
            bannerMovieResults = data.results[0];
            // if the movie is not in the db, it will show up as some random anime movie
            // if it has that id, manuallly query for the movie and set it correctly
            if (bannerMovieResults.id === 893712) {
                bannerRequest = `${base_url}/search/movie?query=${choice}&${api}`;
            }
            // set the banner
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
                    banner_desc.innerText = truncateString(bannerMovie.overview, 350);
                    banner_title.innerText = `Movies like ${bannerMovie.title}`;
                })
        })
    // if the banner movie is not in database, we can't give recommendations
// in this case just display the trending movies
    waitForBannerMovieResults().then(() => {
        for (let i = 0; i <= MAX_POSTERS; i++) {
            requests[i] = `${base_url}/search/movie?query=${movies["movie" + i]}&${api}`;
            if (bannerMovieResults.id === 893712) {
                requests[1] = `${base_url}/trending/all/week?${api}&language=en-US`;
                break;
            }
        }
    });
}

function addBannerRow() {
    waitForBannerMovieResults().then(() => {
        if (!(bannerMovieResults.id === 893712)) {
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
}

// first genre recommendations
function addGenreRow1() {
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
}

function addGenreRow2() {
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
}

// used to truncate the string in the banner desc
function truncateString(string, maxLength) {
    if (string && string.length > maxLength) {
        return string.substring(0, maxLength - 1) + "...";
    } else {
        return string;
    }
}

// functions used for waiting for values to be fetched before they are read
function waitForBannerMovieResults() {
    return new Promise((resolve) => {
        const checkBannerMovieResults = () => {
            if (bannerMovieResults) {
                resolve();
            } else {
                setTimeout(checkBannerMovieResults, 10);
            }
        };
        checkBannerMovieResults();
    });
}

function waitForFirstGenreID() {
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
}

function waitForSecondGenreID() {
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
}

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



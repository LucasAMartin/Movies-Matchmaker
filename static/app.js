// img url
const img_url = "https://image.tmdb.org/t/p/original";

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

const bannerMovie = movies[0].results[0];
const MAX_POSTERS = 18;
// main functions, displays a banner and 3 rows
requestBanner();

addRow(movies, "Top Recommendations");
addRow(genre1Movies, `Top ${genreIdToName[genre1Movies.results[0].genre_ids[0]]} Movies`);
addRow(genre2Movies, `Top ${genreIdToName[genre1Movies.results[0].genre_ids[1]]} Movies`);
addRow(actorMovies, `Movies With ${actorMovies[0]}`);


// changes the movie in the banner to a new movie, is called when a movie poster is pressed
// this.id is the id of the banner that it is pressed from
function changeMovie() {
    const urlParams = new URLSearchParams(window.location.search);
    const movieName = this.id;
    const cleanedMovieName = movieName.replace(/[^a-zA-Z0-9 ]/g, "");
    urlParams.set('movie', cleanedMovieName.trim().replace(/\s+/g, ' '));
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    window.history.pushState({}, '', newUrl);
    location.reload();
}

//  Uses the TMDB id to launch a movie player
function launchMoviePlayer() {
    let bannerID = bannerMovie.id;
    let movieURL = `https://vidsrc.me/embed/${bannerID}/`;
    window.open(movieURL);
}

// fetch the information for the banner movies
function requestBanner() {
    if (bannerMovie == null) {
        var banner_title = document.getElementById("banner_title");
        banner_title.innerText = "Retry Search";
        var banner_desc = document.getElementById("banner_desc");
        banner_desc.innerText = "Movie not found in the TMDB database."
        return
    }
    var banner = document.getElementById("banner");
    var banner_title = document.getElementById("banner_title");
    var banner_desc = document.getElementById("banner_desc");
    banner.style.backgroundImage = "url(" + img_url + bannerMovie.backdrop_path + ")";
    banner_desc.innerText = truncateString(bannerMovie.overview, 350);
    banner_title.innerText = bannerMovie.title;
}

// if the banner movie is not in database, we can't give recommendations
// in this case just display the trending movies
function addRow(movieList, category) {
    // top recommendations
    const headrow = document.getElementById("headrow");
    const row = document.createElement("div");
    row.className = "row";
    row.classList.add("top_row");
    headrow.appendChild(row);
    const title = document.createElement("h2");
    title.className = "row_title";
    title.innerText = category;
    row.appendChild(title);
    const row_posters = document.createElement("div");
    row_posters.className = "row_posters";
    row.appendChild(row_posters);
    for (let i = 1; i <= MAX_POSTERS; i++) {
        try {
            let movie;
            if (movieList === movies || movieList === actorMovies) {
                movie = movieList[i].results[0];
            } else {
                movie = movieList.results[i];
            }
            let poster = document.createElement("img");
            poster.className = "row_poster";
            poster.src = img_url + movie.poster_path;
            poster.setAttribute("id", movie.title);
            poster.onclick = changeMovie;
            row_posters.appendChild(poster);
        } catch (error) {
            break;
        }
    }
    const prevButton = document.createElement("button");
    prevButton.className = "scroll-button prev";
    prevButton.innerText = "<";
    prevButton.onclick = () => scrollPosters(prevButton, -1);
    row.appendChild(prevButton);
    const nextButton = document.createElement("button");
    nextButton.className = "scroll-button next";
    nextButton.innerText = ">";
    nextButton.onclick = () => scrollPosters(nextButton, 1);
    row.appendChild(nextButton);
}


// used to truncate the string in the banner desc
function truncateString(string, maxLength) {
    if (string && string.length > maxLength) {
        return string.substring(0, maxLength - 1) + "...";
    } else {
        return string;
    }
}


// make the scroll buttons appear when the posters are hovered over
const rows = document.querySelectorAll('.row');
rows.forEach(row => {
    const rowPosters = row.querySelector('.row_posters');
    const buttons = row.querySelectorAll('.scroll-button');
    rowPosters.addEventListener('mouseenter', () => {
        buttons.forEach(button => {
            button.classList.add('active');
        });
    });
    rowPosters.addEventListener('mouseleave', () => {
        buttons.forEach(button => {
            button.classList.remove('active');
        });
    });
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.classList.add('active');
        });
        button.addEventListener('mouseleave', () => {
            button.classList.remove('active');
        });
    });
});

function scrollPosters(button, direction) {
    const rowPosters = button.parentElement.querySelector('.row_posters');
    rowPosters.scrollBy({
        left: direction * rowPosters.offsetWidth,
        behavior: 'smooth'
    });
}





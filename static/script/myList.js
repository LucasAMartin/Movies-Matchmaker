const img_url = "https://image.tmdb.org/t/p/original";
addMovies(movies, 'Your List')

function addMovies(movieList, category) {
    console.log(movieList)
    if (movieList === null || movieList.length == 0) {
        const title = document.querySelector("#topRowList .row .row_title");
        title.innerText = 'Add movies to your list to view them here';
        return
    }
    // newest first
    movieList.reverse();
    // top recommendations
    const title = document.querySelector("#topRowList .row .row_title");
    const row_posters = document.querySelector("#topRowList .row .row_posters_list")
    title.innerText = category;
    for (let i = 0; i <= movieList.length; i++) {
        try {
            let movie = movieList[i];
            let poster = document.createElement("img");
            poster.className = "row_poster_list";
            poster.src = img_url + movie.poster_path;
            poster.onclick = () => changeMovie(movie.original_title);
            row_posters.appendChild(poster);
        } catch (error) {
            console.log(error)
            break;
        }
    }
}

function changeMovie(movie) {
    const urlParams = new URLSearchParams(window.location.search);
    const cleanedMovieName = movie.replace(/[^a-zA-Z0-9 ]/g, "");
    urlParams.set('movie', cleanedMovieName.trim().replace(/\s+/g, ' '));
    const newUrl = '/Search' + '?' + urlParams.toString();
    window.history.pushState({}, '', newUrl);
    location.href = location.href;
}


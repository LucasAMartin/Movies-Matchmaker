const img_url = "https://image.tmdb.org/t/p/original";

// Create an instance of the Lozad.js library
const lazyLoadInstance = lozad('.lazy', {
    rootMargin: '100px 0px', // start loading images 300px before they become visible
    loaded: function (el) {
        // Fade in the image once it has been loaded
        el.classList.add('fade');
    }
});
// Start observing for lazy loading
lazyLoadInstance.observe();

addMovies(movies, 'Your List')


function addMovies(movieList, category) {
    console.log(movieList)
    if (movieList === null || movieList.length == 0) {
        const title = document.querySelector("#rowOutlineList .row .row_title");
        title.innerText = 'Add movies to your list to view them here';
        return
    }
    // newest first
    movieList.reverse();
    // top recommendations
    const title = document.querySelector("#rowOutlineList .row .row_title");
    const row_posters = document.querySelector("#rowOutlineList .row .row_posters_list")
    title.innerText = category;
    for (let i = 0; i <= movieList.length; i++) {
        try {
            let movie = movieList[i];
            let poster = document.createElement("img");
            const loadingOverlay = document.getElementById('loading');

            poster.className = "row_poster_list";

            // Set the src attribute to the low-quality image placeholder
            poster.src = 'static/img/lqip.jpeg';

            // Set the data-src attribute to the full-resolution image
            poster.setAttribute("data-src", img_url + movie.poster_path);

            // Add the 'lazy' class to the img element
            poster.classList.add('lazy');

            poster.onclick = function () {
                changeMovie(movie.original_title);
                loadingOverlay.style.display = 'flex';
            };
            row_posters.appendChild(poster);
        } catch (error) {
            console.log(error)
            break;
        }
    }

    // Observe the posters for lazy loading
    lazyLoadInstance.observe();
}


function changeMovie(movie) {
    const urlParams = new URLSearchParams(window.location.search);
    const cleanedMovieName = movie.replace(/[^a-zA-Z0-9 ]/g, "");
    urlParams.set('movie', cleanedMovieName.trim().replace(/\s+/g, ' '));
    const newUrl = '/Search' + '?' + urlParams.toString();
    window.history.pushState({}, '', newUrl);
    location.href = location.href;
}


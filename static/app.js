// img url
const img_url = "https://image.tmdb.org/t/p/original";

const youtubeBase = 'https://www.youtube.com/embed/';

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
const MAX_POSTERS = 20;
let myListMovieIDS;

// Create an instance of the Lozad.js library
const lazyLoadInstance = lozad('.lazy', {
    rootMargin: '400px 0px', // start loading images 300px before they become visible
    loaded: function (el) {
        // Fade in the image once it has been loaded
        el.classList.add('fade');
    }
});

// Start observing for lazy loading
lazyLoadInstance.observe();

// main functions, displays a banner and 3 rows
requestBanner();

let genre1 = genreIdToName[bannerMovie.genre_ids[0]];
let genre2 = genreIdToName[bannerMovie.genre_ids[1]];

if (typeof genre1 === "undefined") {
    genre1 = "Adventure";
}

if (typeof genre2 === "undefined") {
    genre2 = "Adventure";
}


addRow(movies, "Top Recommendations");
addRow(genre1Movies, `Top ${genre1} Movies`);
addRow(genre2Movies, `Top ${genre2} Movies`);
addRow(actorMovies, `Movies With ${actorMovies[0]}`);


function addToList(id, button) {
    fetch('/add_list', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({id: id})
    })
        .then(response => {
            if (response.status === 401) {
                window.location.href = '/login';
            } else {
                if (button.textContent === 'Add to List') {
                    button.textContent = 'Remove from List';
                }
                myListMovieIDS = response.json();
            }
        })
        .then(movie_ids => {
            // use the movie_ids as needed
        })
        .catch(error => console.log(error))
}

function removeFromList(id, button) {
    fetch('/remove_list', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({id: id})
    })
        .then(response => {
            if (response.status === 401) {
                window.location.href = '/login';
            } else {
                if (button.textContent === 'Remove from List') {
                    button.textContent = 'Add to List';
                }
                myListMovieIDS = response.json();
            }
        })
        .then(movie_ids => {
            // use the movie_ids as needed
        })
        .catch(error => console.log(error))
}


async function getYoutubeTrailerKey(movie_id) {
    let trailer_id = null;
    try {
        const response = await fetch('/get_trailer_id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({movie_id: movie_id})
        });
        const data = await response.json();
        trailer_id = data.trailer_id;
    } catch (error) {
        console.error(error);
    }
    console.log(trailer_id)
    return trailer_id;
}

async function getImdbID(movie_id) {
    let imdb_id = null;
    try {
        const response = await fetch('/get_imdb_id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({movie_id: movie_id})
        });
        const data = await response.json();
        imdb_id = data.imdb_id;
    } catch (error) {
        console.error(error);
    }
    return imdb_id;
}


// changes the movie in the banner to a new movie, is called when a movie poster is pressed
// this.id is the id of the banner that it is pressed from
function changeMovie(movie) {
    const urlParams = new URLSearchParams(window.location.search);
    const cleanedMovieName = movie.replace(/[^a-zA-Z0-9 ]/g, "");
    urlParams.set('movie', cleanedMovieName.trim().replace(/\s+/g, ' '));
    const newUrl = window.location.pathname + '?' + urlParams.toString();
    window.history.pushState({}, '', newUrl);
    location.href = location.href;
}

// fetch the information for the banner movies
async function requestBanner() {
    if (bannerMovie == null) {
        const banner_title = document.getElementById("banner_title");
        banner_title.innerText = "Retry Search";
        const banner_description = document.getElementById("banner_description");
        banner_description.innerText = "Movie not found in the TMDB database."
        return
    }
    const banner = document.getElementById("banner");
    const banner_title = document.getElementById("banner_title");
    const banner_description = document.getElementById("banner_description");
    const banner_List = document.querySelector('#banner_button_list');
    banner.style.backgroundImage = "url(" + img_url + bannerMovie.backdrop_path + ")";
    if (window.innerWidth <= 450) {
        banner_description.innerText = truncateString(bannerMovie.overview, 250);
    } else {
        banner_description.innerText = truncateString(bannerMovie.overview, 600);
    }
    banner_title.innerText = bannerMovie.title;
    banner_List.textContent = 'Add to List';
    banner_List.onclick = (event) => {
        const clickedButton = event.target;
        addToList(bannerMovie.id, clickedButton);
    };
    try {
        const response = await fetch('/get_movie_ids_session');
        movieIDS = await response.json();
        myListMovieIDS = movieIDS
        console.log(myListMovieIDS)
        if (myListMovieIDS.includes(bannerMovie.id)) {
            banner_List.textContent = 'Remove from List';
            banner_List.onclick = (event) => {
                const clickedButton = event.target;
                removeFromList(bannerMovie.id, clickedButton);
            };

        }
    } catch (error) {
        console.log(error);
    }
}

// if the banner movie is not in database, we can't give recommendations
// in this case just display the trending movies
function addRow(movieList, category) {
    // top recommendations
    const topRow = document.getElementById("topRow");
    const row = document.createElement("div");
    row.className = "row";
    row.classList.add("top_row");
    topRow.appendChild(row);
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

            // Set the src attribute to the low-quality image placeholder
            poster.src = 'static/img/lqip.jpeg';

            // Set the data-src attribute to the full-resolution image
            poster.setAttribute("data-src", img_url + movie.poster_path);

            // Add the 'lazy' class to the img element
            poster.classList.add('lazy');

            let genreNames = [];
            for (let genreId of movie.genre_ids) {
                if (genreIdToName.hasOwnProperty(genreId)) {
                    genreNames.push(genreIdToName[genreId]);
                }
            }
            let genreString = genreNames.join(", ");

            // Set the data-title attribute to the title of the movie
            poster.setAttribute("data-title", movie.title);
            poster.setAttribute("data-id", movie.id);
            poster.setAttribute("data-genres", genreString);
            poster.setAttribute("data-desc", movie.overview);
            // Set the data-img attribute to the image URL of the movie
            poster.setAttribute("data-year", movie.release_date.substring(0, 4));
            poster.setAttribute("data-img", img_url + movie.backdrop_path);

            poster.onclick = openModal;
            row_posters.appendChild(poster);
        } catch (error) {
            break;
        }
    }

    function openModal() {
        const modal = document.querySelector('#modal');
        const overlay = document.querySelector('#overlay');
        overlay.onclick = closeModal;
        const modalImg = document.querySelector('#modal .modal-header img');
        const modalTitle = document.querySelector('#modal .modal-header .title');
        const modalDesc = document.querySelector('#modal .modal-body .modal-desc');
        const modalGenre = document.querySelector('#modal .modal-body .modal-info .modal-genre');
        const modalYear = document.querySelector('#modal .modal-body .modal-info .modal-year');
        const modalExpand = document.querySelector('#modal .modal-header #modal_button');
        const modalList = document.querySelector('#modal .modal-header #modal_button_list');

        // Get the title, overview, image URL, and YouTube link of the clicked poster from its data-* attributes
        const title = this.getAttribute('data-title');
        const id = this.getAttribute('data-id');
        const overview = this.getAttribute('data-desc');
        const imgUrl = this.getAttribute('data-img');
        const genres = this.getAttribute('data-genres');
        const year = this.getAttribute('data-year');


        // Set the text content of the modal title and body to the title and overview of the clicked poster
        modalTitle.textContent = title;
        modalDesc.textContent = overview;
        modalGenre.textContent = genres;
        modalYear.textContent = year;

        // Set the src attribute of the modal image to the image URL of the clicked poster
        modalImg.src = imgUrl;
        displayTrailer(id, modalImg)
        modalExpand.onclick = () => changeMovie(title);
        modalList.onclick = (event) => {
                const clickedButton = event.target;
                addToList(id, clickedButton);
            };
        modal.classList.add('active');
        overlay.classList.add('active');

        if (myListMovieIDS.includes(parseInt(id, 10))) {
            modalList.textContent = 'Remove from List';
            modalList.onclick = (event) => {
                const clickedButton = event.target;
                removeFromList(id, clickedButton);
            };

        }

    }


    function closeModal() {
        const modal = document.querySelector('#modal');
        const overlay = document.querySelector('#overlay');

        modal.classList.remove('active');
        overlay.classList.remove('active');

        // Get references to the image and iframe elements
        const modalImg = document.querySelector('#modal .modal-header img');
        const modalIframe = document.querySelector('#modal .modal-header .youtube-iframe');

        // Check if an iframe element exists
        if (modalIframe) {
            // Remove the iframe element
            modalIframe.remove();
            // Show the image again
            modalImg.style.display = 'block';
            // Reset the opacity of the image
            modalImg.style.opacity = '1';
            modalImg.src = null;
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

    lazyLoadInstance.observe()
}

async function displayTrailer(movie_id, modalImg) {
    const trailer_id = await getYoutubeTrailerKey(movie_id);
    // Check if a YouTube link was provided
    if (trailer_id) {
        // Create an iframe element
        let iframe = document.createElement('iframe');
        // Set the src attribute of the iframe to the URL of the YouTube video
        iframe.src = `${youtubeBase}${trailer_id}?autoplay=1&mute=1&controls=0&start=10&modestbranding=1&showinfo=0`;
        // Add a class to the iframe for styling
        iframe.classList.add('youtube-iframe');
        // Insert the iframe before the modal image
        modalImg.parentNode.insertBefore(iframe, modalImg);

        // Add an event listener for the load event of the iframe
        iframe.addEventListener('load', () => {
            // Delay execution by one second
            setTimeout(() => {
                // Fade out the image and fade in the video
                modalImg.style.opacity = '0';
                iframe.style.opacity = '1';
            }, 1000);
        });

    }
}

async function launchMoviePlayer() {
    let bannerTMDB = bannerMovie.id;
    const bannerIMDB = await getImdbID(bannerTMDB);
    //  Uses the IMDB id to launch a movie player
    let movieURL = `https://vidsrc.me/embed/${bannerIMDB}/`;
    window.open(movieURL);
}

// used to truncate the string in the banner description
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

setTimeout(function () {
    document.body.className = "";
}, 400);









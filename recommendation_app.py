import time
from datetime import timedelta
from functools import wraps

from quart import Quart, request, render_template, jsonify, ResponseReturnValue, redirect, url_for, session
import re
import aiohttp
import asyncio
import platform
import pickle
import pandas as pd
from fuzzywuzzy import process
from quart_auth import QuartAuth, login_required, Unauthorized
from database import *
import secrets
import bcrypt
from database import init_db

app = Quart(__name__)
QuartAuth(app)
app.secret_key = secrets.token_urlsafe(16)
app.config["TEMPLATES_AUTO_RELOAD"] = True
MAX_MOVIES = 20
# My Api key from TMDB
API = "api_key=65088f30b11eb50d43a411d49c206b5f"
# base url of the tmdb site
BASE_URL = "https://api.themoviedb.org/3"
# Do this to avoid a huge stack trace of errors
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


async def get_data_async(session, query):
    async with session.get(query) as response:
        if response.status == 200:
            return await response.json()
        else:
            return "error"


async def get_movie_info_async(session, movies):
    movies = movies[:MAX_MOVIES]
    requests = [None] * len(movies)
    tasks = []
    for i, movie in enumerate(movies):
        # clean the movie names
        movies[i] = re.sub("[^a-zA-Z0-9\s]", "", movie).lower()
        # create query requests
        requests[i] = f"{BASE_URL}/search/movie?query={movies[i]}&{API}&append_to_response=videos"
        # fetch data for each movie
        task = asyncio.ensure_future(get_data_async(session, requests[i]))
        tasks.append(task)
    responses = await asyncio.gather(*tasks)
    return responses


async def get_genre_info_async(session, movies, index):
    try:
        genre = movies[0]['results'][0]['genre_ids'][index]
    except IndexError:
        genre = 12
    # create query request
    request = f"{BASE_URL}/discover/movie?{API}&with_genres={genre}"
    # fetch movies for the genre
    response = await get_data_async(session, request)
    return response


async def get_lead_actor_async(session, movie_id):
    request = f"{BASE_URL}/movie/{movie_id}/credits?{API}"
    response = await get_data_async(session, request)
    if response and response.get('cast'):
        lead_actor = response['cast'][0]
        return lead_actor.get('name'), lead_actor.get('id')
    return None, None


async def get_actor_movies_async(session, actor_id):
    request = f"{BASE_URL}/discover/movie?{API}&with_cast={actor_id}"
    response = await get_data_async(session, request)
    movies = []
    for result in response['results']:
        if 'original_title' in result:
            movies.append(result['original_title'])
    return movies


async def get_trending_movie_async(session):
    request = f"{BASE_URL}/trending/all/week?{API}&language=en-US"
    response = await get_data_async(session, request)
    if response and response.get('results'):
        movie = response['results'][0]
        return movie.get('title')
    return None


async def get_trending_info_async(session, banner_movie):
    # create query request
    request = f"{BASE_URL}/trending/all/week?{API}&language=en-US"
    # fetch movies for the genre
    response = await get_data_async(session, request)
    movies = []
    for movie in response['results']:
        if 'title' in movie:
            movies.append(movie['title'])
    movies[0] = banner_movie
    return movies


def login_required(view_func):
    @wraps(view_func)
    async def wrapper(*args, **kwargs):
        # Check if user is authenticated
        if not session['logged_in']:
            return redirect(url_for('login_screen'))
        return await view_func(*args, **kwargs)
    return wrapper


@app.before_serving
async def startup():
    init_db()


@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store'
    return response


@app.route("/")
async def home():
    return await render_template('main_page.html')


@app.route('/login', methods=['GET', 'POST'])
async def login():
    if request.method == 'POST':
        form = await request.form
        username = form['username']
        password = form['password']
        remember = form.get('remember') == 'on'
        user = get_user(username)
        if user:
            hashed_password = user[2]
            if isinstance(hashed_password, str):
                hashed_password = hashed_password.encode('utf-8')
            if bcrypt.checkpw(password.encode('utf-8'), hashed_password):
                session['logged_in'] = True
                session['username'] = username
                session.permanent = remember
                previous_page = session.pop('previous_page', '/')
                return redirect(previous_page)
        return await render_template('login.html', invalid_credentials=True)
    else:
        session['previous_page'] = request.referrer or '/'
        return await render_template('login.html')




@app.route('/logout')
async def logout():
    session.pop('logged_in', None)
    session.pop('username', None)
    return await render_template('main_page.html')


@app.route('/create_account', methods=['GET', 'POST'])
async def create_account():
    if request.method == 'POST':
        form = await request.form
        username = form['username']
        password = form['password']
        confirm_password = form['confirm_password']
        if password == confirm_password:
            response = insert_user(username, password)
            if response == 'Username taken':
                return await render_template('create_account.html', username_taken=True)
            elif response == 'User successfully inserted':
                return redirect('/')
            else:
                return "Unknown Error"
        else:
            return await render_template('create_account.html', passwords_no_match=True)
    else:
        return await render_template('create_account.html')


@app.route("/my_list", methods=['POST'])
async def my_list():
    movies = get_movie_ids(session['username'])
    return await render_template('my_list.html')


@app.route("/add_list", methods=['POST'])
async def add_list():
    data = await request.get_json()
    movie_id = data['id']
    response = insert_movie_id(session['username'], movie_id)


@app.route('/get_trailer_id', methods=['POST'])
async def get_trailer_id():
    data = await request.get_json()
    movie_id = data['movie_id']
    # Use the get_trailer_id_async function to retrieve the trailer ID

    async def get_trailer_id_async():
        async with aiohttp.ClientSession() as session:
            # Construct the URL
            query = f"{BASE_URL}/movie/{movie_id}/videos?{API}"
            # Make the API call
            data = await get_data_async(session, query)
            # Find the trailer ID
            trailer_id = None
            for video in data['results']:
                if video['type'] == 'Trailer':
                    trailer_id = video['key']
                    break
            return trailer_id

    trailer_id = await get_trailer_id_async()
    return jsonify({'trailer_id': trailer_id})


@app.route('/get_imdb_id', methods=['POST'])
async def get_imdb_id():
    data = await request.get_json()
    tmdb_id = data['movie_id']
    # Use the get_imdb_id_async function to retrieve the imdb ID

    async def get_imdb_id_async():
        async with aiohttp.ClientSession() as session:
            # Construct the URL
            query = f"{BASE_URL}/movie/{tmdb_id}/external_ids?{API}"
            # Make the API call
            data = await get_data_async(session, query)
            # Find the trailer ID
            return data.get('imdb_id')

    imdb_id = await get_imdb_id_async()
    return jsonify({'imdb_id': imdb_id})


# Load the pickled objects from the cos_similarity class
movie_data = pickle.load(open('movie_data.pkl', 'rb'))
cosine_sim = pickle.load(open('cosine_sim.pkl', 'rb'))
indices = pd.Series(movie_data.index, index=movie_data['Title']).drop_duplicates()


def get_recommendations(title, data, indices, cosine_sim):
    try:
        # Find the closest matching title in the data
        title = process.extractOne(title, data['Title'])[0]
        idx = indices[title]
        # Get the pairwise similarity scores of all movies with that movie
        sim_scores = list(enumerate(cosine_sim[idx]))
        # Sort the movies based on the similarity score
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        sim_scores = sim_scores[0:20]
        movie_indices = [i[0] for i in sim_scores]
        # Return the top 20 most similar movies
        movies = list(data['Title'].iloc[movie_indices])
        movies[0] = title
        return movies
    except ValueError:
        return None


@app.route("/Search")
async def search_movies():
    # Get user input for movie search
    choice = request.args.get('movie')
    # If no user input, get a trending movie as the default choice
    async with aiohttp.ClientSession() as session:
        f = time.process_time()
        if choice is None:
            choice = await get_trending_movie_async(session)
            movies = await get_trending_info_async(session, choice)
        else:
            # Get recommended movies based on the user's choice
            movies = get_recommendations(choice, movie_data, indices, cosine_sim)
        # Fallback in case the movie is not in the dataset
        if movies is None:
            movies = await get_trending_info_async(session, choice)
        # Get information for the recommended movies
        movies = await get_movie_info_async(session, movies)
        # Makes sure that the banner movie is correct
        banner_movie = await get_data_async(session, f"{BASE_URL}/search/movie?query={choice}&{API}")
        if banner_movie and 'results' in banner_movie and banner_movie['results']:
            movies[0] = banner_movie
        # Get the lead actor and their ID for the first recommended movie
        lead_actor, lead_actor_id = await get_lead_actor_async(session, movies[0]['results'][0]['id'])
        # Get movies featuring the lead actor
        lead_actor_movies = await get_actor_movies_async(session, lead_actor_id)
        # Get information for the lead actor's movie
        lead_actor_movies = await get_movie_info_async(session, lead_actor_movies)
        # Add the lead actor's name to the list of their movies
        lead_actor_movies.insert(0, lead_actor)
        # Get movies in the same genres as the first two recommended movies
        genre_1_movies = await get_genre_info_async(session, movies, 0)
        genre_2_movies = await get_genre_info_async(session, movies, 1)
        s = time.process_time()
        return await render_template('display_movies.html', movies=movies,
                                     genre1=genre_1_movies,
                                     genre2=genre_2_movies,
                                     actorMovies=lead_actor_movies, s='opps')


if __name__ == "__main__":
    app.run(debug=True)

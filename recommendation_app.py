import heapq
import os
import time

import requests
from dotenv import load_dotenv
from quart import Quart, request, render_template, jsonify, redirect, session
import aiohttp
import asyncio
import platform
import pickle
import pandas as pd
from fuzzywuzzy import process
from quart_auth import QuartAuth
from database import *
from cache import *
import secrets
import bcrypt

app = Quart(__name__)
QuartAuth(app)
app.secret_key = secrets.token_urlsafe(16)
TEMPLATES_AUTO_RELOAD = True
MAX_MOVIES = 20
load_dotenv()
# My Api key from TMDB
API = f"api_key={os.getenv('API_KEY')}"
# base url of the tmdb site
BASE_URL = "https://api.themoviedb.org/3"
# Do this to avoid a huge stack trace of errors
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Load the pickled objects from the cos_similarity class
movie_data = pickle.load(open('movie_data.pkl', 'rb'))
cosine_sim = pickle.load(open('cosine_sim.pkl', 'rb'))
indices = pd.Series(movie_data.index, index=movie_data['Title']).drop_duplicates()


async def get_data_async(session, query):
    # Check if the data is in the cache
    data = get_from_cache(query)
    if data is not None:
        # Data is in the cache, so return it
        return data

    # Data is not in the cache, so make an API call
    async with session.get(query) as response:
        if response.status == 200:
            data = await response.json()

            # Store the data in the cache
            store_in_cache(query, data)

            return data
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
        requests[i] = f"{BASE_URL}/search/movie?query={movies[i]}&{API}"
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


async def get_trending_info_async(session):
    # create query request
    request = f"{BASE_URL}/trending/all/week?{API}&language=en-US"
    # fetch movies for the genre
    response = await get_data_async(session, request)
    movies = []
    for movie in response['results']:
        if 'title' in movie:
            movies.append(movie['title'])
    return movies


async def keep_awake():
    async with aiohttp.ClientSession() as session:
        while True:
            async with session.get("https://movies-matchmaker.onrender.com/") as response:
                # print(f"Sent GET request to {response.url} at {time.ctime()}")
                await asyncio.sleep(14 * 60)


@app.before_serving
async def startup():
    init_users()
    init_cache()
    asyncio.create_task(keep_awake())


@app.route("/")
async def home():
    return await render_template('main_page.html')


@app.route('/login', methods=['GET', 'POST'])
async def login():
    if request.method == 'POST':
        form = await request.form
        username = form['username'].lower()
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
                session['movie_ids'] = get_movie_ids(session['username'])
                session.permanent = remember
                # Redirect the user back to the search page they were on before logging in
                previous_page = session.get('previous_page')
                if previous_page and '/Search' in previous_page:
                    return redirect(previous_page)
                else:
                    return redirect('/')
        return await render_template('login.html', invalid_credentials=True)
    else:
        # Store the URL of the page the user was on before logging in
        session['previous_page'] = request.referrer or '/'
        return await render_template('login.html')


@app.route('/get_movie_ids_session')
async def get_movie_ids_session():
    if not session.get('logged_in', False):
        return '', 401
    movie_ids = get_movie_ids(session['username'])
    return jsonify(movie_ids)


@app.route('/logout')
async def logout():
    session.pop('logged_in', None)
    session.pop('username', None)
    session.pop('movie_ids', None)
    return await render_template('main_page.html')


@app.route('/create_account', methods=['GET', 'POST'])
async def create_account():
    if request.method == 'POST':
        form = await request.form
        username = form['username'].lower()
        password = form['password']
        confirm_password = form['confirm_password']
        remember = form.get('remember') == 'on'
        if password == confirm_password:
            response = insert_user(username, password)
            if response == 'Username taken':
                return await render_template('login.html', username_taken=True)
            elif response == 'User successfully inserted':
                session['logged_in'] = True
                session['username'] = username
                session.permanent = remember
                return redirect('/')
            else:
                return "Unknown Error"
        else:
            return await render_template('login.html', passwords_no_match=True)
    else:
        return await render_template('login.html')


@app.route("/my_list", methods=['POST', 'GET'])
async def my_list():
    async with aiohttp.ClientSession() as client_session:
        movies = get_movie_ids(session['username'])
        tasks = []
        if movies is None:
            return await render_template('my_list.html', movies=movies)
        for i, movie in enumerate(movies):
            url = f"{BASE_URL}/movie/{movie}?{API}"
            tasks.append(asyncio.ensure_future(get_data_async(client_session, url)))
        movies = await asyncio.gather(*tasks)
    return await render_template('my_list.html', movies=movies)


@app.route("/add_list", methods=['POST'])
async def add_list():
    if not session.get('logged_in', False):
        return '', 401
    data = await request.get_json()
    movie_id = data['id']
    insert_movie_id(session['username'], movie_id)
    movie_ids = get_movie_ids(session['username'])
    return jsonify(movie_ids)


@app.route("/remove_list", methods=['POST'])
async def remove_list():
    if not session.get('logged_in', False):
        return '', 401
    data = await request.get_json()
    movie_id = data['id']
    remove_movie_id(session['username'], movie_id)
    movie_ids = get_movie_ids(session['username'])
    return jsonify(movie_ids)


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


def get_recommendations(title, data, indices, cosine_sim):
    try:
        f = time.process_time()
        # Find the closest matching title in the data
        title = process.extractOne(title, data['Title'])[0]
        idx = indices[title]
        # Get the pairwise similarity scores of all movies with that movie
        sim_scores = list(enumerate(cosine_sim[idx]))
        # Find the top MAX_MOVIES most similar movies using a heap
        most_similar = heapq.nlargest(MAX_MOVIES, sim_scores, key=lambda x: x[1])
        movie_indices = [i[0] for i in most_similar]
        # Return the top MAX_MOVIES most similar movies
        movies = list(data['Title'].iloc[movie_indices])
        movies[0] = title
        s = time.process_time()
        print(f'Recommendation {s - f}')
        return movies
    except ValueError:
        return None


app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


@app.route("/Search")
async def search_movies():
    # Get user input for movie search
    choice = request.args.get('movie')
    # If no user input, get a trending movie as the default choice
    async with aiohttp.ClientSession() as session:
        f = time.process_time()
        if choice is None:
            movies = await get_trending_info_async(session)
            choice = movies[0]
        else:
            movies = get_recommendations(choice, movie_data, indices, cosine_sim)
        if movies is None:
            movies = await get_trending_info_async(session)
        movies = await get_movie_info_async(session, movies)
        banner_movie, lead_actor_data, genre_1_movies, genre_2_movies = await asyncio.gather(
            get_data_async(session, f"{BASE_URL}/search/movie?query={choice}&{API}"),
            get_lead_actor_async(session, movies[0]['results'][0]['id']),
            get_genre_info_async(session, movies, 0),
            get_genre_info_async(session, movies, 1),
        )
        lead_actor, lead_actor_id = lead_actor_data
        lead_actor_movies = await get_actor_movies_async(session, lead_actor_id)
        lead_actor_movies_info = await get_movie_info_async(session, lead_actor_movies)
        lead_actor_movies_info.insert(0, lead_actor)
        if banner_movie and 'results' in banner_movie and banner_movie['results']:
            movies[0] = banner_movie
        s = time.process_time()
        print(f'Total {s - f}')
        return await render_template('display_movies.html', movies=movies,
                                     genre1=genre_1_movies,
                                     genre2=genre_2_movies,
                                     actorMovies=lead_actor_movies_info, s='opps')


if __name__ == "__main__":
    app.run(debug=True)

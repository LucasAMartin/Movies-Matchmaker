import pandas as pd
import os
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.neighbors import NearestNeighbors
from quart import Quart, request, render_template
import re
import random
import time
import aiohttp
import asyncio
import platform

app = Quart(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True

MAX_MOVIES = 20
# My Api key from TMDB
API = "api_key=65088f30b11eb50d43a411d49c206b5f"
# base url of the site
BASE_URL = "https://api.themoviedb.org/3"

# Do this to avoid a huge stack trace of errors
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


# this function will import dataset, create count matrix and create similarity score matrix
def create_model():
    # import dataset
    # Thid dataset is preprocessed tmdb_5000 dataset
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    data = pd.read_csv("final_data.csv")
    # create count matrix
    cv = CountVectorizer()
    count_matrix = cv.fit_transform(data['combined_features'])
    # create similarity score matrix
    model = NearestNeighbors(metric='cosine', algorithm='brute')
    model.fit(count_matrix)
    return data, model, count_matrix


# this function will find movies related to choice entered and return list of 16 movies
# in which first movie will be the choice.
def recommend(choice, original_choice):
    # this try-except block will check whether count matrix is created or not, if not
    # the it will call create_model() function.
    try:
        model.get_params()
    except:
        data, model, count_matrix = create_model()
        # distances,indices = model.kneighbors(count_matrix[choice_index],n_neighbors=11)

    # If movie name exactly matches with the name of movie in the data's title column
    # then this block will be executed.
    if choice in data['title'].values:
        choice_index = data[data['title'] == choice].index.values[0]
        distances, indices = model.kneighbors(count_matrix[choice_index], n_neighbors=20)
        movie_list = []
        for i in indices.flatten():
            movie_list.append(data[data.index == i]['original_title'].values[0].title())
        return movie_list


    # If no any movie name exactly matches with the title column of the data then,
    # in this block of code I am finding movie name which highly matches with movie name
    # entered by the user.

    elif data['title'].str.contains(choice).any():

        # getting list of similar movie names as choice.
        similar_names = list(str(s) for s in data['title'] if choice in str(s))
        # sorting the list to get the most matched movie name.
        similar_names.sort()
        # taking the first movie from the sorted similar movie name.
        new_choice = similar_names[0]
        # getting index of the choice from the dataset
        choice_index = data[data['title'] == new_choice].index.values[0]
        # getting distances and indices of 16 mostly related movies with the choice.
        distances, indices = model.kneighbors(count_matrix[choice_index], n_neighbors=20)
        # creating movie list
        movie_list = []
        for i in indices.flatten():
            movie_list.append(data[data.index == i]['original_title'].values[0].title())
        return movie_list



    # If no name matches then this else statement will be executed.
    else:
        return None


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
        requests[i] = f"{BASE_URL}/search/movie?query={movies[i]}&{API}"
        # fetch data for each movie
        task = asyncio.ensure_future(get_data_async(session, requests[i]))
        tasks.append(task)
    responses = await asyncio.gather(*tasks)
    for i, response in enumerate(responses):
        movies[i] = response
    return movies


async def get_genre_info_async(session, movies, index):
    try:
        genre = movies[0]['results'][0]['genre_ids'][index]
    except IndexError:
        genre = random.choice([80, 10751, 28, 12, 16])
    # create query request
    request = f"{BASE_URL}/discover/movie?{API}&with_genres={genre}"
    # fetch movies for the genre
    return await get_data_async(session, request)


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


async def get_trending_movie_async(session):
    request = f"{BASE_URL}/trending/all/week?{API}&language=en-US"
    response = await get_data_async(session, request)
    if response and response.get('results'):
        movie = response['results'][0]
        return movie.get('title')
    return None


async def get_imdb_id(session, tmdb_id):
    request = f"{BASE_URL}/movie/{tmdb_id}/external_ids?{API}"
    response = await get_data_async(session, request)
    return response.get('imdb_id')


@app.route("/")
async def home():
    return await render_template('main_page.html')


@app.route("/Search")
async def search_movies():
    # Get user input for movie search
    original_choice = request.args.get('movie')
    # If no user input, get a trending movie as the default choice
    if original_choice is None:
        async with aiohttp.ClientSession() as session:
            original_choice = await get_trending_movie_async(session)
    # Remove all characters except letters and numbers from the movie choice
    choice = re.sub("[^a-zA-Z1-9]", "", original_choice).lower()
    # Get recommended movies based on the user's choice
    movies = recommend(choice, original_choice)
    if movies is None:
        async with aiohttp.ClientSession() as session:
            movies = await get_trending_info_async(session, original_choice)
    # Get information for the recommended movies
    async with aiohttp.ClientSession() as session:
        movies = await get_movie_info_async(session, movies)
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
        banner_imdb = await get_imdb_id(session, movies[0]['results'][0].get('id'))
    return await render_template('display_movies.html', movies=movies, bannerIMDB=banner_imdb, genre1=genre_1_movies,
                                 genre2=genre_2_movies,
                                 actorMovies=lead_actor_movies, s='opps')


if __name__ == "__main__":
    app.run(debug=True)

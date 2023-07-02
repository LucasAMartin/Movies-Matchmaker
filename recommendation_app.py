import pandas as pd
import requests, os
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.neighbors import NearestNeighbors
from flask import Flask, request, render_template, jsonify
import re
import random
import time

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
        distances, indices = model.kneighbors(count_matrix[choice_index], n_neighbors=18)
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
        distances, indices = model.kneighbors(count_matrix[choice_index], n_neighbors=18)
        # creating movie list
        movie_list = []
        for i in indices.flatten():
            movie_list.append(data[data.index == i]['original_title'].values[0].title())
        return movie_list



    # If no name matches then this else statement will be executed.
    else:
        return get_trending_info(original_choice)


def get_data(query):
    response = requests.get(query)
    if response.status_code == 200:
        # status code ==200 indicates the API query was successful
        return response.json()
    else:
        return ("error")


def get_movie_info(movies):
    movies = movies[:MAX_MOVIES]
    requests = [None] * len(movies)
    for i, movie in enumerate(movies):
        # clean the movie names
        movies[i] = re.sub("[^a-zA-Z0-9\s]", "", movie).lower()
        # create query requests
        requests[i] = f"{BASE_URL}/search/movie?query={movies[i]}&{API}"
        # fetch data for each movie
        response = get_data(requests[i])
        movies[i] = response
    return movies


def get_genre_info(movies, index):
    try:
        genre = movies[0]['results'][0]['genre_ids'][index]
    except IndexError:
        genre = random.choice([80, 10751, 28, 12, 16])
    # create query request
    request = f"{BASE_URL}/discover/movie?{API}&with_genres={genre}"
    # fetch movies for the genre
    return get_data(request)


def get_lead_actor(movie_id):
    request = f"{BASE_URL}/movie/{movie_id}/credits?{API}"
    response = get_data(request)
    if response and response.get('cast'):
        lead_actor = response['cast'][0]
        return lead_actor.get('name'), lead_actor.get('id')
    return None, None


def get_actor_movies(actor_id):
    request = f"{BASE_URL}/discover/movie?{API}&with_cast={actor_id}"
    response = get_data(request)
    movies = []
    for result in response['results']:
        if 'original_title' in result:
            movies.append(result['original_title'])
    return movies


def get_trending_info(banner_movie):
    # create query request
    request = f"{BASE_URL}/trending/all/week?{API}&language=en-US"
    # fetch movies for the genre
    response = get_data(request)
    movies = []
    for movie in response['results']:
        if 'title' in movie:
            movies.append(movie['title'])
    movies[0] = banner_movie
    return movies


def get_trending_movie():
    request = f"{BASE_URL}/trending/all/week?{API}&language=en-US&page=1&limit=1"
    response = get_data(request)
    if response and response.get('results'):
        movie = response['results'][0]
        return movie.get('title')
    return None


app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True
MAX_MOVIES = 18

# My Api key from TMDB
API = "api_key=65088f30b11eb50d43a411d49c206b5f"

# base url of the site
BASE_URL = "https://api.themoviedb.org/3"


@app.route("/")
def home():
    return render_template('main_page.html')


@app.route("/Search")
def search_movies():
    # Get user input for movie search
    original_choice = request.args.get('movie')
    first = time.perf_counter()
    # If no user input, get a trending movie as the default choice
    if original_choice is None:
        original_choice = get_trending_movie()

    # Remove all characters except letters and numbers from the movie choice
    choice = re.sub("[^a-zA-Z1-9]", "", original_choice).lower()

    # Get recommended movies based on the user's choice
    movies = recommend(choice, original_choice)

    # Get information for the recommended movies
    movies = get_movie_info(movies)

    # Get the lead actor and their ID for the first recommended movie
    lead_actor, lead_actor_id = get_lead_actor(movies[0]['results'][0]['id'])

    # Get movies featuring the lead actor
    lead_actor_movies = get_actor_movies(lead_actor_id)

    # Get information for the lead actor's movies
    lead_actor_movies = get_movie_info(lead_actor_movies)

    # Add the lead actor's name to the list of their movies
    lead_actor_movies.insert(0, lead_actor)

    # Get movies in the same genres as the first two recommended movies
    genre_1_movies = get_genre_info(movies, 0)
    genre_2_movies = get_genre_info(movies, 1)
    second = time.perf_counter()
    print(second - first)
    return render_template('display_movies.html', movies=movies, genre1=genre_1_movies, genre2=genre_2_movies,
                           actorMovies=lead_actor_movies, s='opps')


if __name__ == "__main__":
    app.run(debug=True)

# PYTHON SCRIPT TO CALCULATE COSINE SIMILARITY BETWEEN MOVIES AND SAVES IT TO A PKL FILE


import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import pickle


def load_data(file_name):
    data = pd.read_excel(file_name)
    data.rename(columns={'Unnamed: 0': 'movie_id'}, inplace=True)
    return data


def get_important_features(data):
    important_features = []
    for i in range(0, data.shape[0]):
        important_features.append(
            str(data['Title'][i]) + ' ' + str(data['Director'][i]) + ' ' + str(data['Genre'][i]) + ' ' + str(
                data['Description'][i]) + ' ' + str(data['Cast']))
    return important_features


def create_tfidf_matrix(data):
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(data['important_features'])
    return tfidf_matrix


def calculate_cosine_similarity(tfidf_matrix):
    cosine_sim = linear_kernel(tfidf_matrix, tfidf_matrix)
    return cosine_sim


def get_indices(data):
    indices = pd.Series(data.index, index=data['Title']).drop_duplicates()
    return indices


def save_data(data, file_name):
    movie_data = data.drop(
        columns=['Year of Release', 'Watch Time', 'Genre', 'Movie Rating', 'Metascore of movie', 'Director', 'Cast',
                 'Votes', 'Description'])
    pickle.dump(movie_data, open(file_name, 'wb'))


def save_cosine_similarity(cosine_sim, file_name):
    pickle.dump(cosine_sim, open(file_name, 'wb'))


def main():
    # Load the data
    data = load_data('movie_data.xlsx')

    # Get the important features
    data['important_features'] = get_important_features(data)

    # Create the TF-IDF matrix
    tfidf_matrix = create_tfidf_matrix(data)

    # Calculate the cosine similarity
    cosine_sim = calculate_cosine_similarity(tfidf_matrix)

    # Get the indices
    indices = get_indices(data)

    # Save the data and cosine similarity
    save_data(data, 'movie_data.pkl')
    save_cosine_similarity(cosine_sim, 'cosine_sim.pkl')


if __name__ == '__main__':
    main()



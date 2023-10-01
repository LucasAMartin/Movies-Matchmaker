# PYTHON SCRIPT THAT UPEDATES THE CACHE, TAKES AS INPUT NUMBER OF MOVIES TO CACHE AND MAKES API CALLS TO TMDB FOR INFO


import os
import aiohttp
import asyncio
import sys
import pandas as pd
from recommendation_app import get_data_async

API = f"api_key={os.getenv('API_KEY')}"
BASE_URL = "https://api.themoviedb.org/3"

GENRES = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37]


async def main():
    if len(sys.argv) < 2:
        print('Usage: python script.py NUM_MOVIES')
        sys.exit(1)

    num_movies = int(sys.argv[1])

    # read the .xlsx file
    df = pd.read_excel('movie_data.xlsx')
    movies = df['Title'].tolist()[:num_movies]

    async with aiohttp.ClientSession() as session:
        tasks = []
        for genre in GENRES:
            query = f"{BASE_URL}/discover/movie?{API}&with_genres={genre}"
            tasks.append(get_data_async(session, query))

        genre_results = await asyncio.gather(*tasks)
        for result in genre_results:
            for movie in result['results']:
                movies.append(movie['title'])

    async with aiohttp.ClientSession() as session:
        tasks = []
        for movie in movies:
            query = f"{BASE_URL}/search/movie?query={movie}&{API}"
            tasks.append(get_data_async(session, query))

        results = await asyncio.gather(*tasks)
    print(f'Updated cache with {num_movies} recent movies')
if __name__ == '__main__':
    asyncio.run(main())

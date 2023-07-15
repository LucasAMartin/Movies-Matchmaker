# -*- coding: utf-8 -*-
"""
Based on webscraping/recommendation algorithm from Chandramouli on medium
Made modifications for improved error handling and implementation in my app
"""

import pandas as pd
import numpy as np
import requests
from bs4 import BeautifulSoup

headers = ({'User-Agent':
                'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36',
            'Accept-Language': 'en-US, en;q=0.5'})

movie_name = []
year = []
time = []
rating = []
metascore = []
director = []
votes = []
gross = []
description = []
genre = []
cast = []
cas = []
pages = np.arange(1, 5000, 50)

for page in pages:
    page = requests.get("https://www.imdb.com/search/title/?title_type=feature&primary_language=en&start=" + str(
        page) + "&ref_=adv_nxt")
    soup = BeautifulSoup(page.text, 'html.parser')
    movie_data = soup.findAll('div', attrs={'class': 'lister-item mode-advanced'})
    for store in movie_data:
        # Use temporary variables to store data for each iteration of the loop
        temp_name = None
        temp_year_of_release = None
        temp_runtime = None
        temp_gen = None
        temp_rate = None
        temp_meta = None
        temp_dire = None
        temp_cas = None
        temp_vote = None
        temp_description_ = None

        try:
            # Check if element exists before trying to access its attributes
            if store.h3 and store.h3.a:
                temp_name = store.h3.a.text

            if store.h3 and store.h3.find('span', class_="lister-item-year text-muted unbold"):
                temp_year_of_release = store.h3.find('span', class_="lister-item-year text-muted unbold").text.replace(
                    '(', '')
                temp_year_of_release = temp_year_of_release.replace(')', '')

            if store.p and store.p.find("span", class_='runtime'):
                temp_runtime = store.p.find("span", class_='runtime').text

            if store.p and store.p.find("span", class_='genre'):
                temp_gen = store.p.find("span", class_='genre').text

            if store.find('div', class_="inline-block ratings-imdb-rating"):
                temp_rate = store.find('div', class_="inline-block ratings-imdb-rating").text.replace('\n', '')

            if store.find('span', class_="metascore"):
                temp_meta = store.find('span', class_="metascore").text

            if store.find('p', class_='') and store.find('p', class_='').find_all('a'):
                temp_dire = store.find('p', class_='').find_all('a')[0].text

            if store.find('p', class_='') and store.find('p', class_='').find_all('a'):
                temp_cas = [a.text for a in store.find('p', class_='').find_all('a')[1:]]

            if store.find_all('span', attrs={'name': 'nv'}):
                value = store.find_all('span', attrs={'name': 'nv'})
                temp_vote = value[0].text

            if store.find_all('p', class_='text-muted'):
                describe = store.find_all('p', class_='text-muted')
                if len(describe) > 1:
                    temp_description_ = describe[1].text.replace('\n', '')
        except (ValueError, TypeError, AttributeError) as error:
            print(error)
            continue

        # Append data to lists only if all values are present and valid
        if temp_meta is not None:
            movie_name.append(temp_name)
            year.append(temp_year_of_release)
            time.append(temp_runtime)
            genre.append(temp_gen)
            rating.append(temp_rate)
            metascore.append(temp_meta)
            director.append(temp_dire)
            cast.append(temp_cas)
            votes.append(temp_vote)
            description.append(temp_description_)

# Create DataFrame and write to Excel file
for i in cast:
    c = ','.join(map(str, i))
    cas.append(c)

movie_list = pd.DataFrame(
    {"Title": movie_name, "Year of Release": year, "Watch Time": time, "Genre": genre, "Movie Rating": rating,
     "Metascore of movie": metascore, "Director": director, "Cast": cas, "Votes": votes, "Description": description})
movie_list.to_excel("movie_data.xlsx")
movie_list['Title'].head(2000).to_csv('static/movieNames.csv', index=False)

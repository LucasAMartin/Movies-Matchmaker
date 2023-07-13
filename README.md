# Movies-Matchmaker

Movies Matchmaker is a web application that helps you find your perfect movie match. Built with a Python/Quart backend and a front end using CSS, HTML, and JavaScript, our app offers a modern and user-friendly interface for discovering new movies.

## Features

- **Search Bar:** Search for almost any movie using our intuitive search bar. Our search algorithm uses fuzzy matching to help you find the movie you're looking for, even if you don't know the exact title.
- **Custom Recommendations:** Our app uses web scraping with BeautifulSoup to gather data about movies and build an effective content-based recommendation system. This system analyzes the attributes of movies you like and provides you with personalized suggestions for other movies you might enjoy.
- **Modern Display:** Movies are displayed in a visually appealing and modern fashion, inspired by Netflix's user interface. While it was built for desktop and that is recommended for the best experience, the app uses a responsive design to ensure that it looks great on any device.
- **Detailed Information:** Click on any movie to view more information about it, including its release date, cast, and plot summary. You can also receive recommendations for other movies based on the one you clicked.
- **Persistent Logins:** Our app uses browser cookies and Quart-Auth to keep you logged in, even after you close your browser. This allows you to save your favorite movies and access your personalized recommendations across multiple sessions.
- **Movie Lists:** Keep track of your favorite movies by adding them to your personal list. Our app displays your list in a modern and visually appealing way, allowing you to easily browse and manage your collection.

## Video Demo (Youtube)
[![Video Demo](https://img.youtube.com/vi/uQgIYnDL5cM/0.jpg)](https://www.youtube.com/watch?v=uQgIYnDL5cM)

## Running the App Locally

If you would like to run Movie Matchmaker locally on your own computer, follow these steps:

- Clone the repository to your local machine.
- Create an API key from TMDB, put it in a .env file in the project root in the format API_KEY=api_key (Example, API_KEY=123kgh43jkh53jhk5jhk5)
- Install the required dependencies by running `pip install -r requirements.txt`.
- Run `pull_new_movies.py` and `cos_similarity.py`
- Start the Quart server by running `python recommendation_app.py`.
- Open your web browser and navigate to `http://localhost:5000` to view the app.



## Contributing

We welcome contributions to Movie Matchmaker! If you would like to contribute, please fork the repository and make your changes. Then submit a pull request for review.

## License

Movie Matchmaker is released under the [Unlicense](https://unlicense.org/). This means that you are free to use, modify, 
and distribute the code in this repository for any purpose, without any restrictions or requirements for attribution.

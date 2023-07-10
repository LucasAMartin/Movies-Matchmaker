import sqlite3

import bcrypt


def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            movie_ids TEXT
        )
    ''')
    conn.commit()
    conn.close()


def insert_user(username, password):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    # Check if the username is already taken
    c.execute('SELECT * FROM users WHERE username = ?', (username,))
    if c.fetchone():
        conn.close()
        return 'Username taken'
    # Insert the new user into the database
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    c.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hashed_password))
    conn.commit()
    conn.close()
    return 'User successfully inserted'


def get_user(username):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT * FROM users WHERE username=?', (username,))
    user = c.fetchone()
    conn.close()
    return user


def insert_movie_id(username, movie_id):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT movie_ids FROM users WHERE username=?', (username,))
    current_movie_ids = c.fetchone()[0]
    updated_movie_ids = current_movie_ids + ',' + str(movie_id)
    c.execute('UPDATE users SET movie_ids=? WHERE username=?', (updated_movie_ids, username))
    conn.commit()
    conn.close()


def get_movie_ids(username):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT movie_ids FROM users WHERE username=?', (username,))
    movie_ids_str = c.fetchone()[0]
    conn.close()
    movie_ids = list(map(int, movie_ids_str.split(',')))
    return movie_ids

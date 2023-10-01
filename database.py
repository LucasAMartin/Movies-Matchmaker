# PYTHON FILE THAT DEFINES THE DB FOR USER INFO AND CONTROLS THE DB METHODS


import sqlite3
import bcrypt


def init_users():
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
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('SELECT movie_ids FROM users WHERE username=?', (username,))
        current_movie_ids = c.fetchone()[0]
        if current_movie_ids is None:
            c.execute('UPDATE users SET movie_ids=? WHERE username=?', (movie_id, username))
            conn.commit()
            conn.close()
            return 'Success: First movie added to your list!'
        if str(movie_id) in current_movie_ids.split(','):
            return 'Movie is already in your list'
        updated_movie_ids = current_movie_ids + ',' + str(movie_id)
        c.execute('UPDATE users SET movie_ids=? WHERE username=?', (updated_movie_ids, username))
        conn.commit()
        conn.close()
        return 'Success: Movie added to your list!'
    except Exception as e:
        return f'Error: {e}'


def remove_movie_id(username, movie_id):
    try:
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('SELECT movie_ids FROM users WHERE username=?', (username,))
        current_movie_ids = c.fetchone()[0]
        if str(movie_id) not in current_movie_ids.split(','):
            return 'Movie is not in your list'
        updated_movie_ids = ','.join([str(id) for id in current_movie_ids.split(',') if str(id) != str(movie_id)])
        c.execute('UPDATE users SET movie_ids=? WHERE username=?', (updated_movie_ids, username))
        conn.commit()
        conn.close()
        return 'Success: Movie removed from your list!'
    except Exception as e:
        return f'Error: {e}'


def get_movie_ids(username):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT movie_ids FROM users WHERE username=?', (username,))
    movie_ids_str = c.fetchone()[0]
    conn.close()
    if movie_ids_str is None:
        return None
    movie_ids = list(map(int, movie_ids_str.split(',')))
    return movie_ids

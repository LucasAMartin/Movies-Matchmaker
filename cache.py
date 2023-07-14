import json
import re
import sqlite3
from datetime import datetime, timedelta


def init_cache():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS cache (
            query TEXT PRIMARY KEY,
            response TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()


def clean_query(query):
    return re.sub(r'api_key=[^&]*&?', '', query)


def get_from_cache(query):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    query = clean_query(query)
    print(query)
    c.execute('SELECT response FROM cache WHERE query = ?', (query,))
    row = c.fetchone()
    conn.close()
    if row is not None:
        # Deserialize the response data from a JSON-formatted string
        response_json = row[0]
        response = json.loads(response_json)
        return response
    else:
        return None


def store_in_cache(query, response):
    # Serialize the response data to a JSON-formatted string
    response_json = json.dumps(response)
    query = clean_query(query)
    print(query)
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('INSERT OR REPLACE INTO cache (query, response) VALUES (?, ?)', (query, response_json))
    conn.commit()
    conn.close()


def clear_cache(age):
    # Compute the cutoff time
    cutoff = datetime.utcnow() - timedelta(minutes=age)

    # Connect to the SQLite database
    conn = sqlite3.connect('database.db')
    c = conn.cursor()

    # Delete rows from the cache table that are older than the cutoff time
    c.execute('DELETE FROM cache WHERE timestamp < ?', (cutoff,))
    print(f'Deleted rows older than {age} minutes')
    conn.commit()
    conn.close()



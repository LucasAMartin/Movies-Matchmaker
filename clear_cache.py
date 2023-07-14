import sys
from cache import clear_cache

if len(sys.argv) < 2:
    print('Usage: python clear_cache.py AGE')
    sys.exit(1)

age = int(sys.argv[1])
clear_cache(age)

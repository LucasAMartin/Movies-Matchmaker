import sys
from cache import clear_cache


def main():
    if len(sys.argv) < 2:
        print('Usage: python clear_cache.py AGE')
        sys.exit(1)

    age = int(sys.argv[1])
    clear_cache(age)


if __name__ == '__main__':
    main()


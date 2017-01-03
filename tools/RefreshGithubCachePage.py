import os
import random
import logging
from multiprocessing.dummy import Pool
from urllib import parse

import requests


logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger()


def main():
    pool = Pool(4)
    baseURL = 'https://raw.githubusercontent.com/ChDC/ChDCNovelReader/master/www/'
    urls = []
    for root, dirs, files in os.walk('www'):
        for file in files:
            file = os.path.join(root, file)
            url = parse.urljoin(baseURL, file.replace(os.sep, '/'))
            randNum = random.randint(0, 100)
            url += "?id=" + str(randNum)
            urls.append(url)
            log.info('Added: %s' % url)
    pool.map(requests.get, urls)
    print('Done')


if __name__ == "__main__":
    main()

import os
import random
import logging
from multiprocessing.dummy import Pool
from urllib import parse

import requests

logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger()


def refreshGithubURL(directory, baseURL):
    pool = Pool(4)
    urls = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            file = os.path.join(root, file)
            url = parse.urljoin(baseURL, file.replace(os.sep, '/'))
            randNum = random.randint(0, 100)
            url += "?id=" + str(randNum)
            urls.append(url)
            log.info('Added: %s' % url)
    pool.map(requests.get, urls)
    log.info('Success to Refresh Github!')


def main():
    import optparse
    parser = optparse.OptionParser()
    parser.add_option('-d', '--dir')
    parser.add_option('-u', '--url')

    opt, args = parser.parse_args()

    # baseURL = 'https://raw.githubusercontent.com/ChDC/ChDCNovelReader/master/'
    if not opt.url or not opt.dir:
        parser.print_help()
        return
    if not os.path.exists(opt.dir):
        log.error('dir doesn\'t exist!')
        return

    refreshGithubURL(opt.dir, opt.url)


if __name__ == "__main__":
    main()

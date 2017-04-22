import os
import random
import logging
import json
import hashlib
from multiprocessing.dummy import Pool
from urllib import parse

import requests

logging.basicConfig(level=logging.ERROR)
log = logging.getLogger()


def checkGithubURL(directory, baseURL, md5s):
    pool = Pool(4)
    fs = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            file = os.path.join(root, file)
            fs.append(file)
            log.info('Added: %s' % file)

    def check(file):
        url = parse.urljoin(baseURL, file.replace(os.sep, '/'))
        randNum = random.randint(0, 100)
        url += "?id=" + str(randNum)
        data = requests.get(url).text
        m = hashlib.md5()
        m.update(data.encode('utf8'))
        md5 = m.hexdigest()
        if file not in md5s or md5s.get(file) != md5:
            print("%s : %s != %s" % (file, md5s.get(file), md5))

    pool.map(check, fs)
    log.info('Success to Refresh Github!')


def main():
    import optparse
    parser = optparse.OptionParser()
    parser.add_option('-d', '--dir')
    parser.add_option('-u', '--url')
    parser.add_option('-m', '--md5')

    opt, args = parser.parse_args()

    opt.url = 'https://raw.githubusercontent.com/ChDC/ChDCNovelReader/dev/'
    opt.dir = 'www'
    opt.md5 = 'www/chcp.manifest'

    if not opt.url or not opt.dir or not opt.md5:
        parser.print_help()
        return

    if not os.path.exists(opt.dir):
        log.error('dir doesn\'t exist!')
        return

    with open(opt.md5) as fh:
        md5s = json.load(fh)
    md5s = {os.path.join(opt.dir, m['file']).replace('/', os.sep): m['hash'] for m in md5s}

    checkGithubURL(opt.dir, opt.url, md5s)


if __name__ == "__main__":
    main()

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


def checkGithubURL(wwwDir, md5s):
    pool = Pool(4)
    baseURL = 'https://raw.githubusercontent.com/ChDC/ChDCNovelReader/master/'
    fs = []
    for root, dirs, files in os.walk(wwwDir):
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
    wwwDir = 'www'
    md5File = 'www/chcp.manifest'
    with open(md5File) as fh:
        md5s = json.load(fh)
    md5s = {os.path.join(wwwDir, m['file']): m['hash'] for m in md5s}
    if not os.path.exists(wwwDir):
        log.error('WWW dir doesn\'t exist!')
        return

    checkGithubURL(wwwDir, md5s)


if __name__ == "__main__":
    main()

import os
import random
import logging
import subprocess
from multiprocessing.dummy import Pool
from urllib import parse

import requests


logging.basicConfig(level=logging.DEBUG)
log = logging.getLogger()


def sh(cmd, stdin=None):
    p = subprocess.Popen(cmd, shell=True, universal_newlines=True,
                         stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate(stdin)
    return p.returncode, out, err


def refreshGithubURL(wwwDir):
    baseURL = 'https://raw.githubusercontent.com/ChDC/ChDCNovelReader/master/'
    pool = Pool(4)
    baseURL = 'https://raw.githubusercontent.com/ChDC/ChDCNovelReader/master/'
    urls = []
    for root, dirs, files in os.walk(wwwDir):
        for file in files:
            file = os.path.join(root, file)
            url = parse.urljoin(baseURL, file.replace(os.sep, '/'))
            randNum = random.randint(0, 100)
            url += "?id=" + str(randNum)
            urls.append(url)
            log.info('Added: %s' % url)
    pool.map(requests.get, urls)
    log.info('Success to Refresh Github!')


def replaceCRLFtoLF(wwwDir):
    def replace(file):
        try:
            with open(file, encoding='utf8', newline='\r\n') as fh:
                data = fh.read()
            if '\r\n' in data:
                data = data.replace('\r\n', '\n')
                with open(file, 'w', encoding='utf8', newline='\n') as fh:
                    fh.write(data)
                log.info('Replaced: %s' % file)
        except:
            log.error('Error in file: %s' % file)

    pool = Pool(4)
    fileSet = []
    for root, dirs, files in os.walk(wwwDir):
        for file in files:
            if os.path.splitext(file)[1] not in (
                '.js', '.html', '.css', '.json', '.map'
            ):
                continue
            file = os.path.join(root, file)
            fileSet.append(file)
    pool.map(replace, fileSet)
    log.info('Success to Replace file for Github!')


def main():
    wwwDir = 'www'
    if not os.path.exists(wwwDir):
        log.error('WWW dir doesn\'t exist!')
        return

    replaceCRLFtoLF(wwwDir)
    r, out, err = sh('cordova-hcp build')
    r, out, err = sh('git add . && git commit -m "Update Resources" && git push github master')
    if r == 0:
        refreshGithubURL(wwwDir)


if __name__ == "__main__":
    main()

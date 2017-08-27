#!/bin/bash
cd `dirname $0`
cd ..
branch=master
url=https://raw.githubusercontent.com/ChDC/ChDCReader/master/
echo Branch on $branch% with url $url

## git checkout %branch% && git merge dev && npm run compile && python tools/ReplaceCRLFtoLF.py -d www && cordova-hcp build && git add . && git commit -m "Update Resources" && git push github %branch% && git checkout dev && python tools/RefreshGithubURL.py -d www -u %url%

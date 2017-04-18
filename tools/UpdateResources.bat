cd /d %~dp0

cd ..
set branch=dev
set url=https://raw.githubusercontent.com/ChDC/ChDCNovelReader/dev/
echo Branch on %branch% with url %url%

git checkout %branch% && python tools/ChangeEnv.py -e debug && npm run build && python tools/ReplaceCRLFtoLF.py -d www && cordova-hcp build && git add . && git commit -m "Update Resources" && git push github %branch% && python tools/RefreshGithubURL.py -d www -u %url%

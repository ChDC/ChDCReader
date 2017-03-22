cd ..

npm run build && python tools/ReplaceCRLFtoLF.py && cordova-hcp build && git add . && git commit -m "Update Resources" && git push github master && python tools/RefreshGithubURL.py

cd /d %~dp0

cd ..
git checkout dev && python tools/ChangeEnv.py -e debug && git add . && git commit -m "Update" && git push bb dev
pause

cd /d %~dp0

cd ..
git checkout dev && git add . && git commit -m "Update" && git push bb dev
pause

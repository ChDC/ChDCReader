cd /d %~dp0

cd ..
set branch=master

git checkout %branch% && git merge dev && cordova build android --release --buildConfig "E:\AppData\Sign\cordova.json"
pause

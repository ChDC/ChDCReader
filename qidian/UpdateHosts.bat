@echo off
%1 mshta vbscript:CreateObject("Shell.Application").ShellExecute("cmd.exe","/c %~s0 ::","","runas",1)(window.close)&&exit

cd /d "%~dp0"

curl "https://raw.githubusercontent.com/racaljk/hosts/master/hosts" > hosts
::echo %errorlevel%
if %errorlevel% == 9009 goto :error
copy /y "hosts" "%SystemRoot%\System32\drivers\etc\hosts"
ipconfig /flushdns
echo Done

@ping -n 4 127.0 > nul
exit

:error
echo CURL is lost
pause

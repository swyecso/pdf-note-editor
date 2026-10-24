@echo off
title PDF Note Editor
echo ========================================================
echo               PDF Note Editor
echo ========================================================
echo.
echo Launching PDF Note Editor in your default browser...
echo.

set TARGET_FILE=%~dp0pdf-notes-editor.html
if not exist "%TARGET_FILE%" set TARGET_FILE=%~dp0dist\pdf-notes-editor.html
if not exist "%TARGET_FILE%" set TARGET_FILE=%~dp0dist\index.html

start "" "%TARGET_FILE%"

echo Application launched! You can close this window at any time.
timeout /t 3 >nul
exit

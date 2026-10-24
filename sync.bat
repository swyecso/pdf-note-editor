@echo off
title PDF Note Editor - Build & Sync
cd /d "%~dp0"
node scripts\sync.mjs
if %ERRORLEVEL% neq 0 (
    echo.
    pause
    exit /b %ERRORLEVEL%
)
timeout /t 4 >nul

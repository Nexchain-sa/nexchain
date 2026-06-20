@echo off
echo.
echo ============================================
echo   FLOWRIZ Mobile App - Setup
echo ============================================
echo.

echo [1/3] Downloading fonts...
node download-fonts.js

echo.
echo [2/3] Installing dependencies...
npm install

echo.
echo [3/3] Setup complete!
echo.
echo To run the app now, type:
echo    npm start
echo.
pause

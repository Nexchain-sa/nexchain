@echo off
echo ============================================
echo   FLOWRIZ Mobile App - Setup
echo ============================================
echo.

echo [1/3] Downloading Tajawal fonts...
node download-fonts.js

echo.
echo [2/3] Installing dependencies...
npm install

echo.
echo [3/3] Done!
echo.
echo To start the app:
echo   npm start          -- Start Expo (scan QR code)
echo   npm run android    -- Run on Android emulator
echo.
echo To build APK for testing:
echo   npx eas build --platform android --profile preview
echo.
pause

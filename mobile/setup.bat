@echo off
chcp 65001 > nul
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║     FLOWRIZ Mobile App - Setup           ║
echo  ║     Black x Green x Gold                 ║
echo  ╚══════════════════════════════════════════╝
echo.

echo [1/4] Downloading Tajawal fonts...
node download-fonts.js
echo.

echo [2/4] Installing npm dependencies...
npm install
echo.

echo [3/4] Installing EAS CLI...
npm install -g eas-cli
echo.

echo [4/4] Done! Setup complete.
echo.
echo ══════════════════════════════════════════════
echo   HOW TO RUN:
echo ══════════════════════════════════════════════
echo.
echo  [Test on your phone - FREE]:
echo    1. Install "Expo Go" app on your phone
echo    2. Make sure phone and PC on same WiFi
echo    3. Run:  npm start
echo    4. Scan the QR code with Expo Go
echo.
echo  [Build APK for Android - FREE]:
echo    1. Create free account: https://expo.dev
echo    2. Run:  npx eas login
echo    3. Run:  npx eas build --platform android --profile preview
echo    4. Download APK from expo.dev dashboard
echo.
echo  [Publish to Google Play]:
echo    1. Run:  npx eas build --platform android --profile production
echo    2. Upload AAB file to Google Play Console
echo.
echo ══════════════════════════════════════════════
pause

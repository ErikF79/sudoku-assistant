@echo off
setlocal enabledelayedexpansion
title Aiuto Sudoku - Test locale
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERRORE] Node.js non trovato nel PATH.
  echo Installa Node.js ^(https://nodejs.org^) e riprova.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\next" (
  echo.
  echo Installazione dipendenze ^(prima volta, puo richiedere qualche minuto^)...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERRORE] npm install non riuscito.
    pause
    exit /b 1
  )
)

:menu
cls
echo ============================================
echo    AIUTO SUDOKU  -  TEST LOCALE
echo ============================================
echo.
echo   [1] Anteprima PWA  (build + server)   ^<-- consigliato
echo   [2] Sviluppo        (ricarica automatica)
echo   [3] Solo build
echo   [0] Esci
echo.
set "scelta="
set /p "scelta=Scelta: "

if "%scelta%"=="1" goto preview
if "%scelta%"=="2" goto dev
if "%scelta%"=="3" goto buildonly
if "%scelta%"=="0" exit /b 0
goto menu

:preview
echo.
echo ==^> Costruzione build di produzione...
call npm run build
if errorlevel 1 (
  echo.
  echo [ERRORE] Build non riuscita.
  pause
  goto menu
)
echo.
echo ==^> Avvio server di anteprima su http://localhost:4173
echo     ^(per installare la PWA: menu del browser -^> Installa app^)
echo.
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:4173'"
node serve-preview.mjs 4173
goto menu

:dev
echo.
echo ==^> Avvio server di sviluppo su http://localhost:9002
echo.
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 6; Start-Process 'http://localhost:9002'"
call npm run dev
goto menu

:buildonly
echo.
echo ==^> Build di produzione...
call npm run build
echo.
echo Build completata. Output nella cartella "out".
pause
goto menu

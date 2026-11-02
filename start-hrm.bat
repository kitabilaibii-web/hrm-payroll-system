@echo off
title HRM Pro Launcher
cd /d "%~dp0"
if not exist "backend\node_modules" (
  echo Installing backend packages - first time only, please wait...
  cd backend
  call npm install
  cd ..
)
if not exist "frontend\node_modules" (
  echo Installing frontend packages - first time only, please wait...
  cd frontend
  call npm install
  cd ..
)
start "HRM Backend - do not close" cmd /k "cd /d %~dp0backend && npm start"
start "HRM Frontend - do not close" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Starting... browser will open in 10 seconds.
timeout /t 10 /nobreak >nul
start http://localhost:5173
exit

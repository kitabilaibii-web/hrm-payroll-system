@echo off
title Fix .env
echo.
echo This will create backend\.env with your Gemini key.
echo.
set /p KEY=Paste your Gemini API key here and press Enter: 
if "%KEY%"=="" (
  echo No key entered. Run this file again.
  pause
  exit /b
)
(
echo MONGO_URI=mongodb://127.0.0.1:27017/hrmDB
echo PORT=5000
echo JWT_SECRET=hrm-secret-key-123456
echo OFFICE_START=09:30
echo GEMINI_MODEL=gemini-3.7-flash
echo GEMINI_API_KEY=%KEY%
) > "%~dp0backend\.env"
findstr /b /c:"GEMINI_API_KEY=" "%~dp0backend\.env" >nul && echo. && echo DONE - key saved correctly. Now close the Backend window and run start-hrm.bat again.
pause

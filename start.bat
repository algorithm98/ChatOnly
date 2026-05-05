@echo off
set PATH=C:\Program Files\nodejs;%PATH%
cd /d %~dp0
start cmd /k "cd server && node index.js"
timeout /t 2 /nobreak >nul
start cmd /k "cd client && npx vite"
echo Server and client started in separate windows.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3000
timeout /t 5
start http://localhost:5173

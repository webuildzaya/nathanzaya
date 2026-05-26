@echo off
cd /d "%~dp0"
echo Starting Zaya at http://localhost:3000
node node_modules\next\dist\bin\next dev -p 3000 > dev-server.log 2>&1
echo.
echo Server stopped. Press any key to close this window.
pause > nul

@echo off
setlocal

cd /d "%~dp0"

echo.
echo ========================================
echo   Sunghyun Portfolio - GitHub Deploy
echo ========================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish.ps1"

if errorlevel 1 (
  echo.
  echo Deployment failed. Please review the error above.
  echo.
  pause
  exit /b 1
)

echo.
echo Deployment completed successfully.
echo Website: https://shpark-jason.github.io/sunghyun/
echo.
pause

endlocal

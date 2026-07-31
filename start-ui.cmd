@echo off
setlocal

set "SKILL_DIR=%~dp0"
set "NODE_EXE="

if defined CODEX_HISTORY_NODE if exist "%CODEX_HISTORY_NODE%" set "NODE_EXE=%CODEX_HISTORY_NODE%"

if not defined NODE_EXE (
  for /f "delims=" %%I in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%I"
)

if not defined NODE_EXE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
  set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
)

if not defined NODE_EXE (
  echo Node.js 18 or newer was not found.
  echo Install Node.js or set CODEX_HISTORY_NODE to node.exe.
  pause
  exit /b 1
)

"%NODE_EXE%" "%SKILL_DIR%scripts\start-ui.js" %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" pause
exit /b %EXIT_CODE%

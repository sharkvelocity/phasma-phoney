@echo off
setlocal EnableExtensions

rem --- Target folder (current or drag-drop) ---
if "%~1"=="" ( set "T=%CD%" ) else ( set "T=%~1" )
if not exist "%T%" echo Folder not found & exit /b 1

rem --- Timestamp: YYYYMMDD_HHMM (locale-agnostic via PowerShell) ---
for /f %%I in ('powershell -NoProfile -Command "(Get-Date).ToString(\"yyyyMMdd_HHmm\")"') do set "STAMP=%%I"

set "OUT=%T%\RepoTree_%STAMP%.txt"

pushd "%T%" >nul 2>&1

rem --- 1) TREE (omit .git) ---
rem Use PowerShell to filter lines that include a .git directory: \.git\ or \.git end
tree /F /A | powershell -NoProfile -Command ^
  "$re='\\\.git(\\\|$)';" ^
  "$in = [Console]::In.ReadToEnd();" ^
  "$in -split \"`r?`n\" | Where-Object { $_ -and ($_ -notmatch $re) } | Set-Content -LiteralPath '%OUT%' -Encoding ascii"

rem --- 2) Totals (omit .git) ---
where powershell >nul 2>&1
if not errorlevel 1 (
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$b=(Resolve-Path '.').Path;" ^
    "$re='\\\.git(\\\|$)';" ^
    "$files=Get-ChildItem -LiteralPath $b -Recurse -Force -File      | Where-Object { $_.FullName -notmatch $re };" ^
    "$dirs =Get-ChildItem -LiteralPath $b -Recurse -Force -Directory | Where-Object { $_.FullName -notmatch $re };" ^
    "$f=$files.Count; $d=$dirs.Count+1; $bytes=($files | Measure-Object Length -Sum).Sum;" ^
    "Add-Content -LiteralPath '%OUT%' ('');" ^
    "Add-Content -LiteralPath '%OUT%' ('Total: ' + $d + ' dirs, ' + $f + ' files, ' + $bytes + ' bytes');"
) else (
  echo.>>"%OUT%"
  echo Total: (PowerShell not available to count)>>"%OUT%"
)

popd >nul

echo Created: "%OUT%"
start "" "%SystemRoot%\system32\notepad.exe" "%OUT%"
exit /b 0

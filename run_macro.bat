@echo off
rem Double-click to start RobinMacro on Windows (run_macro.command is the macOS version).
rem Kept to one line: cmd reads .bat files while running, and the updater may replace this one.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\run_macro.ps1" || pause & exit /b

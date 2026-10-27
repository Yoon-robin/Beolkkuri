@echo off
rem Double-click to install what Beolkkuri needs on Windows (install_dependencies.command is the macOS version).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\install_dependencies.ps1" %* || pause & exit /b

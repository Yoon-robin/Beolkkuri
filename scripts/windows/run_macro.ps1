# Starts Beolkkuri on Windows. run_macro.bat and the Beolkkuri shortcut run this.
# The macOS version is run_macro.command.
#
# Set BEOLKKURI_VENV to use another folder for the Python environment.

$MacroDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Venv = if ($env:BEOLKKURI_VENV) { $env:BEOLKKURI_VENV } else { Join-Path $HOME "beolkkuri-env" }
$VenvPython = Join-Path $Venv "Scripts\python.exe"
$Host.UI.RawUI.WindowTitle = "벌꿀이 (Beolkkuri)"

# Stop only an existing Beolkkuri started from this environment, not every Python on the PC.
# The venv's python.exe starts the real interpreter as a child, so end the whole tree.
$processes = @(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue)
$running = $processes | Where-Object { $_.Name -eq "python.exe" -and $_.ExecutablePath -eq $VenvPython -and $_.CommandLine -match "main\.py" }
foreach ($process in $running) {
	# Close its window too, or the old window reports the stop as an error:
	# python.exe <- powershell (run_macro.ps1) <- cmd (run_macro.bat, when double-clicked).
	$target = $process
	foreach ($launcher in "run_macro\.ps1", "run_macro\.bat") {
		$parent = $processes | Where-Object { $_.ProcessId -eq $target.ParentProcessId -and $_.CommandLine -match $launcher }
		if (-not $parent) { break }
		$target = $parent
	}
	Write-Host "Stopping existing Beolkkuri process: $($process.ProcessId)"
	taskkill /PID $target.ProcessId /T /F 2>&1 | Out-Null
}

if (-not (Test-Path $VenvPython)) {
	# First launch: nothing installed yet, so run the installer instead of failing.
	Write-Host "아직 설치가 안 됐어요. 설치를 먼저 시작할게요." -ForegroundColor Yellow
	Write-Host "Beolkkuri is not installed yet. Starting the installer..." -ForegroundColor Yellow
	powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "install_dependencies.ps1") -NoLaunch
	# The installer already showed what went wrong.
	if (-not (Test-Path $VenvPython)) { exit 0 }
	$Host.UI.RawUI.WindowTitle = "벌꿀이 (Beolkkuri)"
}

# Read and write files as UTF-8 regardless of the Windows language (Korean Windows defaults to CP949).
$env:PYTHONUTF8 = "1"
# Tells the macro that this window starts it again when it exits with code 75 after an update.
$env:BEOLKKURI_LAUNCHER = "1"
Set-Location (Join-Path $MacroDir "src")
Write-Host "벌꿀이 실행 중... 이 창은 매크로가 켜져 있는 동안 열어 두세요." -ForegroundColor Green
Write-Host "Starting Beolkkuri. Keep this window open while the macro runs." -ForegroundColor Green
& $VenvPython --version
do {
	& $VenvPython main.py
	$code = $LASTEXITCODE
	if ($code -eq 75) {
		Write-Host ""
		Write-Host "업데이트를 마쳤어요. 벌꿀이를 다시 켜요..." -ForegroundColor Green
		Write-Host "Update installed. Restarting Beolkkuri..." -ForegroundColor Green
	}
} while ($code -eq 75)

if ($code -ne 0) {
	# Keep the error on screen; a double-clicked window would otherwise close at once.
	Write-Host ""
	Write-Host "벌꿀이가 오류로 멈췄어요 (코드 $code). 위 내용을 GitHub Issues에 올려 주세요." -ForegroundColor Red
	Write-Host "Beolkkuri stopped with an error (code $code). Please report the text above on GitHub Issues." -ForegroundColor Red
	Read-Host "엔터를 누르면 창이 닫혀요 / Press Enter to close" | Out-Null
}
exit 0

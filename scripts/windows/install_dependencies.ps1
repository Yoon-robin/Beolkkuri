# RobinMacro installer for Windows. install.ps1 runs it after downloading, or
# double-click install_dependencies.bat in the RobinMacro folder. It installs
# Python 3.12, the libraries the macro needs, and RobinMacro shortcuts.
# The macOS version is install_dependencies.command.
#
#   -Quiet       no questions and no Python download; used by the in-app updater
#                to add libraries that a new version needs
#   -NoShortcut  do not create the Desktop / Start menu shortcuts
#   -NoLaunch    do not offer to open RobinMacro at the end (run_macro.ps1 opens it)
#
# Set ROBINMACRO_VENV to use another folder for the Python environment.
param(
	[switch]$Quiet,
	[switch]$NoShortcut,
	[switch]$NoLaunch
)

$PythonVersion = "3.12"
$PythonInstaller = "https://www.python.org/ftp/python/3.12.10/python-3.12.10-amd64.exe"
$MacroDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Venv = if ($env:ROBINMACRO_VENV) { $env:ROBINMACRO_VENV } else { Join-Path $HOME "robin-macro-env" }
$VenvPython = Join-Path $Venv "Scripts\python.exe"
# pip prints thousands of lines; keep them in a log and show one line per library.
$Log = Join-Path $HOME "RobinMacro-install.log"
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$Host.UI.RawUI.WindowTitle = "RobinMacro 설치 / installer"
Set-Content -Path $Log -Value "RobinMacro install log $(Get-Date -Format s)" -Encoding UTF8
$failures = 0

# Print a numbered step in Korean with the English underneath.
function Say-Step($Number, $Korean, $English) {
	if ($Quiet) { return }
	Write-Host ""
	Write-Host "[$Number] $Korean" -ForegroundColor Cyan
	Write-Host "      $English" -ForegroundColor Gray
}

function Say($Text, $Color = "White") {
	if (-not $Quiet) { Write-Host $Text -ForegroundColor $Color }
}

function Ask-YesNo($Question) {
	if ($Quiet) { return $false }
	$answer = Read-Host "$Question [Y/n]"
	return ($answer -eq "" -or $answer -match "^[yY]")
}

# Interactive runs keep the window open and exit 0, so install_dependencies.bat does not pause twice.
function Finish($Code) {
	if ($Quiet) { exit $Code }
	Write-Host ""
	Read-Host "엔터를 누르면 창이 닫혀요 / Press Enter to close" | Out-Null
	exit 0
}

# A 64-bit Python 3.12. The "python" command itself is skipped on purpose: on a fresh
# Windows it is a shortcut that opens the Microsoft Store.
function Find-Python {
	$candidates = @()
	if (Get-Command py.exe -ErrorAction SilentlyContinue) {
		$fromLauncher = & py.exe "-$PythonVersion" -c "import sys; print(sys.executable)" 2>$null
		if ($LASTEXITCODE -eq 0 -and $fromLauncher) { $candidates += "$fromLauncher".Trim() }
	}
	$candidates += @(
		(Join-Path $env:LOCALAPPDATA "Programs\Python\Python312\python.exe"),
		(Join-Path $env:ProgramFiles "Python312\python.exe"),
		"C:\Python312\python.exe"
	)
	foreach ($candidate in $candidates) {
		if (-not (Test-Path $candidate)) { continue }
		$version = & $candidate -c "import sys, struct; print('%d.%d-%d' % (sys.version_info[0], sys.version_info[1], struct.calcsize('P') * 8))" 2>$null
		if ("$version".Trim() -eq "$PythonVersion-64") { return $candidate }
	}
	return $null
}

function Install-Package($Spec) {
	if (-not $Quiet) { Write-Host "   • $Spec " -NoNewline -ForegroundColor Gray }
	# The list doubles as a constraints file, so a later library cannot pull in numpy 2 again.
	$output = & $VenvPython -m pip install --prefer-binary --disable-pip-version-check --default-timeout=100 --log $Log -c $Requirements $Spec 2>&1
	if ($LASTEXITCODE -eq 0) {
		if (-not $Quiet) { Write-Host "✓" -ForegroundColor Green }
		return $true
	}
	if (-not $Quiet) {
		Write-Host "✗" -ForegroundColor Red
		$output | Select-Object -Last 8 | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkGray }
	}
	return $false
}

function New-Shortcut($Path, $Icon) {
	$shell = New-Object -ComObject WScript.Shell
	$shortcut = $shell.CreateShortcut($Path)
	$shortcut.TargetPath = Join-Path $MacroDir "run_macro.bat"
	$shortcut.WorkingDirectory = $MacroDir
	$shortcut.Description = "RobinMacro"
	if ($Icon -and (Test-Path $Icon)) { $shortcut.IconLocation = "$Icon,0" }
	$shortcut.Save()
}

if (-not $Quiet) {
	Write-Host "==============================================" -ForegroundColor Yellow
	Write-Host "   RobinMacro 설치 / RobinMacro installer" -ForegroundColor Yellow
	Write-Host "==============================================" -ForegroundColor Yellow
	Write-Host "창을 닫지 말고 끝날 때까지 기다려 주세요. (5~10분 걸려요)"
	Write-Host "Keep this window open until it finishes (5-10 minutes)."
}

Say-Step "1/5" "Windows 버전 확인" "Checking Windows"
$build = [Environment]::OSVersion.Version.Build
if (-not [Environment]::Is64BitOperatingSystem -or $build -lt 17763) {
	Say "이 PC에서는 쓸 수 없어요. 64비트 Windows 10(1809) 이상이 필요해요." Red
	Say "Your PC is not compatible. RobinMacro needs 64-bit Windows 10 (1809) or later." Red
	Finish 1
}
Say "쓸 수 있는 PC예요 / Your PC is compatible" Green

Say-Step "2/5" "파이썬 확인" "Checking Python"
$python = Find-Python
if ($python) {
	Say "Python $PythonVersion 이 이미 있어요 / Python $PythonVersion is already installed: $python" Green
} elseif ($Quiet) {
	Add-Content -Path $Log -Value "Python $PythonVersion was not found; skipped in quiet mode." -Encoding UTF8
	exit 1
} else {
	Say "파이썬 $PythonVersion 을 설치해요. 설치 창이 잠깐 떴다가 저절로 닫혀요." Magenta
	Say "Installing Python $PythonVersion. Its installer shows a progress window and closes by itself." Magenta
	$setup = Join-Path ([IO.Path]::GetTempPath()) "python-3.12-amd64.exe"
	try {
		Invoke-WebRequest -UseBasicParsing $PythonInstaller -OutFile $setup
		# Just for this user (no administrator needed), with the "py" launcher, without touching PATH.
		Start-Process -FilePath $setup -ArgumentList "/passive", "InstallAllUsers=0", "Include_launcher=1", "InstallLauncherAllUsers=0", "PrependPath=0", "Include_test=0" -Wait
	} catch {
		Add-Content -Path $Log -Value "Python download/install failed: $_" -Encoding UTF8
	} finally {
		Remove-Item $setup -Force -ErrorAction SilentlyContinue
	}
	$python = Find-Python
	if (-not $python) {
		Say "파이썬을 설치하지 못했어요. https://www.python.org/downloads/ 에서 Python $PythonVersion (64-bit)을 직접 설치한 뒤 다시 실행해 주세요." Red
		Say "Could not install Python. Install Python $PythonVersion (64-bit) from python.org, then run this again." Red
		Finish 1
	}
	Say "파이썬을 설치했어요 / Python installed: $python" Green
}

Say-Step "3/5" "글자 인식(OCR) 확인" "Checking text recognition (OCR)"
# The macro reads game text with the OCR engine built into Windows. English reads
# best; a Korean-only Windows can still read most numbers and English text.
$ocrLanguages = @()
try {
	$null = [Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
	$ocrLanguages = @([Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages | ForEach-Object { $_.LanguageTag })
} catch {}
if ($ocrLanguages | Where-Object { $_ -like "en*" }) {
	Say "영어 글자 인식이 설치돼 있어요 / English OCR is installed" Green
} else {
	Say "영어 글자 인식(OCR)이 없어요. 있으면 꿀 양이나 퀘스트 글자를 더 정확하게 읽어요." Yellow
	Say "English OCR is not installed. It makes reading honey and quest text more accurate." Yellow
	if (Ask-YesNo "지금 설치할까요? 관리자 확인 창이 뜨면 '예'를 눌러 주세요. / Install it now? (asks for administrator approval)") {
		try {
			Start-Process powershell -Verb RunAs -Wait -ArgumentList "-NoProfile", "-Command", "Add-WindowsCapability -Online -Name 'Language.OCR~~~en-US~0.0.1.0'"
			# This process cached the language list, so ask a fresh one.
			$installed = powershell -NoProfile -Command "[void][Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]; [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages | ForEach-Object { `$_.LanguageTag }"
			if ($installed | Where-Object { $_ -like "en*" }) {
				Say "영어 글자 인식을 설치했어요 / English OCR installed" Green
			} else {
				Say "설치되지 않았어요. 나중에 이 설치를 다시 실행하면 돼요. / It was not installed; run this installer again later." Yellow
			}
		} catch {
			Say "설치하지 않고 넘어가요. 나중에 이 설치를 다시 실행하면 돼요. / Skipped; run this installer again later to add it." Yellow
		}
	}
}

Say-Step "4/5" "매크로 전용 환경과 라이브러리 설치 (가장 오래 걸려요)" "Installing libraries (this takes the longest)"
if (-not $python) { $python = Find-Python }
if (-not (Test-Path $VenvPython)) {
	if (-not $python) {
		Add-Content -Path $Log -Value "Python $PythonVersion was not found." -Encoding UTF8
		Finish 1
	}
	Say "Creating virtual environment at $Venv" Magenta
	& $python -m venv $Venv 2>&1 | Out-File -FilePath $Log -Append -Encoding utf8
}
if (-not (Test-Path $VenvPython)) {
	Say "매크로 전용 환경을 만들지 못했어요 / Could not create the virtual environment: $Venv" Red
	Finish 1
}
& $VenvPython -m pip install --upgrade --disable-pip-version-check --log $Log pip setuptools wheel *> $null
Say "라이브러리를 하나씩 설치해요. / Installing libraries one by one." Magenta
$Requirements = Join-Path $MacroDir "requirements-windows.txt"
$specs = Get-Content $Requirements -Encoding UTF8 |
	ForEach-Object { $_.Trim() } |
	Where-Object { $_ -and -not $_.StartsWith("#") }
foreach ($spec in $specs) {
	if (-not (Install-Package $spec)) { $failures++ }
}

Say-Step "5/5" "바로가기 만들기" "Creating shortcuts"
if ($NoShortcut) {
	Say "바로가기는 만들지 않아요 / Skipping shortcuts" Gray
} else {
	try {
		# Windows shortcuts need an .ico, so convert the logo once with Pillow.
		$icon = Join-Path $Venv "robinmacro.ico"
		& $VenvPython -c "import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[2], sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])" (Join-Path $MacroDir ".github\logo.png") $icon 2>&1 | Out-File -FilePath $Log -Append -Encoding utf8
		$desktop = [Environment]::GetFolderPath("Desktop")
		$programs = [Environment]::GetFolderPath("Programs")
		New-Shortcut (Join-Path $desktop "RobinMacro.lnk") $icon
		New-Shortcut (Join-Path $programs "RobinMacro.lnk") $icon
		Say "바탕화면과 시작 메뉴에 RobinMacro 바로가기를 만들었어요." Green
		Say "Created RobinMacro shortcuts on your Desktop and in the Start menu." Green
	} catch {
		Add-Content -Path $Log -Value "Shortcut creation failed: $_" -Encoding UTF8
		Say "바로가기는 만들지 못했어요. 대신 RobinMacro 폴더의 run_macro.bat 을 더블클릭하세요." Yellow
		Say "Could not create the shortcuts; double-click run_macro.bat in the RobinMacro folder instead." Yellow
	}
}

if ($Quiet) { exit $(if ($failures -gt 0) { 1 } else { 0 }) }

if ($failures -gt 0) {
	Write-Host ""
	Write-Host "라이브러리 $failures 개를 설치하지 못했어요. 설치를 한 번 더 실행하면 대부분 해결돼요." -ForegroundColor Yellow
	Write-Host "그래도 안 되면 이 파일을 GitHub Issues에 올려 주세요: $Log" -ForegroundColor Yellow
	Write-Host "$failures libraries failed. Running the installer again usually fixes it; otherwise attach $Log to a GitHub issue." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "설치가 끝났어요! / Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Windows는 따로 권한을 줄 필요가 없어요. 이렇게 하면 돼요 / Next:" -ForegroundColor Cyan
Write-Host "  1) 로블록스에서 비 스웜 시뮬레이터에 들어가요"
Write-Host "  2) 바탕화면의 RobinMacro 를 더블클릭해요"
Write-Host "  1) Open Bee Swarm Simulator in Roblox"
Write-Host "  2) Double-click RobinMacro on your Desktop"
Write-Host ""
Write-Host "디스플레이 배율은 100%를 추천해요 (설정 > 시스템 > 디스플레이)."
Write-Host "Display scale 100% is recommended (Settings > System > Display)."
Write-Host ""
if ($NoLaunch) { exit 0 }
if (Ask-YesNo "지금 RobinMacro를 열까요? / Open RobinMacro now?") {
	Start-Process -FilePath (Join-Path $MacroDir "run_macro.bat") -WorkingDirectory $MacroDir
	exit 0
}
Finish $(if ($failures -gt 0) { 1 } else { 0 })

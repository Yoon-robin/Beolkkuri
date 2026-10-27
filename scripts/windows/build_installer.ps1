# Builds dist\Beolkkuri-Setup.exe: Python 3.12 with the macro's libraries, the macro
# files (git archive of -Ref), Beolkkuri.exe and the installer, all in one file.
# .github/workflows/windows-installer.yml runs it for every release. It works on any
# Windows 10/11 PC with git; the C# compiler is part of Windows (.NET Framework 4).
#
#   powershell -ExecutionPolicy Bypass -File scripts\windows\build_installer.ps1
#
#   -Ref       commit or tag to package (default HEAD; uncommitted changes are left out)
#   -Test      afterwards, install silently into build\installer\test-install and check
#              that its Python loads the libraries (registers an uninstall entry, so CI only)
param(
	[string]$Ref = "HEAD",
	[string]$PythonVersion = "3.12.10",
	[string]$OutFile,
	[switch]$Test
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.IO.Compression.FileSystem

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
if (-not $OutFile) { $OutFile = Join-Path $Root "dist\Beolkkuri-Setup.exe" }
$Work = Join-Path $Root "build\installer"
$Cache = Join-Path $Root "build\cache"
$Sources = Join-Path $PSScriptRoot "installer"
$Payload = Join-Path $Work "payload"
$Runtime = Join-Path $Payload "runtime"
$Python = Join-Path $Runtime "python.exe"
$Csc = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\csc.exe"

function Step($Text) { Write-Host "==> $Text" -ForegroundColor Cyan }

function Run($File) {
	& $File @args
	if ($LASTEXITCODE -ne 0) { throw "$File $args failed with exit code $LASTEXITCODE" }
}

function Download($Url, $Path) {
	if (Test-Path $Path) { return }
	Invoke-WebRequest -UseBasicParsing $Url -OutFile "$Path.part"
	Move-Item "$Path.part" $Path
}

if (-not (Test-Path $Csc)) { throw "C# compiler not found: $Csc" }
if (Test-Path $Work) { Remove-Item -Recurse -Force $Work }
New-Item -ItemType Directory -Force $Payload, $Cache | Out-Null

Step "Macro files ($Ref)"
$archive = Join-Path $Work "app.zip"
Run git -C $Root archive --format=zip -o $archive $Ref
[IO.Compression.ZipFile]::ExtractToDirectory($archive, $Payload)
$version = (Get-Content (Join-Path $Payload "src\webapp\version.txt") -Raw).Trim()
$requirements = Join-Path $Payload "requirements-windows.txt"

Step "Python $PythonVersion"
# python.org's NuGet package is a complete Python that works from any folder.
$nupkg = Join-Path $Cache "python.$PythonVersion.nupkg"
Download "https://www.nuget.org/api/v2/package/python/$PythonVersion" $nupkg
$nuget = Join-Path $Work "nuget"
[IO.Compression.ZipFile]::ExtractToDirectory($nupkg, $nuget)
Move-Item (Join-Path $nuget "tools") $Runtime

Step "Libraries"
# Only the bundled Python's own packages, never ones from the build PC's user folder.
$env:PYTHONNOUSERSITE = "1"
Run $Python -m pip --version
# --no-compile: Python writes the .pyc files on the user's PC the first time, which keeps the download smaller.
Run $Python -m pip install --disable-pip-version-check --no-warn-script-location --no-compile --prefer-binary -r $requirements -c $requirements
$imports = "numpy, cv2, PIL, mss, eel, gevent, pyautogui, pynput, requests, discord, discord_webhook, aiohttp, flask, pypresence, fuzzywuzzy, Levenshtein, winocr"
Run $Python -c "import $imports; print('libraries load')"
# Script launchers (pip.exe and friends) point at this build folder; the macro runs "python -m pip".
Remove-Item -Recurse -Force (Join-Path $Runtime "Scripts") -ErrorAction SilentlyContinue

Step "Icon and title font"
$icon = Join-Path $Work "beolkkuri.ico"
Run $Python -c "import sys; from PIL import Image; Image.open(sys.argv[1]).save(sys.argv[2], sizes=[(s, s) for s in (16, 20, 24, 32, 40, 48, 64, 128, 256)])" (Join-Path $Payload ".github\logo.png") $icon
# The website's heading font (SIL Open Font License); the installer falls back to Malgun Gothic without it.
$font = Join-Path $Cache "BlackHanSans-Regular.ttf"
try {
	Download "https://raw.githubusercontent.com/google/fonts/main/ofl/blackhansans/BlackHanSans-Regular.ttf" $font
} catch {
	Write-Warning "Title font not downloaded, using Malgun Gothic: $_"
	$font = $null
}

Step "Beolkkuri.exe and the installer"
$common = @("/nologo", "/codepage:65001", "/platform:x64", "/optimize+", "/win32icon:$icon", "/win32manifest:$(Join-Path $Sources 'app.manifest')")
Run $Csc @common /target:exe "/out:$(Join-Path $Payload 'Beolkkuri.exe')" (Join-Path $Sources "Launcher.cs")
$resources = @("/resource:$(Join-Path $Payload 'site\assets\logo.png'),logo.png", "/resource:$(Join-Path $Payload 'site\assets\bee.png'),bee.png")
if ($font) { $resources += "/resource:$font,title.ttf" }
$stub = Join-Path $Work "setup-stub.exe"
Run $Csc @common @resources /target:winexe /r:System.IO.Compression.dll "/out:$stub" (Join-Path $Sources "Setup.cs")

Step "Trimming"
# Nothing here is loaded when the macro runs: test suites, the import check's .pyc files,
# files for building packages, the sources of the UI and the website, and font styles the
# hourly report doesn't use. An in-app update brings back what it ships (ui/, site/, fonts).
$sitePackages = Join-Path $Runtime "Lib\site-packages"
Get-ChildItem $sitePackages -Recurse -Directory | Where-Object { $_.Name -in "tests", "__pycache__" } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
foreach ($dir in "Lib\ensurepip", "include", "libs") { Remove-Item -Recurse -Force (Join-Path $Runtime $dir) -ErrorAction SilentlyContinue }
foreach ($dir in "ui", "site", ".github") { Remove-Item -Recurse -Force (Join-Path $Payload $dir) -ErrorAction SilentlyContinue }
$inter = Join-Path $Payload "src\hourly_report\Inter"
Get-ChildItem $inter -Recurse -Filter *.ttf | Where-Object { $_.Name -notlike "Inter_18pt-*" -or $_.Name -like "*Italic*" } | Remove-Item -Force
Run $Python -c "import $imports; print('libraries still load')"
Get-ChildItem $sitePackages -Recurse -Directory -Filter __pycache__ | Remove-Item -Recurse -Force

Step "Beolkkuri-Setup.exe"
$zip = Join-Path $Work "payload.zip"
[IO.Compression.ZipFile]::CreateFromDirectory($Payload, $zip, [IO.Compression.CompressionLevel]::Optimal, $false)
# Layout read by Setup.cs (Payload): [installer][zip][zip length, 8 bytes][magic "BKPAYLD1"]
New-Item -ItemType Directory -Force (Split-Path $OutFile) | Out-Null
$out = [IO.File]::Create($OutFile)
try {
	foreach ($part in $stub, $zip) {
		$in = [IO.File]::OpenRead($part)
		try { $in.CopyTo($out) } finally { $in.Dispose() }
	}
	[byte[]]$trailer = [BitConverter]::GetBytes([long](Get-Item $zip).Length) + [Text.Encoding]::ASCII.GetBytes("BKPAYLD1")
	$out.Write($trailer, 0, $trailer.Length)
} finally {
	$out.Dispose()
}
$size = [math]::Round((Get-Item $OutFile).Length / 1MB, 1)
Write-Host "Built $OutFile (v$version, $size MB)" -ForegroundColor Green
Write-Host "SHA256 $((Get-FileHash $OutFile -Algorithm SHA256).Hash)"

if ($Test) {
	Step "Test install"
	$target = Join-Path $Work "test-install"
	$setup = Start-Process -FilePath $OutFile -ArgumentList "/S", "/NoDesktop", "/D=$target" -Wait -PassThru
	if ($setup.ExitCode -ne 0) { throw "Silent install failed with exit code $($setup.ExitCode); see $env:TEMP\Beolkkuri-Setup.log" }
	foreach ($file in "Beolkkuri.exe", "uninstall.exe", "src\main.py", "runtime\python.exe") {
		if (-not (Test-Path (Join-Path $target $file))) { throw "Missing after install: $file" }
	}
	Run (Join-Path $target "runtime\python.exe") -c "import $imports; print('installed copy loads its libraries')"
	Push-Location (Join-Path $target "src")
	try {
		Run (Join-Path $target "runtime\python.exe") -c "import modules.misc.imageManipulation, modules.submacros.memoryMatch, modules.submacros.autoGiftedBasicBee; print('macro modules load')"
	} finally {
		Pop-Location
	}

	# The window: it must open and stay open (a crash before it shows used to close Setup silently).
	$log = Join-Path $env:TEMP "Beolkkuri-Setup.log"
	$window = Start-Process -FilePath $OutFile -PassThru
	Start-Sleep -Seconds 8
	$crashed = (Test-Path $log) -and (Select-String -Path $log -Pattern "Setup crashed" -Quiet)
	$exited = $window.HasExited
	if (-not $exited) { Stop-Process -Id $window.Id -Force }
	if ($exited -or $crashed) { throw "The installer window did not stay open; see $log" }
	Write-Host "installer window opens"
}

# One-line Beolkkuri installer for Windows. Paste this into PowerShell:
#
#   irm https://raw.githubusercontent.com/Yoon-robin/Beolkkuri/main/install.ps1 | iex
#
# It downloads and opens Beolkkuri-Setup.exe from the latest release, the same
# installer as the website's download button (a PowerShell download skips the
# SmartScreen prompt). If that fails, it falls back to the source install: the
# release files go into %USERPROFILE%\Beolkkuri (keeping your settings if it is
# already there) and the dependency installer sets up Python.
# The macOS version of this script is install.sh.

# Everything runs inside a script block so nothing leaks into the user's
# PowerShell session, and "return" ends the installer without closing the window.
& {
	$Repo = "Yoon-robin/Beolkkuri"
	$Dest = Join-Path $HOME "Beolkkuri"
	$ProgressPreference = "SilentlyContinue"  # the progress bar makes downloads very slow in PowerShell 5
	[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12

	function Fail($Message) {
		Write-Host ""
		Write-Host $Message -ForegroundColor Red
		Write-Host "도움이 필요하면 / Help: https://github.com/$Repo/issues"
	}

	if (-not [Environment]::Is64BitOperatingSystem) {
		Fail "벌꿀이는 64비트 Windows에서만 쓸 수 있어요. / Beolkkuri needs 64-bit Windows."
		return
	}

	$setup = Join-Path ([IO.Path]::GetTempPath()) "Beolkkuri-Setup.exe"
	try {
		Write-Host "🐝 벌꿀이 설치 파일 내려받는 중... / Downloading the Beolkkuri installer..." -ForegroundColor Yellow
		Invoke-WebRequest -UseBasicParsing "https://github.com/$Repo/releases/latest/download/Beolkkuri-Setup.exe" -OutFile $setup
		Write-Host "설치 창이 열려요. / The installer window is opening." -ForegroundColor Green
		# Not Start-Process -Wait: that also waits for Beolkkuri when the installer opens it.
		(Start-Process -FilePath $setup -PassThru).WaitForExit()
		return
	} catch {
		Write-Host "설치 파일을 받지 못해서 소스로 설치할게요. / Could not get the installer; installing from source instead." -ForegroundColor Yellow
	} finally {
		Remove-Item $setup -Force -ErrorAction SilentlyContinue
	}

	Write-Host "🐝 벌꿀이 내려받는 중... / Downloading Beolkkuri..." -ForegroundColor Yellow

	# Prefer the newest release; fall back to the main branch before the first release.
	$zipUrl = $null
	try {
		$zipUrl = (Invoke-RestMethod -UseBasicParsing "https://api.github.com/repos/$Repo/releases/latest").zipball_url
	} catch {}
	if (-not $zipUrl) { $zipUrl = "https://github.com/$Repo/archive/refs/heads/main.zip" }

	$work = Join-Path ([IO.Path]::GetTempPath()) ("beolkkuri-" + [Guid]::NewGuid().ToString("N"))
	New-Item -ItemType Directory -Path $work | Out-Null
	try {
		$zip = Join-Path $work "beolkkuri.zip"
		try {
			Invoke-WebRequest -UseBasicParsing $zipUrl -OutFile $zip
		} catch {
			Fail "내려받지 못했어요. 인터넷 연결을 확인해 주세요. / Download failed. Check your internet connection."
			return
		}
		try {
			Expand-Archive -Path $zip -DestinationPath (Join-Path $work "src") -Force
		} catch {
			Fail "압축을 풀지 못했어요. / Could not unpack the download."
			return
		}
		$srcDir = Get-ChildItem -Directory (Join-Path $work "src") | Select-Object -First 1
		if (-not $srcDir -or -not (Test-Path (Join-Path $srcDir.FullName "scripts\windows\install_dependencies.ps1"))) {
			Fail "내려받은 파일이 올바르지 않아요. / The download looks incomplete."
			return
		}

		if (Test-Path $Dest) {
			Write-Host "기존 벌꿀이를 새 버전으로 바꿔요. 내 설정은 그대로 남아요." -ForegroundColor Yellow
			Write-Host "Updating the existing Beolkkuri; your settings are kept." -ForegroundColor Yellow
		}
		# Copy over the old copy: new files replace old ones, and user files that are
		# not part of the download (profiles, logs, user data) are left alone.
		robocopy $srcDir.FullName $Dest /E /NFL /NDL /NJH /NJS /NP | Out-Null
		if ($LASTEXITCODE -ge 8) {
			Fail "파일을 옮기지 못했어요. / Could not copy the files to $Dest."
			return
		}
	} finally {
		Remove-Item -Recurse -Force $work -ErrorAction SilentlyContinue
	}

	Write-Host "$Dest 에 내려받았어요. / Downloaded to $Dest" -ForegroundColor Green
	Write-Host ""

	# A separate process, so its execution policy override does not touch this session.
	powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Dest "scripts\windows\install_dependencies.ps1")
}

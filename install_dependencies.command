#!/bin/bash
#
# Beolkkuri (벌꿀이) installer. install.sh runs it after downloading, or open this file
# from Finder (right-click > Open). It installs Python, the libraries the macro
# needs, and a 벌꿀이 app you can open later.

VENV_NAME="beolkkuri-env"
VENV_PATH="$HOME/$VENV_NAME"
# Compatibility: installs from before the rename keep their old virtualenv, so libraries aren't reinstalled.
if [ ! -d "$VENV_PATH" ] && [ -d "$HOME/robin-macro-env" ]; then
	VENV_PATH="$HOME/robin-macro-env"
fi
MACRO_DIR="$(cd "$(dirname "$0")" && pwd)"
# pip prints thousands of lines; keep them in a log and show one line per library.
LOG="$HOME/Beolkkuri-install.log"
: > "$LOG"
failures=0

# Print a numbered step in Korean with the English underneath.
say_step() {
	printf "\n\033[1;36m[%s] %s\033[0m\n\033[0;37m      %s\033[0m\n" "$1" "$2" "$3"
}

printf "\033[1;33m==============================================\n"
printf "   벌꿀이 설치 / Beolkkuri installer\n"
printf "==============================================\033[0m\n"
printf "창을 닫지 말고 끝날 때까지 기다려 주세요. 끝나면 벌꿀이가 저절로 열려요.\n"
printf "Keep this window open until it finishes. Beolkkuri opens by itself afterwards.\n"

# Files downloaded from the internet are quarantined by macOS, which makes it
# refuse to open run_macro.command later. Clear that flag on our own folder.
xattr -dr com.apple.quarantine "$MACRO_DIR" 2>/dev/null
chmod +x "$MACRO_DIR/run_macro.command" "$MACRO_DIR/install_dependencies.command" 2>/dev/null

create_virtual_env() {
    if [ ! -d "$VENV_PATH" ]; then
        echo "Creating virtual environment at $VENV_PATH" >>"$LOG"
        python"${python_ver}" -m venv "$VENV_PATH" >>"$LOG" 2>&1
    fi
}

activate_virtual_env() {
    source "$VENV_PATH/bin/activate"
}

# One line that shows the library being installed, rewritten in place; only a failure
# leaves a line behind (with the end of the log).
install_pip_package() {
	local packages="$1"
	local extra_args="$2"
	local tmp_constraint=""
	local status=0
	printf "\r\033[K   \033[0;37m• %s ...\033[0m" "$packages"

	if [ -n "$constraints" ]; then
		tmp_constraint=$(mktemp)
		printf "%s\n" "$constraints" > "$tmp_constraint"
		constraint_arg="--constraint $tmp_constraint"
	else
		constraint_arg=""
	fi

	if [ "$chip" = "arm64" ]; then
		arch -arm64 pip install --prefer-binary --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org --default-timeout=100 $extra_args $packages $constraint_arg >>"$LOG" 2>&1 || status=$?
	else
		#fallback for other architectures
		pip install --prefer-binary --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org --default-timeout=100 $extra_args $packages $constraint_arg >>"$LOG" 2>&1 || status=$?
	fi

	if [ "$status" -ne 0 ]; then
		printf "\r\033[K   \033[31m✗ %s\033[0m\n" "$packages"
		tail -n 8 "$LOG" | sed 's/^/      /'
		failures=$((failures + 1))
	fi

	if [ -n "$tmp_constraint" ] && [ -f "$tmp_constraint" ]; then
		rm -f "$tmp_constraint"
	fi
}

upgrade_pip_tools() {
    if [ "$chip" = "arm64" ]; then
        arch -arm64 python"${python_ver}" -m pip install --upgrade pip setuptools wheel >>"$LOG" 2>&1
    else
        python"${python_ver}" -m pip install --upgrade pip setuptools wheel >>"$LOG" 2>&1
    fi
}

#get system information
chip=$(arch)
os_ver=$(sw_vers -productVersion)

# BSD sort on macOS supports version sorting.  The old checks compared the
# result to an exact version (for example, 10.15.0), which misclassified every
# later patch release such as Catalina 10.15.7 and Monterey 12.3.3.
version_at_least() {
	[ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

say_step "1/4" "맥 버전 확인" "Checking your Mac"

if [ "$chip" = 'arm64' ]; then
	if ! version_at_least "$os_ver" "13.0.0"; then
		printf "\033[31;1m이 맥에서는 쓸 수 없어요. macOS Ventura(13) 이상으로 업데이트해 주세요.\nYour mac is not compatible. It has to be Ventura or later. Consider updating it. \033[0m\n"
		exit 1
	fi
else
	if ! version_at_least "$os_ver" "10.12.0"; then
		printf "\033[31;1m이 맥에서는 쓸 수 없어요. macOS 10.12 이상으로 업데이트해 주세요.\nYour mac is not compatible. It has to be 10.12 or later. Consider updating it. \033[0m\n"
		exit 1
	fi
fi

printf "\033[32;1m쓸 수 있는 맥이에요 / Your mac is compatible\033[0m\n"

say_step "2/4" "파이썬 확인" "Checking Python"

python_ver="3.9"
python_link="/www.python.org/ftp/python/3.9.8/python-3.9.8-macos11.pkg"
constraints=$'numpy<2'
if [ "$chip" = 'i386' ]; then
	if version_at_least "$os_ver" "12.0.0"; then
		python_ver="3.8"
		python_link="/www.python.org/ftp/python/3.8.0/python-3.8.0-macosx10.9.pkg"
		constraints=$'numpy<2\npyobjc-core<11.0\npyobjc<11.0'
	elif version_at_least "$os_ver" "10.15.0"; then
		python_ver="3.8"
		python_link="/www.python.org/ftp/python/3.8.0/python-3.8.0-macosx10.9.pkg"
		constraints=$'numpy<2\npyobjc-core<11.0\npyobjc<11.0'
	else 
		python_ver="3.7"
		python_link="/www.python.org/ftp/python/3.7.9/python-3.7.9-macosx10.9.pkg"
		constraints=$'numpy<2\npyobjc-core<10.0\npyobjc<10.0'
	fi
fi

filename=$(echo "${python_link}" | sed -e 's/\/.*\///g')

if python"${python_ver}" --version >>"$LOG" 2>&1; then
	printf "\033[1;32m파이썬 %s 이 있어요 / Python %s is installed\033[0m\n" "$python_ver" "$python_ver"
		if [ "$chip" = "arm64" ]; then
			# Resolve the real python executable (pyenv shims may point to a shim script)
			python_exec=$(python"${python_ver}" -c 'import sys; print(sys.executable)' 2>/dev/null || true)
			if [ -n "$python_exec" ] && [ -x "$python_exec" ]; then
				arch_output=$(file "$python_exec" 2>/dev/null || true)
				py_platform=$(python"${python_ver}" -c 'import platform; print(platform.machine())' 2>/dev/null || true)
			else
				python_exec=$(which python${python_ver} 2>/dev/null || true)
				arch_output=$(file "$python_exec" 2>/dev/null || true)
				py_platform=
			fi

			if echo "$py_platform" | grep -qi "arm64" || echo "$arch_output" | grep -q "arm64"; then
				echo "Python $python_ver has an arm64 binary" >>"$LOG"
			else
				echo -e "\033[1;31mThere are no arm64 binaries for Python $python_ver!\033[0m"
				echo -e "\033[1;33mFix: reinstall Python 3.9 with arm64 binaries (brew, miniforge) or use a universal/arm64 build.\033[0m"
			fi
		fi
else
	printf "\033[1;35m파이썬 ${python_ver} 설치 창이 뜨면 '계속'과 '설치'를 눌러 주세요.\nPython is not installed, installing python ${python_ver}\nThere should be a popup for the python installer.\n\033[0m"
	pkg_dir=$(mktemp -d)
	curl -fL --progress-bar "https:/${python_link}" -o "$pkg_dir/${filename}" && open "$pkg_dir/${filename}"
	# Wait until python installation has finished.
	until python"${python_ver}" --version &> /dev/null; do
	  sleep 5;
	done
	#printf "\033[1;35mPress enter to continue when python is installed\033[0m"
	#read
fi

# Apple Silicon gets ready-made packages for everything below, so only Intel Macs,
# which build some of them from source, need the Command Line Tools (a long download).
if [ "$chip" != "arm64" ]; then
	if xcode-select --print-path &> /dev/null; then
		echo "Command Line Tools are already installed." >>"$LOG"
	else
		printf "\033[1;35m개발 도구 설치 창이 뜨면 '설치'를 눌러 주세요.\nInstall Command Line Tools. There should be a pop-up; click the install button.\033[0m\n"
		xcode-select --install
		# Wait until XCode Command Line Tools installation has finished.
		until xcode-select --print-path &> /dev/null; do
		  sleep 5
		done
	fi
fi

python"${python_ver}" -m ensurepip >>"$LOG" 2>&1
python"${python_ver}" -m pip cache purge >>"$LOG" 2>&1
upgrade_pip_tools

#find and run the Install Certificates command for the specific Python version
cert_command="/Applications/Python ${python_ver}/Install Certificates.command"
if [ -f "$cert_command" ]; then
	"$cert_command" >>"$LOG" 2>&1
else
	echo "Did not find certificate installer for Python ${python_ver}" >>"$LOG"
fi

say_step "3/4" "매크로 전용 환경과 라이브러리 설치 (가장 오래 걸려요)" "Installing libraries (this takes the longest)"
attempt=1
while [ "$attempt" -le 3 ]; do
	create_virtual_env
	activate_virtual_env
	
	# Validate Python and pip paths inside the venv
	if [ -x "$VENV_PATH/bin/python" ] && [ -x "$VENV_PATH/bin/pip" ]; then
		break
	else
		echo "Virtual environment is broken, recreating..." >>"$LOG"
		rm -rf "$VENV_PATH"
		((attempt++))
		sleep 2
		
	fi
done

pip install --upgrade pip setuptools wheel >>"$LOG" 2>&1
install_pip_package "numpy<2"

if [ "$python_ver" = '3.9' ] || { [ "$python_ver" = '3.8' ] && version_at_least "$os_ver" "12.0.0"; }; then
	# Use pip --force-reinstall to ensure a compatible opencv and numpy
	# This installs the latest opencv-headless below 4.11 and enforces numpy<2
	install_pip_package "opencv-python-headless<4.11 numpy<2" "--force-reinstall"
	# Only for running the AI models (MLModel); converting models would need torch, which the macro never does.
	install_pip_package "coremltools"
	install_pip_package "ocrmac"
	install_pip_package "pyobjc-framework-ColorSync<12.0"
	install_pip_package "pyobjc-framework-ApplicationServices"

elif version_at_least "$os_ver" "10.15.0"; then
	printf "\033[1;35mInstalling rust\n\n\033[0m"
	curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y >>"$LOG" 2>&1
	source "$HOME/.cargo/env"

	# OpenCV 4.4 and 4.6 cannot load the current AI Gather ONNX models.
	# OpenCV 4.10 has a compatible macOS 10.15 Intel wheel. Keep exactly one
	# OpenCV package installed because all variants share the cv2 namespace.
	pip uninstall -y opencv-python opencv-contrib-python opencv-python-headless opencv-contrib-python-headless >>"$LOG" 2>&1
	install_pip_package "opencv-python==4.10.0.84 numpy==1.19.1 Polygon3" "--force-reinstall"
	install_pip_package "easyocr" "--no-deps"
	install_pip_package "torch"
	install_pip_package "torchvision>=0.5"
	install_pip_package "scipy shapely ninja pyclipper python-bidi scikit-image PyYAML"
	install_pip_package "pyobjc-framework-ColorSync<12.0"
	install_pip_package "pyobjc-framework-ApplicationServices"
	
else
	install_pip_package "pyobjc-core<11.0"
	install_pip_package "pyobjc-framework-Cocoa<11.0"
	install_pip_package "pyobjc-framework-ColorSync<11.0" "--no-deps"
	install_pip_package "pyobjc-framework-ApplicationServices<11.0" "--no-deps"
	# OpenCV builds from source here. BUILD_JAVA=OFF skips its Java detection, which runs
	# `java` and makes macOS show a "you need to install a JDK" dialog when no JDK is installed.
	export CMAKE_ARGS="-DBUILD_JAVA=OFF"
	install_pip_package "opencv-python==4.6.0.66"
	unset CMAKE_ARGS
	#python"${python_ver}" -m pip install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org paddlepaddle==2.4.2 -i https://pypi.tuna.tsinghua.edu.cn/simple
	#python"${python_ver}" -m pip install --no-deps --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org paddleocr==2.6.1.3
	#printf "\033[31;1mInstalling lxml, this can take a while \033[0m\n"
	#python"${python_ver}" -m pip install --default-timeout=100 --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org attrdict beautifulsoup4 cython fire fonttools imgaug lanms-neo==1.0.2 lmdb lxml opencv-contrib-python==4.6.0.66 opencv-python==4.6.0.66 openpyxl Polygon3 premailer pyclipper pymupdf python-docx rapidfuzz scikit-image shapely tqdm visualdl
	#pip"${python_ver}" install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org protobuf==3.20.0
	#pip"${python_ver}" install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org orjson==3.9.6
	install_pip_package "ocrmac"
fi
install_pip_package "pyautogui"
install_pip_package "mss"
install_pip_package "pillow"
install_pip_package "discord-webhook"
if [ "$python_ver" = '3.7' ]; then
	# discord.py 2.x needs Python 3.8. 1.7.3 has no slash commands, so the bot runs them as
	# bee! prefix commands (modules/discord_bot/legacyCommands.py). It needs aiohttp below 3.8;
	# 3.7.4.post0 is the newest, and pip builds it from source below macOS 10.14.
	install_pip_package "discord.py==1.7.3 aiohttp==3.7.4.post0"
else
	install_pip_package "discord.py"
	install_pip_package "aiohttp==3.10.5"
fi
install_pip_package "pypresence"
install_pip_package "fuzzywuzzy"
install_pip_package "python-Levenshtein"
install_pip_package "pyscreeze<0.1.29"
install_pip_package "gevent"
install_pip_package "eel"
install_pip_package "flask"
install_pip_package "pygetwindow"
install_pip_package "requests" #used to check if this script was ran, should be installed by discord-webhooks
install_pip_package "pynput"
install_pip_package "numpy<2" "--force-reinstall"
if [ "$failures" -eq 0 ]; then
	printf "\r\033[K\033[1;32m라이브러리를 모두 설치했어요 / All libraries installed\033[0m\n"
else
	printf "\r\033[K"
fi

"$VENV_PATH/bin/python" >>"$LOG" 2>&1 << "EOF"

# install_certifi.py
#
# sample script to install or update a set of default Root Certificates
# for the ssl module.  Uses the certificates provided by the certifi package:
#       https://pypi.org/project/certifi/

import os
import os.path
import ssl
import stat
import subprocess
import sys

STAT_0o775 = ( stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR
             | stat.S_IRGRP | stat.S_IWGRP | stat.S_IXGRP
             | stat.S_IROTH |                stat.S_IXOTH )

def main():
    openssl_dir, openssl_cafile = os.path.split(
        ssl.get_default_verify_paths().openssl_cafile)

    print(" -- pip install --upgrade certifi")
    subprocess.check_call([sys.executable,
        "-E", "-s", "-m", "pip", "install", "--upgrade", "certifi"])

    import certifi

    # change working directory to the default SSL directory
    os.chdir(openssl_dir)
    relpath_to_certifi_cafile = os.path.relpath(certifi.where())
    print(" -- removing any existing file or link")
    try:
        os.remove(openssl_cafile)
    except FileNotFoundError:
        pass
    print(" -- creating symlink to certifi certificate bundle")
    os.symlink(relpath_to_certifi_cafile, openssl_cafile)
    print(" -- setting permissions")
    os.chmod(openssl_cafile, STAT_0o775)
    print(" -- update complete")

if __name__ == '__main__':
    main()
EOF
say_step "4/4" "벌꿀이 앱 만들기" "Creating the Beolkkuri app"

# A small AppleScript app that opens run_macro.command in Terminal, so the macro
# can be started from the Desktop / Launchpad like any other app.
create_launcher() {
	local apps_dir="$HOME/Applications"
	local name="벌꿀이"
	local app="$apps_dir/$name.app"
	local script="do shell script \"open -a Terminal \" & quoted form of \"$MACRO_DIR/run_macro.command\""
	mkdir -p "$apps_dir"
	rm -rf "$app"
	osacompile -o "$app" -e "$script" 2>/dev/null || return 1
	# Compatibility: remove the launcher and Desktop alias made before the rename (rm -f never deletes a folder).
	rm -rf "$apps_dir/RobinMacro.app"
	rm -f "$HOME/Desktop/RobinMacro" "$HOME/Desktop/RobinMacro.app" 2>/dev/null

	local logo="$MACRO_DIR/.github/logo.png"
	if [ -f "$logo" ] && command -v iconutil >/dev/null 2>&1; then
		local work
		work=$(mktemp -d)
		local iconset="$work/beolkkuri.iconset"
		mkdir -p "$iconset"
		for size in 16 32 128 256 512; do
			sips -z "$size" "$size" "$logo" --out "$iconset/icon_${size}x${size}.png" >/dev/null 2>&1
			sips -z $((size * 2)) $((size * 2)) "$logo" --out "$iconset/icon_${size}x${size}@2x.png" >/dev/null 2>&1
		done
		iconutil -c icns "$iconset" -o "$app/Contents/Resources/applet.icns" 2>/dev/null
		rm -rf "$work"
		touch "$app"
	fi

	# Desktop shortcut
	rm -f "$HOME/Desktop/$name"
	osascript -e "tell application \"Finder\" to make alias file to (POSIX file \"$app\") at (path to desktop folder)" >/dev/null 2>&1 \
		|| ln -sf "$app" "$HOME/Desktop/$name"
}

launcher_ok=1
if create_launcher; then
	printf "\033[1;32m바탕화면과 '응용 프로그램' 폴더에 벌꿀이 앱을 만들었어요.\nCreated the 벌꿀이 (Beolkkuri) app on your Desktop and in ~/Applications.\033[0m\n"
else
	launcher_ok=0
	printf "\033[1;33m앱 바로가기는 만들지 못했어요. 대신 run_macro.command 를 더블클릭해서 실행하세요.\nCould not create the app shortcut; double-click run_macro.command instead.\033[0m\n"
fi

if [ "$failures" -gt 0 ]; then
	printf "\n\033[1;33m라이브러리 %s개를 설치하지 못했어요. 설치를 한 번 더 실행하면 대부분 해결돼요.\n" "$failures"
	printf "그래도 안 되면 이 파일을 GitHub Issues에 올려 주세요: %s\n" "$LOG"
	printf "%s libraries failed. Running the installer again usually fixes it; otherwise attach %s to a GitHub issue.\033[0m\n" "$failures" "$LOG"
	exit 1
fi

# No question at the end: Beolkkuri opens, and step 1 of its guide walks through the
# two permissions with live checks and buttons that open the right settings pages.
printf "\n\033[32;1m설치가 끝났어요! 벌꿀이를 열게요. / Installation complete! Opening Beolkkuri...\033[0m\n\n"
printf "처음 한 번은 '터미널'에 권한 두 가지(손쉬운 사용, 화면 기록)를 줘야 해요.\n"
printf "벌꿀이 '시작 가이드' 1단계의 [켜기]를 누르면 맞는 설정 화면이 열려요.\n"
printf "켠 다음에는 터미널을 완전히 종료(⌘Q)하고 바탕화면의 벌꿀이를 다시 열면 돼요.\n\n"
printf "First time only: Terminal needs two permissions (Accessibility and Screen Recording).\n"
printf "The Turn on buttons in step 1 of Getting Started open the right settings.\n"
printf "Then quit Terminal (⌘Q) and open Beolkkuri again from your Desktop.\n\n"
# The in-app updater runs this script in the background (no terminal) and restarts
# Beolkkuri itself, so only open it when the installer has a window.
if [ -t 1 ]; then
	if [ "$launcher_ok" -eq 1 ]; then
		open "$HOME/Applications/벌꿀이.app"
	else
		open -a Terminal "$MACRO_DIR/run_macro.command"
	fi
fi

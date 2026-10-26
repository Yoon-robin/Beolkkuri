#!/bin/sh

VENV_NAME="robin-macro-env"
VENV_PATH="$HOME/$VENV_NAME"

# Stop only an existing RobinMacro launched from this virtual environment.
# The old implementation killed every Python process on the machine.
stop_robin_macro() {
    robin_pids=$(pgrep -f "$VENV_PATH/bin/python.*main\.py" 2>/dev/null || true)
    if [ -z "$robin_pids" ]; then
        return
    fi

    printf "Stopping existing RobinMacro process(es): %s\n" "$robin_pids"
    kill $robin_pids 2>/dev/null || true
    sleep 1

    # Fall back to SIGKILL only if a stale process did not exit cleanly.
    for pid in $robin_pids; do
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
}

stop_robin_macro

# force Python to use certifi for SSL (fixes Discord/aiohttp on macOS)
for py_dir in python3.9 python3.8 python3.7 python3 python; do
    cert_path="$VENV_PATH/lib/$py_dir/site-packages/certifi/cacert.pem"
    if [ -f "$cert_path" ]; then
        export SSL_CERT_FILE="$cert_path"
        break
    fi
done

# get system information
chip=$(arch)
os_ver=$(sw_vers -productVersion)

version_at_least() {
    [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

python_ver="3.9"
if [ "$chip" = "i386" ]; then
	if version_at_least "$os_ver" "10.15.0"; then
		python_ver="3.8"
		printf "Correct python ver: 3.8\n"
	else
		python_ver="3.7"
		printf "Correct python ver: 3.7\n"
	fi
fi

cd "$(dirname "$0")"

runPython() {
    echo "Loading macro with $1..."
    $1 main.py
}

if [ ! -d "$VENV_PATH" ]; then
    # First launch: nothing installed yet, so run the installer instead of failing.
    printf "\033[1;33m아직 설치가 안 됐어요. 설치를 먼저 시작할게요.\nRobinMacro is not installed yet. Starting the installer...\033[0m\n"
    /bin/bash ./install_dependencies.command
fi

cd src
if [ -d "$VENV_PATH" ]; then
    source "$VENV_PATH/bin/activate"
    printf "RobinMacro 실행 중... 이 창은 매크로가 켜져 있는 동안 열어 두세요.\nStarting RobinMacro. Keep this window open while the macro runs.\n"
    "$VENV_PATH/bin/python" --version
    "$VENV_PATH/bin/python" main.py
else
    runPython python3.7
    runPython python3.8
    runPython python3.9
fi

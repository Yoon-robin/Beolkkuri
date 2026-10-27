#!/bin/bash
#
# One-line Beolkkuri (벌꿀이) installer. Paste this into Terminal:
#
#   curl -fsSL https://raw.githubusercontent.com/Yoon-robin/Beolkkuri/main/install.sh | bash
#
# It downloads the latest release into ~/Beolkkuri (keeping your settings if
# it is already there) and then runs install_dependencies.command. Files that
# curl downloads are not quarantined, so macOS will not block the scripts.

set -e

REPO="Yoon-robin/Beolkkuri"
DEST="$HOME/Beolkkuri"
OLD_DEST="$HOME/RobinMacro"  # install folder from before the rename, moved below (compatibility)

bold() { printf "\033[1;33m%s\033[0m\n" "$1"; }
fail() {
	printf "\n\033[1;31m%s\033[0m\n" "$1"
	printf "도움이 필요하면 / Help: https://github.com/%s/issues\n" "$REPO"
	exit 1
}

if [ "$(uname)" != "Darwin" ]; then
	fail "벌꿀이는 맥에서만 쓸 수 있어요. / Beolkkuri only runs on macOS."
fi

bold "🐝 벌꿀이 내려받는 중... / Downloading Beolkkuri..."

# Prefer the newest release; fall back to the main branch before the first release.
zip_url=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null \
	| grep '"zipball_url"' | head -n1 | sed -E 's/.*"zipball_url": *"([^"]+)".*/\1/')
[ -z "$zip_url" ] && zip_url="https://github.com/$REPO/archive/refs/heads/main.zip"

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
curl -fL --progress-bar "$zip_url" -o "$work/beolkkuri.zip" || fail "내려받지 못했어요. 인터넷 연결을 확인해 주세요. / Download failed. Check your internet connection."
unzip -q "$work/beolkkuri.zip" -d "$work/src" || fail "압축을 풀지 못했어요. / Could not unpack the download."
src_dir=$(find "$work/src" -mindepth 1 -maxdepth 1 -type d | head -n1)
[ -f "$src_dir/install_dependencies.command" ] || fail "내려받은 파일이 올바르지 않아요. / The download looks incomplete."

# Compatibility: move an install from before the rename so its settings carry over.
if [ -d "$OLD_DEST" ] && [ ! -e "$DEST" ]; then
	bold "예전 폴더 ~/RobinMacro 를 ~/Beolkkuri 로 옮겨요. / Moving the old ~/RobinMacro folder to ~/Beolkkuri."
	mv "$OLD_DEST" "$DEST" || fail "예전 폴더를 옮기지 못했어요. / Could not move the old folder."
fi

if [ -d "$DEST" ]; then
	bold "기존 벌꿀이를 새 버전으로 바꿔요. 내 설정은 그대로 남아요."
	bold "Updating your existing Beolkkuri; your settings are kept."
fi
mkdir -p "$DEST"
# rsync over the old copy: new files replace old ones, and user files that are
# not part of the download (profiles, logs, user data) are left alone.
rsync -a "$src_dir/" "$DEST/"
chmod +x "$DEST/install_dependencies.command" "$DEST/run_macro.command"
xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true

printf "\033[1;32m%s 에 내려받았어요. / Downloaded to %s\033[0m\n\n" "$DEST" "$DEST"

# The installer asks nothing in Terminal (Python and Apple's tools open their own
# windows), but when this script is piped from curl, stdin is the pipe, so give
# it the terminal in case a tool does want an answer.
exec /bin/bash "$DEST/install_dependencies.command" </dev/tty

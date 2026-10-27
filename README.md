<div align="center">

<img width="160" height="160" alt="Beolkkuri logo" src=".github/logo.png">

# 벌꿀이 (Beolkkuri)

**맥(macOS)·윈도우(Windows)용 비 스웜 시뮬레이터(Bee Swarm Simulator) 자동 매크로**<br>
코딩을 몰라도 더블클릭 몇 번이면 설치하고, 한국어 화면에서 바로 설정할 수 있어요.

![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows-lightgrey)
![Stars](https://img.shields.io/github/stars/Yoon-robin/Beolkkuri?style=flat&color=f5b301&logo=github)
![Version](https://img.shields.io/github/v/release/Yoon-robin/Beolkkuri?include_prereleases)

**[🌐 홈페이지](https://yoon-robin.github.io/Beolkkuri/)** · [설치하기](#-설치하기) · [윈도우](#-윈도우에-설치하기) · [처음 실행하기](#-처음-실행하기) · [자주 묻는 질문](#-자주-묻는-질문) · [English](#english)

</div>

---

## ✨ 무엇을 해 주나요?

| | |
|---|---|
| 🌻 **자동 채집** | 원하는 필드(최대 5곳)에서 패턴대로 꽃가루를 모으고, 가방이 차면 벌집으로 돌아가 꿀로 바꿔요. AI 토큰 채집도 지원해요. |
| 🕒 **수집** | 부의 시계, 각종 디스펜서, 스티커 프린터, 몬도 버프, 메모리 매치, 비즈마스 아이템, 블렌더, 새싹까지 시간 맞춰 챙겨요. |
| 🐞 **사냥** | 무당벌레·장수풍뎅이·전갈·사마귀·거미·늑대인간, 그루터기 달팽이·코코넛 게·킹 비틀·터널 곰, 밤에는 비셔스 비(스팅어 헌트)까지. |
| 📜 **퀘스트** | 북극곰, 갈색곰, 흑곰, 허니 비, 버코 비, 라일리 비 퀘스트를 알아서 받아서 깨요. |
| 🌱 **플랜터** | 수동(최대 5사이클) 또는 넥타 우선순위에 맞춘 자동 플랜터. 수확 타이머도 홈 화면에서 볼 수 있어요. |
| ⚡ **부스트** | 핫바 아이템 자동 사용, 필드 부스터, 필드 주사위·글리터 자동 부스트, 스티커 스택. |
| 🔁 **안정성** | 비공개 서버 재접속, 사망 감지와 복구, 일시정지/다시 시작, 프로필 여러 개 저장. |
| 💬 **디스코드** | 웹후크 알림, 시간별 리포트 이미지, 원격 조작 봇, 화면 스트리밍. |

> 새 화면은 **React + shadcn/ui**로 만들었고, **한국어/영어**를 왼쪽 아래 버튼으로 바꿀 수 있어요. 라이트/다크 테마도 있어요.
> **Ctrl+K(⌘K)** 를 누르면 설정 246개를 한국어로 검색해서 그 화면으로 바로 갈 수 있어요. 실행 시간은 위쪽 상태 표시에 나오고, 맥 권한이 꺼져 있으면 홈 화면에서 알려 줘요.

---

## 📦 설치하기

> 윈도우 PC라면 [윈도우에 설치하기](#-윈도우에-설치하기)로 건너뛰세요.

> **필요한 것:** 인터넷이 되는 맥 (애플 실리콘 M1 이상은 macOS 13 Ventura 이상, 인텔 맥은 macOS 10.12 이상), 로블록스, 약 3GB의 저장 공간

### 1. 한 줄로 설치하기 (추천)
1. **⌘ + 스페이스**를 눌러 Spotlight를 열고 `터미널`을 입력한 뒤 엔터를 눌러요.
2. 아래 한 줄을 **복사해서 터미널에 붙여넣고(⌘V) 엔터**를 눌러요.

```bash
curl -fsSL https://raw.githubusercontent.com/Yoon-robin/Beolkkuri/main/install.sh | bash
```

3. 이제 기다리기만 하면 돼요. **10~20분** 정도 걸리고, 진행 상황이 한국어로 나와요.
   - 파이썬이나 개발 도구 설치 창이 뜨면 **계속 / 설치** 를 눌러 주세요.
   - 맥 로그인 암호를 물으면 입력해요. (입력해도 화면에 안 보이는 게 정상이에요)
4. 끝나면 **바탕화면에 벌꿀이 앱**이 생겨요. 설치 위치는 `내 홈 폴더/Beolkkuri` 예요.

> 업데이트하거나 다시 설치할 때도 같은 줄을 붙여넣으면 돼요. 내 설정은 그대로 남아요.

<details>
<summary><b>터미널이 어렵다면: ZIP으로 설치하기</b></summary>

1. 이 페이지 위쪽의 초록색 **`<> Code`** 버튼 → **Download ZIP** 을 눌러요.
2. 다운로드 폴더의 **Beolkkuri-main.zip** 을 더블클릭해서 풀고, 폴더를 원하는 곳(예: `문서`)으로 옮겨요.
3. 폴더 안의 **`install_dependencies.command`** 를 **마우스 오른쪽 버튼(또는 control+클릭) → 열기** 로 실행해요.
   - "확인되지 않은 개발자" 경고가 뜨면 **열기** 를 한 번 더 눌러요.
   - 그래도 막히면 **시스템 설정 → 개인정보 보호 및 보안** 맨 아래의 **"그래도 열기"** 를 눌러요.
4. 설치한 뒤에는 폴더를 옮기지 마세요. 옮겼다면 3번을 다시 하면 돼요.
</details>

### 2. 권한 주기 (꼭 필요해요)
매크로가 키보드·마우스를 움직이고 화면을 보려면 **터미널**에 권한이 있어야 해요. 설치가 끝날 때 엔터를 누르면 설정 화면이 열려요.

1. **시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용** 에서 **터미널** 을 켜요.
2. **시스템 설정 → 개인정보 보호 및 보안 → 화면 기록** 에서도 **터미널** 을 켜요.
3. 터미널을 완전히 껐다가(⌘Q) 바탕화면의 벌꿀이를 열어요.

앱의 **시작 가이드** 에서 권한이 제대로 켜졌는지 초록 체크로 바로 확인할 수 있어요. 자세한 설명: [docs/permissions.md](docs/permissions.md)

### 🪟 윈도우에 설치하기

> **필요한 것:** 64비트 윈도우 10(1809 이상) 또는 윈도우 11, 로블록스, 약 500MB의 저장 공간
> 윈도우 버전은 새로 추가돼서 실제 게임에서 아직 충분히 확인되지 않았어요. 이상한 점은 [Issues](https://github.com/Yoon-robin/Beolkkuri/issues)로 알려 주세요.

1. **[Beolkkuri-Setup.exe 내려받기](https://github.com/Yoon-robin/Beolkkuri/releases/latest/download/Beolkkuri-Setup.exe)** 를 눌러 받은 파일을 열어요.
2. **"Windows의 PC 보호"** 창이 뜨면 **추가 정보 → 실행** 을 눌러요. (코드 서명을 하지 않은 무료 프로그램이라 뜨는 창이에요)
3. **설치하기** 를 누르면 끝이에요. 파이썬까지 다 들어 있고, 관리자 권한도 필요 없어요.
4. **시작 메뉴**(체크하면 바탕화면에도)에 **벌꿀이** 가 생겨요. 설치 위치는 `%LOCALAPPDATA%\Programs\Beolkkuri` 예요.

PowerShell을 쓴다면 `irm https://raw.githubusercontent.com/Yoon-robin/Beolkkuri/main/install.ps1 | iex` 로도 같은 설치 파일을 열 수 있어요.
윈도우는 **권한을 따로 줄 필요가 없어요.** 디스플레이 배율은 **100%** 를 추천하고, 시작 가이드에서 **영어 글자 인식**을 추가하면 게임 글자를 더 정확하게 읽어요. 자세한 설명: [docs/windows.md](docs/windows.md)

---

## ▶️ 처음 실행하기

1. 로블록스에서 **비 스웜 시뮬레이터**에 들어가요.
2. 바탕화면의 **벌꿀이**를 더블클릭해요. (윈도우는 시작 메뉴에도 있어요. 맥은 폴더 안의 `run_macro.command` 로도 열 수 있어요)
3. 매크로 화면이 열리면 왼쪽의 **시작 가이드** 를 따라 해요.
   - **설정 → 게임 설정** 에서 내 **벌집 번호**를 맞추고,
   - **채집** 에서 갈 필드를 켜고,
   - **홈** 에서 **시작** 을 누르면 끝!
4. 단축키: **F1** 시작 · **F2** 일시정지 · **F3** 정지 (설정에서 바꿀 수 있어요)

> 매크로가 도는 동안 로블록스 창을 가리거나 움직이지 마세요. 터미널 창(윈도우는 벌꿀이 명령 창)은 닫으면 안 돼요(최소화는 괜찮아요).

### 업데이트
새 버전이 나오면 벌꿀이를 켤 때 알아서 업데이트하고 다시 켜져요. 매크로가 돌아가는 중에는 하지 않고, 내 설정은 그대로 남아요. 자동 업데이트는 **설정 → 기타 설정** 에서 끌 수 있고, 왼쪽 아래 **업데이트 확인** 으로 바로 할 수도 있어요.

---

## ❓ 자주 묻는 질문

<details>
<summary><b>시작을 눌러도 캐릭터가 안 움직여요</b></summary>

거의 항상 권한 문제예요. [권한 주기](#2-권한-주기-꼭-필요해요)를 다시 확인하고, 목록에 터미널이 이미 켜져 있다면 **껐다가 다시 켜고** 터미널을 재시작해 보세요.

윈도우라면 권한은 필요 없어요. 시작하기 전에 로블록스 창을 한 번 클릭해 두고, 로블록스를 **관리자 권한으로 실행하지 않았는지** 확인해 주세요.
</details>

<details>
<summary><b>"확인되지 않은 개발자라서 열 수 없어요"라고 나와요</b></summary>

파일을 **오른쪽 클릭 → 열기** 로 실행하세요. 그래도 안 되면 **시스템 설정 → 개인정보 보호 및 보안** 맨 아래의 **그래도 열기** 를 누르면 돼요.
</details>

<details>
<summary><b>엉뚱한 곳에서 채집하거나 벌집을 못 찾아요</b></summary>

- **설정 → 게임 설정** 의 벌집 번호가 맞는지 확인해요.
- 디스플레이 배율과 로블록스 화면 설정을 확인해요: [docs/display-settings.md](docs/display-settings.md)
</details>

<details>
<summary><b>디스코드로 알림을 받고 싶어요</b></summary>

**설정 → 디스코드** 에서 웹후크 주소를 넣으면 돼요. 화면 스트리밍은 [docs/stream-setup.md](docs/stream-setup.md) 를 보세요.
</details>

<details>
<summary><b>처음부터 다시 설치하고 싶어요</b></summary>

터미널에서 `rm -rf ~/beolkkuri-env ~/robin-macro-env` 를 실행한 뒤, [한 줄 설치](#1-한-줄로-설치하기-추천) 명령을 다시 붙여넣으세요.

윈도우는 [Beolkkuri-Setup.exe](https://github.com/Yoon-robin/Beolkkuri/releases/latest/download/Beolkkuri-Setup.exe) 를 다시 실행하면 파이썬까지 새로 깔려요. 지우려면 **설정 → 앱 → 설치된 앱** 에서 벌꿀이를 제거해요.
</details>

---

## 🛠 개발자용

```
Beolkkuri/
├── src/            파이썬 매크로 (main.py, gui.py, modules/)
│   └── webapp/     빌드된 화면 (ui/ 에서 자동 생성, 직접 고치지 마세요)
├── ui/             React + TypeScript + Tailwind + shadcn/ui 화면 소스
├── scripts/windows/ 윈도우 설치 파일(installer/, build_installer.ps1)과 소스 설치·실행 스크립트
├── paths/          이동 경로 스크립트
├── settings/       기본 설정과 채집 패턴
└── docs/           도움말 문서
```

화면 개발 (Node 20+, pnpm):

```bash
cd ui
pnpm install
python dev/dev_server.py   # 설정 파일을 그대로 쓰는 개발용 백엔드 (127.0.0.1:8765)
pnpm dev                   # http://localhost:5173
pnpm build                 # src/webapp 으로 빌드 (커밋에 포함해야 사용자에게 반영돼요)
```

**다른 컴퓨터에서 이어서 작업하기:** `git clone https://github.com/Yoon-robin/Beolkkuri` 한 뒤 위 명령을 그대로 실행하면 돼요. 구조, 규칙, 남은 할 일은 [CLAUDE.md](CLAUDE.md) 에 정리돼 있어요 (Claude Code가 자동으로 읽어요). 개발 서버 실행 설정은 `.claude/launch.json` 에 있어요. 홈페이지는 `site/` 폴더이고, `main` 에 푸시하면 자동으로 배포돼요.

---

## English

**Beolkkuri** (벌꿀이) is a Bee Swarm Simulator macro for macOS and Windows with a React + shadcn/ui interface in Korean and English.

**Install:** Open Terminal and paste `curl -fsSL https://raw.githubusercontent.com/Yoon-robin/Beolkkuri/main/install.sh | bash`, then wait 10-20 minutes. (Or download the ZIP, right-click `install_dependencies.command` and choose *Open*.) When it finishes, allow **Terminal** under *System Settings → Privacy & Security → Accessibility* and *Screen Recording*.
**Install on Windows:** Download [Beolkkuri-Setup.exe](https://github.com/Yoon-robin/Beolkkuri/releases/latest/download/Beolkkuri-Setup.exe) and open it (if "Windows protected your PC" appears, click *More info → Run anyway*). It installs for your account with Python included and needs no administrator rights. In PowerShell, `irm https://raw.githubusercontent.com/Yoon-robin/Beolkkuri/main/install.ps1 | iex` opens the same installer. Windows needs no permissions; 100% display scaling is recommended. Windows support is new, so please report anything odd. See [docs/windows.md](docs/windows.md).
**Run:** Open Bee Swarm Simulator in Roblox, then open the **벌꿀이** (Beolkkuri) app or shortcut the installer made (on Windows it's in the Start menu too). Follow *Getting Started* in the sidebar. Default hotkeys: F1 start, F2 pause, F3 stop.
**Updates:** Beolkkuri updates itself and restarts when you open it, never while the macro runs. You can turn this off under *Settings → Other*.

Features: field gathering with patterns and AI token gathering, dispensers/collectibles, mob and boss runs, quests, manual and auto planters, hotbar and field boosts, rejoining, death recovery, profiles, Discord webhooks, a bot and streaming, and hourly reports.

---

## 🙏 Credits

- Movement patterns and paths by Existance, NatroTeam, tvojamamkajenic, sev, dully176, chillketchup and Electro.
- Inspired by [Natro Macro](https://github.com/NatroTeam/NatroMacro), [Stumpy Macro](https://github.com/alaninnovates/bss-macro) and [Existance Macro](https://github.com/existancepy/bss-macro-py).
- This product includes software developed by exihs (Existance Macro).
- The Windows installer uses the [Black Han Sans](https://fonts.google.com/specimen/Black+Han+Sans) font by Zess Type (SIL Open Font License 1.1).

Beolkkuri is not affiliated with Onett, Bee Swarm Simulator or Roblox. Using macros is at your own risk. See [LICENSE](LICENSE) for the licenses of included code.

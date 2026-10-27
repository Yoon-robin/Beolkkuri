# 윈도우에서 쓰기

벌꿀이는 **64비트 윈도우 10(1809 이상)과 윈도우 11**에서도 돌아가요. 맥과 달리 **권한을 따로 줄 필요가 없어요.**

> 윈도우 버전은 새로 추가돼서 실제 게임에서 아직 충분히 확인되지 않았어요. 이상한 점이 있으면 [GitHub Issues](https://github.com/Yoon-robin/Beolkkuri/issues)로 알려 주세요.

## 1. 설치하기

### 설치 파일로 설치하기 (추천)

1. **[Beolkkuri-Setup.exe 내려받기](https://github.com/Yoon-robin/Beolkkuri/releases/latest/download/Beolkkuri-Setup.exe)** 를 눌러 받은 파일을 열어요.
2. **"Windows의 PC 보호"** 창이 뜨면 **추가 정보 → 실행** 을 눌러요. 코드 서명을 하지 않은 무료 프로그램이라 뜨는 창이에요.
3. 설치할 곳을 확인하고 **설치하기** 를 눌러요. 보통 1분 안에 끝나요.
   - 기본 위치는 `%LOCALAPPDATA%\Programs\Beolkkuri` 예요. **바꾸기** 로 다른 폴더를 고를 수 있어요.
   - 파이썬과 필요한 라이브러리가 모두 들어 있어서 따로 설치할 게 없어요. 관리자 권한도 필요 없어요.
   - 시작 메뉴에 **벌꿀이** 가 생겨요. 체크해 두면 바탕화면에도 바로가기를 만들어요.
   - 전에 PowerShell 한 줄 설치로 `%USERPROFILE%\Beolkkuri` 에서 쓰던 프로필과 패턴은 알아서 가져와요.
4. 다 되면 **벌꿀이 열기** 를 눌러요.

### PowerShell 한 줄로 설치하기

**시작 버튼을 마우스 오른쪽 클릭 → 터미널** (윈도우 10은 **Windows PowerShell**)을 열고, 아래 한 줄을 붙여넣은 뒤 엔터를 눌러요. 같은 설치 파일을 받아서 열어 줘요.

```powershell
irm https://raw.githubusercontent.com/Yoon-robin/Beolkkuri/main/install.ps1 | iex
```

### 소스로 설치하기 (개발용)

코드를 직접 고치고 싶을 때만 쓰는 방법이에요. 파이썬 3.12를 따로 설치하고 `%USERPROFILE%\beolkkuri-env` 에 매크로 전용 환경을 만들어요.

1. GitHub 페이지 위쪽의 초록색 **`<> Code`** 버튼 → **Download ZIP** 을 눌러요.
2. 받은 ZIP 파일을 마우스 오른쪽 클릭 → **압축 풀기**로 풀고, 폴더를 원하는 곳(예: `문서`)으로 옮겨요. ZIP 안에서 바로 실행하면 안 돼요.
3. 폴더 안의 **`install_dependencies.bat`** 을 더블클릭해요. 설치 기록은 `%USERPROFILE%\Beolkkuri-install.log` 에 남아요.
4. 설치한 뒤에는 폴더를 옮기지 마세요. 옮겼다면 3번을 다시 하면 바로가기도 새로 만들어져요.

## 2. 실행하기

1. 로블록스 언어를 **영어(English)** 로 해 둬요 (웹사이트 → 설정 → 계정 정보 → 언어). 매크로가 게임 속 영어 글자와 버튼을 보고 움직여요.
2. 로블록스에서 **비 스웜 시뮬레이터**에 들어가요.
3. 시작 메뉴나 바탕화면의 **벌꿀이**를 열어요.
4. **벌꿀이 명령 창**(검은 창)이 먼저 뜨고, 이어서 매크로 화면이 열려요. 크롬이 있으면 크롬 앱 창으로, 없으면 엣지로 열려요.
   - 처음 켤 때는 라이브러리를 준비하고 AI 모델을 내려받느라 몇 분 걸려요. 명령 창에 진행 상황이 나와요.
   - 매크로 화면이 열리면 명령 창은 작업 표시줄로 내려가요. 매크로가 켜져 있는 동안 **닫으면 안 돼요**.
   - 벌꿀이를 다시 열면 이전에 켜 둔 벌꿀이는 알아서 꺼져요.
5. 처음 켜면 **시작 가이드** 가 열려요. 차례대로 따라 하면 돼요.

매크로가 도는 동안에는 로블록스 창 구석에 지금 하는 일, 실행 시간, 최근 기록이 작은 카드로 떠요. 클릭은 그대로 게임에 가고, 매크로가 찍는 화면에는 안 보여요. **설정 → 기타 설정 → 게임 오버레이** 에서 끄거나 위치를 바꿀 수 있어요.

## 3. 업데이트

따로 할 일이 없어요. 새 버전이 나오면 벌꿀이를 켤 때 알아서 업데이트하고 다시 켜져요.

- 매크로가 돌아가는 중에는 업데이트하지 않아요.
- 내 설정과 프로필은 그대로 남아요.
- 자동 업데이트는 **설정 → 기타 설정 → 자동 업데이트** 에서 끌 수 있어요. 끄면 새 버전이 나왔을 때 업데이트할지 먼저 물어봐요.
- 왼쪽 아래의 **업데이트 확인** 을 누르면 바로 확인해요.
- 설치 파일을 새로 받아 다시 실행해도 돼요. 이미 설치돼 있으면 **업데이트하기** 버튼이 나오고, 설정은 그대로 남아요.

## 4. 화면 설정

- **설정 → 시스템 → 디스플레이 → 배율** 을 **100%** 로 두는 걸 추천해요. 배율이 다르면 버튼이나 벌집을 못 찾을 수 있어요.
- **야간 모드**, **HDR**, 색 필터는 꺼 주세요. 색으로 물체를 찾기 때문에 색이 바뀌면 인식률이 떨어져요.
- 로블록스는 **주 모니터**에서 최대화해서 띄워요. 전체 화면이 필요할 때는 매크로가 F11로 바꿔요.
- 로블록스 웹사이트(roblox.com)에서 설치한 로블록스를 추천해요.

## 5. 글자 인식 (OCR)

매크로는 윈도우에 들어 있는 글자 인식 기능으로 꿀 양, 퀘스트 내용 같은 게임 속 글자를 읽어요. 게임 글자가 영어라서 **영어 OCR** 이 가장 정확해요.

한국어 윈도우에는 보통 한국어 OCR만 들어 있어요. 숫자와 영어도 대부분 읽지만, 영어 OCR을 추가하는 걸 추천해요.

- 벌꿀이의 **시작 가이드 → 1. 영어 글자 인식 추가하기** 에서 **설치하기** 를 눌러요. 관리자 확인 창이 한 번 뜨면 **예** 를 눌러요. 윈도우가 내려받아 설치하느라 몇 분 걸릴 수 있어요.
- 설치하는 동안 가이드에 지금 단계, 걸린 시간, 진행률과 윈도우가 남긴 기록이 나와요. 진행률이 한동안 그대로여도 정상이에요.
- 확인 창이 안 보이면 작업 표시줄에서 깜빡이는 방패 아이콘을 눌러 보세요.
- 직접 설치하려면 **관리자 권한 터미널**에서 아래를 실행해요.

  ```powershell
  Add-WindowsCapability -Online -Name "Language.OCR~~~en-US~0.0.1.0"
  ```

## 6. 다시 설치하기 / 지우기

- **다시 설치:** 설치 파일을 다시 실행하면 파이썬까지 새로 깔려요. 설정은 그대로 남아요.
- **지우기:** **설정 → 앱 → 설치된 앱** 에서 **벌꿀이 (Beolkkuri)** 를 찾아 **제거** 를 눌러요.
  - 기본으로는 프로필과 설정을 남겨 둬요. 다시 설치하면 그대로 이어서 쓸 수 있어요.
  - 모두 지우려면 **프로필과 설정도 함께 지우기** 를 체크해요.
- **예전 한 줄 설치를 정리하려면:** 설치 파일로 옮긴 뒤에는 `%USERPROFILE%\Beolkkuri` 폴더와 `%USERPROFILE%\beolkkuri-env` 폴더를 지워도 돼요. 그때 설치한 파이썬 3.12는 **설정 → 앱 → 설치된 앱** 에서 따로 지울 수 있어요.

## 7. 잘 안 될 때

- **설치가 실패했어요:** 설치 기록이 `%TEMP%\Beolkkuri-Setup.log` 에 남아요. 실패 화면의 **다시 시도** 를 누르면 대부분 해결되고, 그래도 안 되면 이 파일을 Issues에 올려 주세요.
- **캐릭터가 안 움직여요:** 시작하기 전에 로블록스 창을 한 번 클릭해 두세요. 로블록스를 **관리자 권한으로 실행하지 마세요.** 그러면 윈도우가 매크로의 키 입력을 막아요.
- **매크로 화면이 안 열려요:** 벌꿀이 명령 창에 나온 내용을 확인하고, 그대로 Issues에 올려 주세요.
- 그 밖에는 **설정 → 기타 설정 → 디버그 파일 저장** 으로 만든 zip 파일과 증상을 Issues에 올려 주세요.

---

**English:** 벌꿀이 (Beolkkuri) runs on 64-bit Windows 10 (1809 or later) and Windows 11, and needs no permissions there. Download [Beolkkuri-Setup.exe](https://github.com/Yoon-robin/Beolkkuri/releases/latest/download/Beolkkuri-Setup.exe) and open it; if "Windows protected your PC" appears, click More info → Run anyway (the app isn't code-signed). It installs for your account only, without administrator rights, into `%LOCALAPPDATA%\Programs\Beolkkuri` with Python included, adds a Start menu entry (and a Desktop shortcut if checked), and brings over profiles from an old `%USERPROFILE%\Beolkkuri` install. `irm https://raw.githubusercontent.com/Yoon-robin/Beolkkuri/main/install.ps1 | iex` in PowerShell runs the same installer. Beolkkuri updates itself and restarts when you open it, never while the macro runs; turn that off under Settings → Other. Set Roblox to English (roblox.com → Settings → Account Info → Language), since the macro reads the game's English text. The first launch takes a few minutes while libraries are prepared and AI models download; the console window shows the progress, then moves to the taskbar once the app opens. Keep it open while the macro runs. While the macro runs, a small card in a corner of the Roblox window shows the current task, run time and latest logs; clicks pass through it and the macro's screenshots don't see it (Settings → Other → Game Overlay). For the most accurate text reading, add English OCR from step 1 of Getting Started (one administrator prompt). Use 100% display scaling, turn off Night light and HDR, run Roblox maximised on the main monitor, and don't run Roblox as administrator. Uninstall it under Settings → Apps → Installed apps; your settings stay unless you tick the box. The installer log is `%TEMP%\Beolkkuri-Setup.log`. To work on the code instead, download the ZIP and run `install_dependencies.bat`.

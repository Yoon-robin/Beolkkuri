# 윈도우에서 쓰기

벌꿀이는 **64비트 윈도우 10(1809 이상)과 윈도우 11**에서도 돌아가요. 맥과 달리 **권한을 따로 줄 필요가 없어요.**

> 윈도우 버전은 새로 추가돼서 실제 게임에서 아직 충분히 확인되지 않았어요. 이상한 점이 있으면 [GitHub Issues](https://github.com/Yoon-robin/Beolkkuri/issues)로 알려 주세요.

## 1. 설치하기

### 한 줄로 설치하기 (추천)

1. **시작 버튼을 마우스 오른쪽 클릭 → 터미널**을 열어요. (윈도우 10은 **Windows PowerShell**)
2. 아래 한 줄을 복사해서 붙여넣고(Ctrl+V) 엔터를 눌러요.

   ```powershell
   irm https://raw.githubusercontent.com/Yoon-robin/Beolkkuri/main/install.ps1 | iex
   ```

3. 5~10분 정도 기다려요. 설치 프로그램이 차례대로 이런 일을 해요.
   - 파이썬 3.12가 없으면 python.org에서 받아서 **내 계정에만** 설치해요. 관리자 권한은 필요 없어요.
   - 영어 글자 인식(OCR)이 없으면 설치할지 물어봐요. [4. 글자 인식](#4-글자-인식-ocr)을 참고하세요.
   - `내 사용자 폴더\beolkkuri-env` 에 매크로 전용 환경을 만들고 필요한 라이브러리를 설치해요.
   - 바탕화면과 시작 메뉴에 **벌꿀이** 바로가기를 만들어요.
4. 매크로는 `내 사용자 폴더\Beolkkuri` (`%USERPROFILE%\Beolkkuri`)에 설치돼요.

> 업데이트하거나 다시 설치할 때도 같은 줄을 붙여넣으면 돼요. 내 설정은 그대로 남아요.

### ZIP으로 설치하기

1. GitHub 페이지 위쪽의 초록색 **`<> Code`** 버튼 → **Download ZIP** 을 눌러요.
2. 받은 ZIP 파일을 마우스 오른쪽 클릭 → **압축 풀기**로 풀고, 폴더를 원하는 곳(예: `문서`)으로 옮겨요. ZIP 안에서 바로 실행하면 안 돼요.
3. 폴더 안의 **`install_dependencies.bat`** 을 더블클릭해요.
   - "Windows의 PC 보호" 창이 뜨면 **추가 정보 → 실행** 을 눌러요.
4. 설치한 뒤에는 폴더를 옮기지 마세요. 옮겼다면 3번을 다시 하면 바로가기도 새로 만들어져요.

## 2. 실행하기

1. 로블록스에서 **비 스웜 시뮬레이터**에 들어가요.
2. 바탕화면이나 시작 메뉴의 **벌꿀이**를 열어요. (또는 폴더 안의 `run_macro.bat`)
3. **벌꿀이 명령 창**(검은 창)이 먼저 뜨고, 이어서 매크로 화면이 열려요. 크롬이 있으면 크롬 앱 창으로, 없으면 엣지로 열려요.
   - 명령 창은 매크로가 켜져 있는 동안 **닫으면 안 돼요**. 최소화는 괜찮아요.
   - 벌꿀이를 다시 열면 이전에 켜 둔 벌꿀이는 알아서 꺼져요.
4. 왼쪽의 **시작 가이드** 를 따라 하면 돼요.

## 3. 화면 설정

- **설정 → 시스템 → 디스플레이 → 배율** 을 **100%** 로 두는 걸 추천해요. 배율이 다르면 버튼이나 벌집을 못 찾을 수 있어요.
- **야간 모드**, **HDR**, 색 필터는 꺼 주세요. 색으로 물체를 찾기 때문에 색이 바뀌면 인식률이 떨어져요.
- 로블록스는 **주 모니터**에서 최대화해서 띄워요. 전체 화면이 필요할 때는 매크로가 F11로 바꿔요.
- 로블록스 웹사이트(roblox.com)에서 설치한 로블록스를 추천해요.

## 4. 글자 인식 (OCR)

매크로는 윈도우에 들어 있는 글자 인식 기능으로 꿀 양, 퀘스트 내용 같은 게임 속 글자를 읽어요. 게임 글자가 영어라서 **영어 OCR** 이 가장 정확해요.

한국어 윈도우에는 보통 한국어 OCR만 들어 있어요. 숫자와 영어도 대부분 읽지만, 영어 OCR을 추가하는 걸 추천해요.

- 설치 중에 물어볼 때 **엔터**(또는 `y`)를 누르면 관리자 확인 창이 한 번 떠요. 거기서 **예** 를 누르면 돼요.
- 나중에 추가하려면 `install_dependencies.bat` 을 다시 실행하거나, **관리자 권한 터미널**에서 아래를 실행해요.

  ```powershell
  Add-WindowsCapability -Online -Name "Language.OCR~~~en-US~0.0.1.0"
  ```

## 5. 다시 설치하기 / 지우기

- **처음부터 다시 설치:** 터미널에서 아래를 실행한 뒤 [한 줄 설치](#한-줄로-설치하기-추천)를 다시 해요.

  ```powershell
  Remove-Item -Recurse -Force $HOME\beolkkuri-env
  ```

- **완전히 지우기:** `%USERPROFILE%\Beolkkuri` 폴더, `%USERPROFILE%\beolkkuri-env` 폴더, 바탕화면과 시작 메뉴의 벌꿀이 바로가기를 지워요. 파이썬 3.12는 **설정 → 앱 → 설치된 앱** 에서 따로 지울 수 있어요.

## 6. 잘 안 될 때

- **설치가 실패했어요:** 설치 기록이 `%USERPROFILE%\Beolkkuri-install.log` 에 남아요. 설치를 한 번 더 실행하면 대부분 해결되고, 그래도 안 되면 이 파일을 Issues에 올려 주세요.
- **캐릭터가 안 움직여요:** 시작하기 전에 로블록스 창을 한 번 클릭해 두세요. 로블록스를 **관리자 권한으로 실행하지 마세요.** 그러면 윈도우가 매크로의 키 입력을 막아요.
- **매크로 화면이 안 열려요:** 벌꿀이 명령 창에 나온 내용을 확인하고, 그대로 Issues에 올려 주세요.
- 그 밖에는 **설정 → 기타 설정 → 디버그 파일 저장** 으로 만든 zip 파일과 증상을 Issues에 올려 주세요.

---

**English:** 벌꿀이 runs on 64-bit Windows 10 (1809 or later) and Windows 11, and needs no permissions there. Open Terminal (or Windows PowerShell) and paste `irm https://raw.githubusercontent.com/Yoon-robin/Beolkkuri/main/install.ps1 | iex`. It installs Python 3.12 for your account if needed, offers to add English OCR (needs one administrator prompt), sets up `%USERPROFILE%\beolkkuri-env` and creates 벌꿀이 (Beolkkuri) shortcuts on the Desktop and in the Start menu. Without the one-liner, download the ZIP, extract it and double-click `install_dependencies.bat`. Start the macro from the shortcut or `run_macro.bat` and keep the 벌꿀이 console window open while it runs. Use 100% display scaling, turn off Night light and HDR, run Roblox maximised on the main monitor, and don't run Roblox as administrator. The install log is `%USERPROFILE%\Beolkkuri-install.log`. To reinstall from scratch, delete `%USERPROFILE%\beolkkuri-env` and run the installer again.

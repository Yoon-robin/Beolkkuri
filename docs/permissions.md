# 권한 설정 (Accessibility & Screen Recording)

RobinMacro는 **터미널** 안에서 실행돼요. 그래서 키보드·마우스를 움직이고 화면을 읽을 수 있게 **터미널에 두 가지 권한**을 줘야 해요.

## 1. 손쉬운 사용 (키보드·마우스 조작)

1. 화면 왼쪽 위 사과(🍎) 메뉴 → **시스템 설정** 을 열어요.
2. 왼쪽 목록에서 **개인정보 보호 및 보안** → 오른쪽의 **손쉬운 사용** 을 눌러요.
3. 목록에서 **터미널** 스위치를 켜요.
   - 목록에 터미널이 없으면 아래 **+** 버튼 → **응용 프로그램 → 유틸리티 → 터미널** 을 추가해요.
   - 맥 로그인 암호를 물으면 입력해요.

## 2. 화면 기록 (화면 보기)

1. 같은 **개인정보 보호 및 보안** 화면에서 **화면 기록**(macOS 15 이상은 **화면 및 시스템 오디오 기록**)을 눌러요.
2. **터미널** 스위치를 켜요. 없으면 위와 같은 방법으로 추가해요.

## 3. 터미널 다시 시작

권한은 터미널을 **완전히 끄고(⌘Q) 다시 켜야** 적용돼요. 그다음 RobinMacro를 다시 실행하세요.

## 제대로 켜졌는지 확인하기

RobinMacro를 열고 왼쪽의 **시작 가이드** 를 보면, 두 권한이 켜져 있는지 초록 체크로 바로 보여 줘요. 꺼져 있으면 **켜기** 버튼을 눌러 그 설정 화면을 열 수 있어요.

## 그래도 안 될 때

- 목록에 터미널이 켜져 있는데도 안 되면, **터미널을 선택하고 − 버튼으로 지운 뒤 다시 추가**해 보세요. macOS 업데이트 뒤에 권한이 꼬이는 경우가 있어요.
- 매크로가 "손쉬운 사용 권한이 없는 것 같아요"라는 창을 띄워도 실제로 잘 움직인다면 무시해도 돼요.

---

**English:** Open *System Settings → Privacy & Security*. Under **Accessibility** and **Screen Recording** (called *Screen & System Audio Recording* on macOS 15+), turn on **Terminal**, or add it with **+** from *Applications → Utilities*. Quit Terminal (⌘Q) and start RobinMacro again. The Getting Started page shows a green check for each permission once it is on. If it still fails, remove Terminal from the list and add it back.

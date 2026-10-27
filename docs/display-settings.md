# 화면(디스플레이) 설정

RobinMacro는 화면을 캡처해서 그림을 찾는 방식으로 게임 상태를 읽어요. 그래서 화면 설정이 바뀌면 벌집이나 버튼을 못 찾을 수 있어요.

## 맥 디스플레이

- **시스템 설정 → 디스플레이** 에서 해상도를 **기본값(Default for display)** 으로 두는 걸 추천해요.
  "텍스트 크게"나 "공간 더 많이" 처럼 배율을 바꾸면 인식이 틀어질 수 있어요.
- 모니터를 여러 대 쓴다면 로블록스는 **주 모니터**(메뉴 막대가 있는 화면)에 띄워요.
- **밤 시프트**, **트루 톤**, 색상 필터 같은 색 보정 기능은 꺼 주세요. 색으로 물체를 찾기 때문에 색이 바뀌면 인식률이 떨어져요.

## 윈도우 디스플레이

- **설정 → 시스템 → 디스플레이 → 배율** 을 **100%** 로 두는 걸 추천해요.
- 모니터를 여러 대 쓴다면 로블록스는 **주 모니터**에 띄워요.
- **야간 모드**, **HDR**, 색 필터는 꺼 주세요.
- 윈도우 설치와 실행은 [windows.md](windows.md) 에 따로 정리돼 있어요.

## 로블록스

- 로블록스 창은 **최대화(전체 화면)** 상태로 두고, 매크로가 도는 동안 다른 창으로 가리지 마세요.
- 게임 안 **그래픽 품질**은 너무 낮게 두지 않는 게 좋아요(자동 또는 중간 이상).
- 카메라를 직접 돌리거나 확대/축소하지 마세요. 매크로가 카메라를 맞춰 둬요.

## 그래도 잘 안 될 때

**설정 → 기타 설정 → 디버그 파일 저장** 을 눌러 만든 zip 파일과 증상을 GitHub Issues 에 올려 주세요.

---

**English:** Keep macOS display scaling at *Default for display* (on Windows, set display scale to 100% and turn off Night light and HDR), run Roblox maximised on the main monitor, turn off Night Shift, True Tone and colour filters, and don't move the camera or cover the Roblox window while the macro runs. If detection still fails, attach a debug export (*Settings → Other → Export debug folder*) to a GitHub issue.

# 화면 스트리밍 설정

스트리밍을 켜면 매크로 화면을 **웹 주소 하나로 어디서든**(휴대폰 등) 볼 수 있어요. 주소는 Cloudflare 임시 터널(`*.trycloudflare.com`)로 만들고, 디스코드로 보내 줘요.

## 1. cloudflared 설치

스트리밍에는 무료 프로그램 **cloudflared** 가 필요해요.

1. [Homebrew](https://brew.sh) 가 없다면 먼저 설치해요. 터미널에 아래를 붙여넣고 엔터:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. cloudflared 설치:
   ```bash
   brew install cloudflared
   ```
3. 설치 확인: `cloudflared --version` 을 입력해서 버전이 나오면 성공이에요.

## 2. 매크로에서 켜기

1. **설정 → 스트림** 에서 스트리밍을 켜요.
2. 해상도는 0.5~0.75 정도가 적당해요(높을수록 선명하지만 느려요).
3. 디스코드 알림을 설정해 두면 매크로를 시작할 때 스트림 주소를 보내 줘요.

> 스트림 주소를 아는 사람은 누구나 화면을 볼 수 있어요. 주소를 공개된 곳에 올리지 마세요.

---

**English:** Streaming needs **cloudflared**. Install Homebrew, then run `brew install cloudflared`, and check it with `cloudflared --version`. Turn streaming on under *Settings → Stream*. A resolution of 0.5-0.75 works well. The temporary `trycloudflare.com` link is sent to Discord when the macro starts. Anyone who has the link can watch, so keep it private.

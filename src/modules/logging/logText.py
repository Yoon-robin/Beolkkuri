"""Korean text for the macro's log lines.

The macro writes its log lines in English, and Discord gets them that way. main.py runs
each line through `localize` before the app's log panel, the game overlay and the Discord
bot's recent actions see it, so a Korean UI shows Korean. A line with no entry here stays
English: when you add a log line, add it to LINES too.

LINES maps an English line to Korean. In the English, {} stands for any text. In the
Korean, {0}, {1}... are those pieces in order, after NAMES has turned known game names
into Korean. {0|을} adds the particle that fits the word (을/를, 이/가, 은/는, 와/과, 으로/로).
A title and every line of a description (split at <br> and newlines) are looked up on
their own, with runs of spaces counted as one.
"""

import os
import re
import time

LINES = {
    # macro state
    "Beolkkuri": "벌꿀이",
    "Beolkkuri v{}": "벌꿀이 v{0}",
    "Macro Started": "매크로 시작",
    "Macro Stopped": "매크로 정지",
    "Macro Paused": "매크로 일시정지",
    "Macro Resumed": "매크로 다시 시작",
    "Macro Auto Stopped": "매크로 자동 정지",
    "Macro Crashed": "매크로가 갑자기 꺼졌어요",
    "Macro Crashed (terminated by signal {})": "매크로가 갑자기 꺼졌어요 (신호 {0})",
    "Macro Standby Enabled": "매크로 대기 시작",
    "Macro Standby Disabled": "매크로 대기 끝",
    "Macro Standby Ended": "매크로 대기 끝",
    "Macro Standby Failed": "매크로 대기 실패",
    "Mode: {}": "모드: {0}",
    "Alt Field: {}": "부계정 필드: {0}",
    "Display: {}, {}": "화면: {0}, {1}",
    "Starting the macro.": "매크로를 시작해요.",
    "Stopped after {} hour{}.": "{0}시간이 지나서 멈췄어요.",
    "The macro remains stopped.": "매크로는 계속 멈춰 있어요.",
    "The requested standby duration has ended. The macro remains stopped.": "정한 대기 시간이 끝났어요. 매크로는 계속 멈춰 있어요.",
    "Roblox was closed and this Mac will stay awake until disabled.": "로블록스를 닫았어요. 대기를 끌 때까지 이 맥은 잠들지 않아요.",
    "Roblox was closed and this Mac will stay awake for {} minute(s).": "로블록스를 닫았어요. 이 맥은 {0}분 동안 잠들지 않아요.",
    "Could not start macOS keep-awake mode.": "맥이 잠들지 않게 하지 못했어요.",
    "Use F2 or /resume to continue": "계속하려면 F2를 누르거나 /resume을 보내요",
    "Profile Changed": "프로필 변경",
    "Switched to profile: {}": "프로필을 바꿨어요: {0}",
    "Notice": "알림",
    "Task Reset": "작업 초기화",
    "Task Skipped": "작업 건너뜀",
    "Skipped: {}": "건너뜀: {0}",
    "Completed: {}": "완료: {0}",
    "{}: aborted": "{0}: 중단",
    "Runtime failed: {}": "실행 실패: {0}",
    "Fallback behavior engaged.": "대신 기본 동작으로 바꿨어요.",
    "MSS is too slow, switching to pillow": "화면 캡처(MSS)가 느려서 Pillow로 바꿔요",
    "Detect Y Offset: {}": "Y 오프셋 감지: {0}",
    "Toggling fullscreen mode": "전체 화면으로 바꿔요",
    "Shift Lock detected, turning it off": "Shift Lock이 켜져 있어서 꺼요",
    "Shift Lock detected during {}, turning it off": "{0} 중에 Shift Lock이 켜져 있어서 꺼요",
    "Night detected": "밤이 됐어요",
    "Hourly Report Error": "시간별 리포트 오류",
    "Item Monitor Error": "아이템 모니터 오류",
    "Incompatible pattern": "맞지 않는 패턴",
    "The pattern {} is incompatible with the macro. Defaulting to e_lol instead. Avoid using this pattern in the future. If you are the creator of this pattern, the error can be found in terminal": "{0} 패턴은 매크로와 맞지 않아서 e_lol로 바꿨어요. 이 패턴은 쓰지 마세요. 패턴을 만든 사람이라면 터미널에서 오류를 볼 수 있어요.",
    # rejoining
    "Rejoining": "재접속",
    "Rejoining (Scheduled)": "재접속 (예약)",
    "Disconnected": "연결이 끊겼어요",
    "Closing Roblox before rejoining": "재접속하려고 로블록스를 닫아요",
    "Rejoin attempt {}/{}: {}": "재접속 시도 {0}/{1}: {2}",
    "Roblox Home Page is open": "로블록스 홈 화면이 열려 있어요",
    "Roblox disconnected while loading; retrying rejoin": "로딩 중에 연결이 끊겨서 다시 재접속해요",
    "Game load was not confirmed within 36 seconds; trying the next rejoin target ({}/{}).": "36초 안에 게임이 열린 걸 확인하지 못해서 다음 서버로 가요 ({0}/{1}).",
    "Detected sustained screen color — retrying rejoin": "화면이 한 색으로 멈춰 있어서 다시 재접속해요",
    "Not logged into the Roblox app. Please sign in to continue rejoining via deeplink.": "로블록스 앱에 로그인돼 있지 않아요. 로그인해야 링크로 재접속할 수 있어요.",
    "Private-server join skipped by Discord command; trying the next configured server": "디스코드 명령으로 비공개 서버를 건너뛰고 다음 서버로 가요",
    "Private-server reconnects failed; falling back to a public server": "비공개 서버 재접속에 실패해서 공개 서버로 들어가요",
    "Invalid {}; trying the next server.": "{0|이} 잘못됐어요. 다음 서버로 가요.",
    "Join error {}": "접속 오류 {0}",
    "Detected {}; {}.": "{0}: {1}.",
    # hive
    "Detecting Hive": "벌집 찾는 중",
    "Hive {} detected as available": "{0}번 벌집이 비어 있어요",
    "Hive {} occupied": "{0}번 벌집은 주인이 있어요",
    "Hive {} occupied after walk": "가 보니 {0}번 벌집은 주인이 있어요",
    "Hive {} prompt missing after walk": "{0}번 벌집에 가 봤는데 차지하기 안내가 안 보여요",
    "Selecting hive {} from spawn detection": "스폰 위치에서 본 대로 {0}번 벌집을 골라요",
    "Trying next detected hive {} (from {})": "{1}번 대신 비어 보이는 {0}번 벌집으로 가 봐요",
    "Open hives from spawn: {}": "스폰 위치에서 본 빈 벌집: {0}",
    "no open hives were detected from spawn": "스폰 위치에서 빈 벌집을 못 찾았어요",
    "Scanning remaining hives": "남은 벌집을 살펴봐요",
    "Falling back to hive 3 walk detect": "3번 벌집까지 걸어가서 확인해요",
    "Walking spawn → hive {} (check)": "스폰 위치에서 {0}번 벌집까지 걸어가요 (확인)",
    "Claimed hive {}": "{0}번 벌집을 차지했어요",
    "Failed to claim hive ({}); retrying rejoin": "벌집을 차지하지 못해서 ({0}) 다시 재접속해요",
    "Rechecking hive slot before rejoining": "재접속하기 전에 벌집 번호를 다시 확인해요",
    "Hive slot recheck failed; rejoining": "벌집 번호를 다시 확인하지 못해서 재접속해요",
    "Could not find Make Honey while rechecking hive slot": "벌집 번호를 다시 확인하다가 Make Honey를 못 찾았어요",
    "Could not find hive prompts while rechecking hive slot": "벌집 번호를 다시 확인하다가 벌집 안내를 못 찾았어요",
    "Updated hive slot to {}; retrying cannon": "벌집 번호를 {0}번으로 바꾸고 대포를 다시 찾아요",
    "Can't find hive, resetting": "벌집을 못 찾아서 리셋해요",
    "Can't find hive, attempting whirligig fallback": "벌집을 못 찾아서 Whirligig로 돌아가 볼게요",
    "Whirligig fallback failed, resetting": "Whirligig로 돌아가지 못해서 리셋해요",
    "Whirligigs failed, walking to hive": "Whirligig로 돌아가지 못해서 벌집까지 걸어가요",
    "Unable to detect that player respawned at hive": "캐릭터가 벌집에서 다시 나타났는지 확인하지 못했어요",
    "Spawn detected in Hive Hub": "하이브 허브에서 시작했어요",
    "Spawn detected in {} Field": "{0} 필드에서 시작했어요",
    "Walking back to hive: {}": "벌집으로 걸어서 돌아가요: {0}",
    "Returning to hive before {}": "{0} 전에 벌집으로 돌아가요",
    "Player Died": "캐릭터가 죽었어요",
    "Player died": "캐릭터가 죽었어요",
    "Resetting character, Attempt: {}": "캐릭터 리셋, {0}번째",
    "Resetting and retrying: {}": "리셋하고 다시 해요: {0}",
    # travel
    "Travelling: {}": "이동: {0}",
    "Travelling: {} ({})": "이동: {0} ({1})",
    "Travelling: {}, Attempt {}": "이동: {0}, {1}번째",
    "Travelling: {} Planter ({}), {}": "이동: {0} 플랜터 ({1}), {2}",
    "Walking: {} ({})": "걸어서 이동: {0} ({1})",
    "Attacking: {} ({})": "공격: {0} ({1})",
    "Looting: {}": "줍는 중: {0}",
    "Looting: {} planter": "수확: {0} 플랜터",
    "Reached {}": "{0}에 도착했어요",
    "Failed to reach {}": "{0}까지 가지 못했어요",
    "Failed to reach Blender": "블렌더까지 가지 못했어요",
    "Failed to reach Honey Storm summon point": "꿀 폭풍 소환 지점까지 가지 못했어요",
    "Failed to reach sticker printer": "스티커 프린터까지 가지 못했어요",
    "Failed to reach cannon after {} attempts; rejoining": "{0}번 해 봐도 대포까지 못 가서 재접속해요",
    "Failed to reach cannon after {} attempts; aborting travel": "{0}번 해 봐도 대포까지 못 가서 이동을 그만둬요",
    "Could not find cannon (attempt {}/{})": "대포를 못 찾았어요 ({0}/{1}번째)",
    "Could not confirm cannon access before travel": "이동하기 전에 대포를 확인하지 못했어요",
    "Detected light/dark-mode screen while searching for cannon. Resetting and retrying cannon search ({} {} remaining).": "대포를 찾다가 밝은/어두운 화면이 보여서 리셋하고 다시 찾아요 (남은 횟수 {0}).",
    "Detected light/dark-mode screen again while searching for cannon. Rejoining.": "대포를 찾다가 또 밝은/어두운 화면이 보여서 재접속해요.",
    "Detected the same light/dark-mode color again after reset while searching for cannon. Rejoining.": "리셋한 뒤에도 대포를 찾다가 같은 밝은/어두운 화면이 보여서 재접속해요.",
    "Failed to land in field": "필드에 내리지 못했어요",
    "Failed to land in stump field": "그루터기 필드에 내리지 못했어요",
    "Travelling to {} (stinger hunt)": "{0|로} 가요 (스팅어 헌트)",
    "Travelling to {} (vicious bee)": "{0|로} 가요 (바이셔스 비)",
    "Travelling to Hive Hub to collect for {} minutes": "{0}분 동안 모으러 하이브 허브로 가요",
    "Travelling to {} to plant sprout (1/{} gather and {}/{} session)": "새싹을 심으러 {0|로} 가요 (채집 1/{1}, 세션 {2}/{3})",
    # gathering
    "Gathering: {}": "채집: {0}",
    "Gathering: Ended": "채집 끝",
    "Gathering: Extended": "채집 연장",
    "Gathering: interrupted": "채집 중단",
    "Limit: {} - {} - Backpack: {}": "시간: {0} - 패턴: {1} - 가방: {2}",
    "Limit: {} - {} - Backpack: {} - Goo Enabled": "시간: {0} - 패턴: {1} - 가방: {2} - 구 사용",
    "Time: {} - Backpack - Return: {}": "{0} 채집 - 가방이 참 - 귀환: {1}",
    "Time: {} - Backpack Full - Return: Honey Wreath": "{0} 채집 - 가방이 참 - 귀환: 꿀 화환",
    "Time: {} - Time Limit - Return: {}": "{0} 채집 - 시간 끝 - 귀환: {1}",
    "Time: {} - Time Limit - Backpack Full - Return: Honey Wreath": "{0} 채집 - 시간 끝 - 가방이 참 - 귀환: 꿀 화환",
    "Time limit reached: Skipping": "시간이 다 돼서 건너뛰어요",
    "Boosted Field: {}": "부스트된 필드: {0}",
    "Boosted Fields: {}": "부스트된 필드: {0}",
    "Boosted Fields: None": "부스트된 필드: 없음",
    "Collecting drops in {} with AI Gathering": "AI 채집으로 {0}에서 드롭을 모아요",
    "Inactive Honey Reset (Beta)": "꿀이 안 늘어서 리셋 (베타)",
    "Interrupting {} to collect in Hive Hub": "{0|을} 멈추고 하이브 허브에서 모아요",
    "Collecting for: {} minutes": "{0}분 동안 모아요",
    # converting
    "Converting": "꿀로 바꾸는 중",
    "Converting Balloon": "풍선을 꿀로 바꾸는 중",
    "Converting: interrupted": "꿀 바꾸기 중단",
    "Converting timeout ({}mins max)": "꿀 바꾸기 시간 초과 (최대 {0}분)",
    "Continuing conversion": "꿀로 계속 바꿔요",
    "Still converting": "아직 꿀로 바꾸는 중",
    "Finished converting (Time: {})": "꿀로 다 바꿨어요 (걸린 시간: {0})",
    "Claiming Honey Wreath before converting": "꿀로 바꾸기 전에 꿀 화환을 받아요",
    "Honey Wreath is ready. Waiting for the configured backpack limit ({}%) before claiming": "꿀 화환이 준비됐어요. 가방이 {0}% 찰 때까지 기다렸다가 받아요",
    "Honey Wreath ready, but backpack is not full yet. Deferring claim": "꿀 화환이 준비됐지만 가방이 덜 차서 나중에 받아요",
    "Time limit reached. Waiting for backpack to fill before claiming Honey Wreath": "시간이 다 됐어요. 가방이 차면 꿀 화환을 받아요",
    # collecting
    "Executing collect: {}": "모으는 중: {0}",
    "Completed collect: {}": "모으기 끝: {0}",
    "Collected: {}": "획득: {0}",
    "Collected: {}, Boosted Field: {}": "획득: {0}, 부스트된 필드: {1}",
    "Collecting: Mondo Buff": "모으는 중: 몬도 버프",
    "Collect {} not ready": "{0}: 아직 준비 안 됐어요",
    "Collect {} not ready, time remaining: {}h {}m": "{0}: 아직 준비 안 됐어요, {1}시간 {2}분 남음",
    "{} is on cooldown ({} remaining)": "{0} 쿨타임 ({1} 남음)",
    "Collected Token Link": "토큰 링크를 모았어요",
    "Collected loot from Wind Shrine": "바람 신전에서 보상을 받았어요",
    "Offered {} x{} to Wind Shrine": "바람 신전에 {0} x{1}을 바쳤어요",
    "Wind Shrine offering failed: could not find {} in shrine selector": "바람 신전에 바치지 못했어요: 목록에서 {0|을} 못 찾았어요",
    "Honey storm collected": "꿀 폭풍을 받았어요",
    "Honey Storm is on cooldown ({} remaining)": "꿀 폭풍 쿨타임 ({0} 남음)",
    "Gummy Beacon is already active": "구미 비콘이 이미 켜져 있어요",
    "Gummy Beacon is not unlocked": "구미 비콘이 아직 잠겨 있어요",
    "Failed to collect ant pass": "개미 패스를 받지 못했어요",
    "Maybe you have maxed out ant passes?": "개미 패스가 이미 가득 찼을 수도 있어요",
    "Maybe you have maxed out robo passes?": "로보 패스가 이미 가득 찼을 수도 있어요",
    "No ant passes detected — fetching free ant pass": "개미 패스가 없어서 무료 개미 패스를 받으러 가요",
    "Fed {} {}": "{1} {0}개를 먹였어요",
    "Could not find {} in inventory": "인벤토리에서 {0|을} 못 찾았어요",
    "Couldn't find {} in inventory": "인벤토리에서 {0|을} 못 찾았어요",
    "Couldn't find {} in inventory, retrying": "인벤토리에서 {0|을} 못 찾아서 다시 찾아요",
    "Rebuffing": "버프 다시 쓰기",
    "Rebuffing: {}": "다시 쓰는 중: {0}",
    "Rebuffed: {}": "다시 썼어요: {0}",
    "Mondo Buff": "몬도 버프",
    "Waiting for Mondo to be defeated": "몬도가 쓰러지길 기다려요",
    "Time Limit (15 minutes)": "시간 제한 (15분)",
    "Mondo may have despawned. Resetting": "몬도가 사라졌을 수도 있어요. 리셋해요",
    "Guiding Star": "길잡이 별",
    "Detected in {}": "{0}에서 발견",
    "Windy Bee": "윈디 비",
    # blender, stickers
    "Executing craft (blender)": "블렌더로 만드는 중",
    "Completed craft (blender)": "블렌더 제작 끝",
    "Craft (blender) not ready": "블렌더: 아직 준비 안 됐어요",
    "Craft (blender) not ready, time remaining: {}h {}m": "블렌더: 아직 준비 안 됐어요, {0}시간 {1}분 남음",
    "Blender is currently crafting an item ({} remaining)": "블렌더가 만드는 중이에요 ({0} 남음)",
    "Crafted: {} x{}, Ready in: {}": "제작: {0} x{1}, {2} 뒤 완성",
    "Unable to craft {}": "{0|을} 만들 수 없어요",
    "Unable to detect remaining crafting time, ending craft": "남은 제작 시간을 읽지 못해서 제작을 끝내요",
    "Failed to detect the quantity of items crafted. The macro will get the crafting time on the next visit": "만든 개수를 읽지 못했어요. 다음에 갈 때 제작 시간을 다시 확인해요",
    "Sticker Stack": "스티커 스택",
    "Sticker Stack on cooldown": "스티커 스택 쿨타임",
    "Activated Sticker Stack, Buff Duration: {}": "스티커 스택 사용, 버프 시간: {0}",
    "Activated Sticker Stack, Buff Duration: {} (Defaulted to 1hr)": "스티커 스택 사용, 버프 시간: {0} (기본값 1시간)",
    "Failed to detect sticker stack buff duration": "스티커 스택 버프 시간을 읽지 못했어요",
    "No Stickers left to stack, Sticker Stack has been disabled": "쌓을 스티커가 없어서 스티커 스택을 껐어요",
    "No Tickets left, Sticker Stack has been disabled": "티켓이 없어서 스티커 스택을 껐어요",
    "A hive/cub sticker has been wrongly selected, aborting": "벌집/새끼곰 스티커를 잘못 골라서 그만둬요",
    "Sticker printer on cooldown": "스티커 프린터 쿨타임",
    "No {} eggs left, Sticker Printer has been disabled": "{0} 알이 없어서 스티커 프린터를 껐어요",
    "Claimed sticker": "스티커를 받았어요",
    # boosts
    "AFB": "자동 필드 부스트",
    "AFB Reroll": "자동 필드 부스트 다시 굴리기",
    "AFB: Cooldown: {} seconds": "자동 필드 부스트: 쿨타임 {0}초",
    "Auto Field Boost": "자동 필드 부스트",
    "Automatic Field Boost": "자동 필드 부스트",
    "Auto Field Boost: Timeout": "자동 필드 부스트: 시간 초과",
    "Failed to boost {}": "{0} 부스트 실패",
    "Reroll requested during: {}": "다시 굴리기 요청 (하던 일: {0})",
    "{}, Attempt: {}/{}": "{0}, {1}/{2}번째",
    "{}, Attempt: {}/{} - Detected: {}": "{0}, {1}/{2}번째 - 감지: {3}",
    "Used Glitter from hotbar slot {}; extending field booster": "핫바 {0}번 칸의 글리터로 필드 부스트를 늘렸어요",
    "TAD Alt Sync": "TAD 부계정 연동",
    "TAD alt(s) started in {}": "TAD 부계정이 {0}에서 시작했어요",
    "TAD alt(s) moved to {}": "TAD 부계정이 {0|로} 옮겨 갔어요",
    "TAD alt(s) returned to {}": "TAD 부계정이 {0|로} 돌아갔어요",
    "Could not initialize TAD alt(s)": "TAD 부계정을 준비하지 못했어요",
    "Could not initialize TAD alt(s): {}": "TAD 부계정을 준비하지 못했어요: {0}",
    "Could not update TAD alt(s): {}": "TAD 부계정을 옮기지 못했어요: {0}",
    "Could not restore TAD alt(s): {}": "TAD 부계정을 되돌리지 못했어요: {0}",
    "Used Glitter from hotbar slot {}; extending the alt boost assignment": "핫바 {0}번 칸의 글리터로 부계정 부스트를 늘렸어요",
    "Could not use Glitter; using the normal boost duration": "글리터를 쓰지 못해서 기본 부스트 시간으로 해요",
    # planters
    "Collect Planter": "플랜터 수확",
    "Placing {} (slot {})": "{0} 놓는 중 ({1}번 칸)",
    "Placed {} Planter": "{0} 플랜터를 놓았어요",
    "Planter will be ready in: {}": "플랜터 완성까지: {0}",
    "Not in a field, couldn't place {}": "필드 안이 아니라서 {0|을} 못 놓았어요",
    "Already at max planters, couldn't place {}": "플랜터가 이미 최대라서 {0|을} 못 놓았어요",
    "Failed to place {}": "{0|을} 놓지 못했어요",
    "Unable to find Planter: {}": "플랜터를 못 찾았어요: {0}",
    "Could not find {}planter in inventory (attempt {}) - retrying": "인벤토리에서 {0}플랜터를 못 찾았어요 ({1}번째), 다시 찾아요",
    "[Planter Placement] Hotbar slot {} did not confirm {} placement. Trying inventory fallback.": "[플랜터 놓기] 핫바 {0}번 칸으로 {1|을} 놓았는지 확인하지 못해서 인벤토리에서 꺼내 볼게요.",
    "Auto-planter chose {} in {} for {}": "자동 플랜터: {1}에 {0} 플랜터 ({2})",
    "Collect planter command received: {} in {}": "플랜터 수확 명령을 받았어요: {1}의 {0}",
    "Collect planter requested during: {}": "플랜터 수확 요청 (하던 일: {0})",
    "Collected {} planter from {} and cleared its timer.": "{1}에서 {0} 플랜터를 수확하고 타이머를 지웠어요.",
    "Skipping loot collection for {} planter": "{0} 플랜터 주변 줍기는 건너뛰어요",
    "Found {} in inventory after collect": "수확한 뒤 인벤토리에서 {0|을} 찾았어요",
    "{} not found in field, but found in inventory. Marking as collected.": "{0|이} 필드에는 없지만 인벤토리에 있어요. 수확한 걸로 표시해요.",
    "{} is already in {}": "{0|은} 이미 {1}에 있어요",
    "Planter {} not found in inventory after looting (attempt {}/{}), retrying.": "수확한 뒤 인벤토리에 {0} 플랜터가 없어요 ({1}/{2}번째). 다시 찾아요.",
    "Planter {} still not found in inventory after {} attempts. Keeping planter state and retrying later.": "{1}번 해 봐도 인벤토리에 {0} 플랜터가 없어요. 플랜터 기록은 그대로 두고 나중에 다시 해요.",
    "Nectar Percentages": "넥타 비율",
    "**{}**: {}%": "**{0}**: {1}%",
    # sprouts
    "Sprouts": "새싹",
    "Sticker Sprout": "스티커 새싹",
    "Unusual Sprout": "특별한 새싹",
    "{} Sprout": "{0} 새싹",
    "Hive Hub spawn soon": "곧 하이브 허브에 나와요",
    "Planting sprout in {} ({}/{})": "{0}에 새싹 심는 중 ({1}/{2})",
    "Planting next sprout from current position in {}": "{0}의 지금 자리에서 다음 새싹을 심어요",
    "Detected sprout pop message; planting next sprout ({}/{}).": "새싹이 터졌어요. 다음 새싹을 심어요 ({0}/{1}).",
    "No sprout pop message detected for {} seconds ({}); trying next sprout ({}/{}).": "{0}초 동안 새싹이 터졌다는 메시지가 없어서 ({1}) 다음 새싹을 심어요 ({2}/{3}).",
    "A sprout is already in this field; Magic Bean use was not counted. Continuing to collect.": "이 필드에 이미 새싹이 있어서 마법 콩은 쓴 걸로 세지 않았어요. 계속 모아요.",
    "Sprout bean limit reached": "새싹 콩 한도에 닿았어요",
    "Sprout bean limit reached before planting": "심기 전에 새싹 콩 한도에 닿았어요",
    "Sprout gather limit reached before planting": "심기 전에 새싹 채집 한도에 닿았어요",
    "Sprout gather limit reached ({}/{}). Collecting remaining drops for {} seconds before moving on.": "새싹 채집 한도에 닿았어요 ({0}/{1}). {2}초 동안 남은 드롭을 모으고 넘어가요.",
    "Sprout session limit reached. Collecting remaining drops for {} seconds before resetting.": "새싹 세션 한도에 닿았어요. {0}초 동안 남은 드롭을 모으고 리셋해요.",
    "Final sprout loot collection finished. Resetting to hive.": "마지막 새싹 보상을 다 모았어요. 벌집으로 리셋해요.",
    "Waiting for an additional {} seconds": "{0}초 더 기다려요",
    # mobs
    "Executing kill {} in field: {}": "{0} 잡는 중: {1}",
    "Completed kill {} in field: {}": "{0} 잡기 끝: {1}",
    "Failed to kill {} in {}: {}": "{1}에서 {0} 잡기 실패: {2}",
    "Could not kill {} in time. Maybe it hasn't respawned?": "{0|을} 제때 잡지 못했어요. 아직 다시 안 나왔을 수도 있어요.",
    "Attempting to kill beetle in field: {}": "딱정벌레 잡는 중: {0}",
    "Completed beetle kill attempt in field: {}": "딱정벌레 잡기 끝: {0}",
    "No beetles found to kill": "잡을 딱정벌레가 없어요",
    "Defeated: {}": "처치: {0}",
    "Died to {}": "{0}에게 당했어요",
    "Time Limit: {}": "시간 제한: {0}",
    "Stump Snail Killed": "그루터기 달팽이를 잡았어요",
    "Stump Snail: Running periodic side task": "그루터기 달팽이: 중간에 다른 작업을 하러 가요",
    "Stinger Hunt": "스팅어 헌트",
    "Vicious Bee detected ({})": "바이셔스 비 발견 ({0})",
    "Vicious Bee Defeated": "바이셔스 비를 잡았어요",
    "Took too long to kill Vicious Bee": "바이셔스 비를 잡는 데 너무 오래 걸렸어요",
    "Start Ant Challenge": "개미 챌린지 시작",
    "Executing ant challenge for quest": "퀘스트 때문에 개미 챌린지를 해요",
    "Ant Challenge Complete": "개미 챌린지 끝",
    "Completed ant challenge": "개미 챌린지를 끝냈어요",
    "Cant start ant challenge": "개미 챌린지를 시작하지 못했어요",
    "Ant Challenge timed out waiting for score popup; pressing Keep Old and resetting": "개미 챌린지 점수 창이 안 떠서 Keep Old를 누르고 리셋해요",
    "Player died during Ant Challenge; resetting": "개미 챌린지 중에 캐릭터가 죽어서 리셋해요",
    # quests
    "Quest Task": "퀘스트 작업",
    "Quest Task Complete": "퀘스트 작업 끝",
    "Quest Task Error": "퀘스트 작업 오류",
    "Quest Objective Complete": "퀘스트 목표 완료",
    "Quest Completer": "퀘스트 확인",
    "Live Quest Progress": "퀘스트 진행 상황",
    "Quest mobs ready": "잡을 수 있는 퀘스트 몹",
    "Quest mobs ready: {}": "잡을 수 있는 퀘스트 몹: {0}",
    "Skipping ignored petal quest": "제외한 꽃잎 퀘스트를 건너뛰어요",
    "Detected Brown Bear Quest: {}": "갈색곰 퀘스트: {0}",
    "Detected {} Quest: {}": "{0} 퀘스트: {1}",
    "Quest: {}": "퀘스트: {0}",
    "Quest Title: {}": "퀘스트 이름: {0}",
    "Could not find {} quest": "{0} 퀘스트를 못 찾았어요",
    "Executing gather in field: {}": "채집하는 중: {0}",
    "Completed gather in field: {}": "채집 끝: {0}",
    "Error executing quest task {}: {}": "퀘스트 작업 {0} 오류: {1}",
    "{} objective completed: {}": "{0} 목표 완료: {1}",
    "{} no longer needs {}; continuing for another active quest.": "{0}에는 이제 {1|이} 필요 없어요. 다른 퀘스트를 위해 계속해요.",
    "Watching {}: {}": "지켜보는 퀘스트 {0}: {1}",
    "Running before quest gathering: {}": "퀘스트 채집 전에 하는 중: {0}",
    "Skipping remaining {} runs; no watched quest still needs them.": "남은 {0}번은 건너뛰어요. 지켜보는 퀘스트에 더 필요하지 않아요.",
    "Solving: {}": "푸는 중: {0}",
    "Looping 1 time": "1번 반복해요",
    "Looping {} times": "{0}번 반복해요",
    "Waiting for quest UI to load...": "퀘스트 창이 열리길 기다려요...",
    "Quest UI loaded successfully (attempt {})": "퀘스트 창이 열렸어요 ({0}번째)",
    "Warning: Could not verify quest UI loaded": "주의: 퀘스트 창이 열렸는지 확인하지 못했어요",
    "Scrolling to top of quest list...": "퀘스트 목록 맨 위로 올려요...",
    "Scanning quest objectives...": "퀘스트 목표를 읽어요...",
    "Quest scanning complete. Found {} unique objectives.": "퀘스트를 다 읽었어요. 목표 {0}개를 찾았어요.",
    "**Completed Objectives:**": "**완료한 목표:**",
    "**Incomplete Objectives:**": "**남은 목표:**",
    # stream and tools
    "Stream Started": "스트리밍 시작",
    "Stream Stopped": "스트리밍 정지",
    "Starting Stream...": "스트리밍을 시작해요...",
    "Stream URL: {}": "스트리밍 주소: {0}",
    "Stream could not start. Check terminal for more info": "스트리밍을 시작하지 못했어요. 자세한 내용은 터미널(명령 창)에 있어요",
    "Stream disabled from Discord.": "디스코드에서 스트리밍을 껐어요.",
    "Tool Started": "도구 시작",
    "Tool Completed": "도구 끝",
    "Tool Stopped": "도구 정지",
    "Tool Error": "도구 오류",
    "Auto Gifted Basic Bee started.": "기프티드 기본 벌 뽑기를 시작했어요.",
    "Auto Gifted Basic Bee: {}": "기프티드 기본 벌 뽑기: {0}",
    "Auto Clicker started.": "오토 클릭을 시작했어요.",
    "Auto Clicker stopped.": "오토 클릭을 멈췄어요.",
    "Auto Clicker: {}": "오토 클릭: {0}",
    "Hotbar Buff started.": "핫바 버프를 시작했어요.",
    "Hotbar Buff stopped.": "핫바 버프를 멈췄어요.",
    "Hotbar Buff: {}": "핫바 버프: {0}",
}

# Game names that show up inside log lines, keyed in lower case with spaces.
NAMES = {
    # fields
    "sunflower": "해바라기", "dandelion": "민들레", "mushroom": "버섯", "blue flower": "파란 꽃",
    "clover": "클로버", "strawberry": "딸기", "spider": "거미", "bamboo": "대나무",
    "pineapple": "파인애플", "stump": "그루터기", "cactus": "선인장", "pumpkin": "호박",
    "pine tree": "소나무", "rose": "장미", "mountain top": "산 정상", "pepper": "고추",
    "coconut": "코코넛", "hive hub": "하이브 허브", "hive": "벌집",
    # collectibles and places
    "wealth clock": "부의 시계", "honey dispenser": "꿀 디스펜서", "blueberry dispenser": "블루베리 디스펜서",
    "strawberry dispenser": "딸기 디스펜서", "coconut dispenser": "코코넛 디스펜서",
    "royal jelly dispenser": "로열 젤리 디스펜서", "treat dispenser": "간식 디스펜서",
    "ant pass dispenser": "개미 패스 디스펜서", "buy ant pass": "개미 패스 구매",
    "robo pass dispenser": "로보 패스 디스펜서", "glue dispenser": "글루 디스펜서",
    "stockings": "양말", "feast": "만찬", "gingerbread": "진저브레드 하우스",
    "gingerbread house": "진저브레드 하우스", "samovar": "사모바르", "snow machine": "눈 기계",
    "lid art": "뚜껑 아트", "candles": "양초", "wreath": "꿀 화환", "honey wreath": "꿀 화환",
    "gummy beacon": "구미 비콘", "sticker printer": "스티커 프린터", "sticker stack": "스티커 스택",
    "mondo buff": "몬도 버프", "memory match": "메모리 매치", "mega memory match": "메가 메모리 매치",
    "extreme memory match": "익스트림 메모리 매치", "winter memory match": "겨울 메모리 매치",
    "wind shrine": "바람 신전", "honeystorm": "꿀 폭풍", "honey storm": "꿀 폭풍",
    "sprouts": "새싹", "sprout": "새싹", "sticker sprout": "스티커 새싹",
    "blue booster": "파란 부스터", "red booster": "빨간 부스터", "mountain booster": "산 정상 부스터",
    "blender": "블렌더", "ant challenge": "개미 챌린지", "stinger hunt": "스팅어 헌트",
    "guiding star": "길잡이 별", "token link": "토큰 링크",
    # mobs
    "ladybug": "무당벌레", "rhinobeetle": "장수풍뎅이", "rhino beetle": "장수풍뎅이",
    "scorpion": "전갈", "mantis": "사마귀", "werewolf": "늑대인간", "coconut crab": "코코넛 게",
    "king beetle": "킹 비틀", "tunnel bear": "터널 곰", "stump snail": "그루터기 달팽이",
    "vicious bee": "바이셔스 비", "mondo chick": "몬도", "mondo": "몬도", "windy bee": "윈디 비",
    # quest givers
    "polar bear": "북극곰", "brown bear": "갈색곰", "black bear": "흑곰", "honey bee": "허니 비",
    "bucko bee": "버코 비", "riley bee": "라일리 비",
    # planters (a log adds the word planter itself)
    "paper": "종이", "ticket": "티켓", "festive": "축제", "sticker": "스티커", "plastic": "플라스틱",
    "candy": "사탕", "red clay": "빨간 점토", "blue clay": "파란 점토", "tacky": "끈적이",
    "pesticide": "살충제", "heat-treated": "열처리", "hydroponic": "수경재배", "petal": "꽃잎",
    "planter of plenty": "풍요의",
    # items
    "glitter": "글리터", "blueberries": "블루베리", "enzymes": "효소", "gumdrops": "검드롭",
    "honeysuckles": "허니서클", "jelly beans": "젤리빈", "magic bean": "마법 콩",
    "micro-converter": "마이크로 컨버터", "moon charm": "문 참", "moon charms": "문 참", "oil": "오일",
    "pineapples": "파인애플", "royal jelly": "로열 젤리", "strawberries": "딸기",
    "sunflower seeds": "해바라기 씨앗", "tickets": "티켓", "treat": "간식", "treats": "간식",
    "coconuts": "코코넛", "glue": "글루", "star jelly": "스타 젤리", "blue extract": "파란 추출물",
    "red extract": "빨간 추출물", "cloud vial": "구름 병", "star treat": "스타 간식", "stingers": "스팅어",
    "tropical drink": "트로피컬 드링크", "festive bean": "축제 콩", "gingerbread bear": "진저브레드 곰",
    "soft wax": "소프트 왁스", "hard wax": "하드 왁스", "swirled wax": "스월 왁스", "caustic wax": "부식성 왁스",
    "night bell": "나이트 벨", "super smoothie": "슈퍼 스무디", "purple potion": "보라색 물약",
    "turpentine": "테레빈유", "field dice": "필드 주사위", "smooth dice": "스무스 주사위",
    "loaded dice": "로디드 주사위", "basic egg": "기본 알", "silver egg": "실버 알", "gold egg": "골드 알",
    "diamond egg": "다이아몬드 알", "mythic egg": "신화 알",
    "basic": "기본", "silver": "실버", "gold": "골드", "diamond": "다이아몬드", "mythic": "신화",
    # nectars
    "comforting": "편안함", "motivating": "동기부여", "satisfying": "만족감",
    "refreshing": "상쾌함", "invigorating": "활력",
    # sprout rarities
    "legendary": "전설", "supreme": "슈프림", "gummy": "구미", "debug": "디버그", "moon": "달",
    "epic": "에픽", "rare": "레어", "common": "일반",
    # macro words
    "normal mode": "일반 모드", "alt mode": "부계정 모드", "field mode": "필드 전용 모드",
    "quest mode": "퀘스트 전용 모드", "bug run mode": "벌레 사냥 모드",
    "waiting for host": "호스트를 기다리는 중", "ai gather": "AI 채집", "gathering": "채집",
    "converting": "꿀로 바꾸기", "reset": "리셋", "walk": "걸어서", "rejoin": "재접속",
    "infinite": "무제한", "ignored": "상관없음", "none": "없음",
    # private servers (Rejoin attempt / Invalid ...)
    "primary private server": "기본 비공개 서버", "private server link": "비공개 서버 링크",
    "fallback private server link 1": "예비 비공개 서버 링크 1",
    "fallback private server link 2": "예비 비공개 서버 링크 2",
    "fallback private server link 3": "예비 비공개 서버 링크 3",
    # join errors (Detected {reason}; {next step}.)
    "connection failure": "연결 실패", "permission denied": "접속 권한 없음",
    "banned from this experience": "이 게임에서 차단됨",
    "server data failure or active ban": "서버 데이터 오류 또는 차단",
    "too many requests": "요청이 너무 많음", "join error": "접속 오류",
    "trying the next configured server": "다음 서버로 가요",
    "waiting 30 seconds before retrying": "30초 기다렸다가 다시 해요",
    "stopping rejoin attempts": "재접속을 그만둬요", "retrying the connection": "다시 연결해요",
}

_PARTICLES = {
    "을": ("을", "를"), "를": ("을", "를"), "이": ("이", "가"), "가": ("이", "가"),
    "은": ("은", "는"), "는": ("은", "는"), "과": ("과", "와"), "와": ("과", "와"),
    "으로": ("으로", "로"), "로": ("으로", "로"),
}
# Digits read in Korean: which end in a final consonant, and which of those in ㄹ.
_DIGIT_FINAL = {"0": True, "1": True, "2": False, "3": True, "4": False,
                "5": False, "6": True, "7": True, "8": True, "9": False}
_DIGIT_RIEUL = {"1", "7", "8"}


def _key(text):
    return " ".join(text.replace("_", " ").split()).lower()


def _name(value):
    core = value.strip()
    if not core:
        return value
    ko = NAMES.get(_key(core))
    if ko is None and _key(core).endswith(" planter") and _key(core)[:-8] in NAMES:
        ko = NAMES[_key(core)[:-8]] + " 플랜터"
    if ko is None and ", " in core:
        ko = ", ".join(_name(part) for part in core.split(", "))
    if ko is None:
        return value
    lead = value[:len(value) - len(value.lstrip())]
    trail = value[len(value.rstrip()):]
    return lead + ko + trail


def _particle(word, particle):
    pair = _PARTICLES.get(particle)
    if pair is None:
        return particle
    last = word.rstrip(" )]'\"%")[-1:]
    if "가" <= last <= "힣":
        final = (ord(last) - 0xAC00) % 28
        if pair[0] == "으로" and final == 8:  # ㄹ takes 로
            return "로"
        return pair[0] if final else pair[1]
    if last.isdigit():
        if pair[0] == "으로" and last in _DIGIT_RIEUL:
            return "로"
        return pair[0] if _DIGIT_FINAL[last] else pair[1]
    if pair[0] == "으로":
        return "(으)로"
    return f"{pair[0]}({pair[1]})"


_SLOT = re.compile(r"\{(\d+)(?:\|([^}]+))?\}")


def _fill(template, values):
    def slot(m):
        index = int(m.group(1))
        word = values[index] if index < len(values) else ""
        return word + (_particle(word, m.group(2)) if m.group(2) else "")
    return _SLOT.sub(slot, template)


def _compile():
    exact, patterns = {}, []
    for english, korean in LINES.items():
        english = " ".join(english.split())
        if "{}" not in english:
            exact[english] = korean
            continue
        parts = english.split("{}")
        regex = re.compile("^" + "(.*?)".join(re.escape(p) for p in parts) + "$")
        patterns.append((len("".join(parts)), regex, korean))
    # the line with the most fixed text wins ("Collected: {}, Boosted Field: {}" over "Collected: {}")
    patterns.sort(key=lambda p: -p[0])
    return exact, [(regex, korean) for _, regex, korean in patterns]


_EXACT, _PATTERNS = _compile()


def localize_line(line):
    """One line in Korean, or the line as it was when nothing here matches it."""
    text = " ".join(str(line).split())
    if not text:
        return line
    korean = _EXACT.get(text)
    if korean is not None:
        return korean
    for regex, korean in _PATTERNS:
        m = regex.match(text)
        if m:
            return _fill(korean, [_name(v) for v in m.groups()])
    named = _name(text)
    return named if named != text else line


def localize_text(text):
    """A description: each line between <br> and newlines in Korean."""
    if not text:
        return text
    parts = re.split(r"(<br>|\n)", str(text))
    return "".join(p if p in ("<br>", "\n") else localize_line(p) for p in parts)


def localize(title, desc):
    return localize_line(title) if title else title, localize_text(desc)


_language = {"korean": True, "checked": 0.0}


def wantsKorean():
    """ui_language from the general settings, read at most every 2 seconds (default Korean)."""
    now = time.time()
    if now - _language["checked"] >= 2:
        _language["checked"] = now
        try:
            from modules.misc import settingsManager
            path = os.path.join(settingsManager.getProfilePath(), "generalsettings.txt")
            _language["korean"] = settingsManager.readSettingsFile(path).get("ui_language", "ko") != "en"
        except Exception:
            pass
    return _language["korean"]

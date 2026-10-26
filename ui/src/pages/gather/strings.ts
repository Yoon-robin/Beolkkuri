import type { PageStrings } from "@/i18n"

type Key =
  | "title"
  | "subtitle"
  | "importPatterns"
  | "importPatternsHint"
  | "slot"
  | "slotOn"
  | "slotOff"
  | "noField"
  | "slotTitle"
  | "slotDesc"
  | "hiveHubNotice"
  | "patternMissing"
  | "patternDesc.blooms_ai"
  | "patternDesc.robin_ai_gather"
  | "patternsSaved"
  | "patternsErrors"
  | "patternsNone"
  | "patternsFailed"
  | "infiniteHint"
  | "tokensButton"
  | "tokensTitle"
  | "tokensModel"
  | "tokensHelp"
  | "tokensCount"
  | "tokensAllOn"
  | "tokensAllOff"
  | "tokensUp"
  | "tokensDown"
  | "tokensDrag"
  | "tokensSave"
  | "tokensSaved"
  | "tokensFailed"
  | "model.Standard"
  | "model.Light"
  | "model.Mini"
  | "modelsChecking"
  | "modelsReady"
  | "modelsMissing"
  | "modelsDownload"
  | "modelsDownloading"
  | "modelsDownloaded"
  | "modelsDownloadFailed"
  | "modelsUnknown"
  | "toolsTitle"
  | "toolsDesc"
  | "export"
  | "import"
  | "reset"
  | "needField"
  | "exportDone"
  | "exportMeta"
  | "exportFailed"
  | "importTitle"
  | "importDesc"
  | "importPlaceholder"
  | "importEmpty"
  | "importDone"
  | "importFrom"
  | "importVersion"
  | "importReplaced"
  | "importWarnings"
  | "importFailed"
  | "resetTitle"
  | "resetDesc"
  | "resetDone"
  | "resetFailed"

export const strings: PageStrings<Key> = {
  ko: {
    title: "채집",
    subtitle: "필드를 최대 5개까지 골라서 각각 어떻게 채집할지 정해요.",
    importPatterns: "패턴 가져오기",
    importPatternsHint: "가지고 있는 패턴 파일(.py, .ahk)을 추가해요.",
    slot: "필드 {n}",
    slotOn: "켜짐",
    slotOff: "꺼짐",
    noField: "필드 없음",
    slotTitle: "필드 {n}",
    slotDesc: "이 칸에서 채집할 필드를 고르고 켜거나 꺼요.",
    hiveHubNotice: "하이브 허브에서 매크로를 시작하지 마세요. 매크로가 알아서 그곳으로 이동해요.",
    patternMissing: "{name} (설치 안 됨)",
    "patternDesc.blooms_ai": "꽃(블룸)을 쫓아가고, 꽃잎을 모으려고 빙글빙글 돌아요.",
    "patternDesc.robin_ai_gather": "화면의 토큰을 AI가 알아보고 골라서 쫓아가요.",
    patternsSaved: "패턴 {count}개를 가져왔어요: {list}",
    patternsErrors: "가져오지 못한 파일이 있어요: {list}",
    patternsNone: "가져온 파일이 없어요.",
    patternsFailed: "패턴을 가져오지 못했어요.",
    infiniteHint: "무한 채집이 켜져 있어서 시간·가방 제한은 쓰이지 않아요.",
    tokensButton: "토큰 고르기",
    tokensTitle: "선호 토큰",
    tokensModel: "선택한 모델: {model}. 이 모델이 알아보는 토큰만 보여요.",
    tokensHelp: "AI 채집이 쫓아갈 토큰을 켜 주세요. 끌어서 순서를 바꾸면 위에 있는 토큰부터 쫓아가요. 꺼 둔 토큰은 무시해요.",
    tokensCount: "{total}개 중 {count}개 켜짐",
    tokensAllOn: "모두 켜기",
    tokensAllOff: "모두 끄기",
    tokensUp: "위로",
    tokensDown: "아래로",
    tokensDrag: "끌어서 순서 바꾸기",
    tokensSave: "토큰 저장",
    tokensSaved: "선호 토큰을 저장했어요.",
    tokensFailed: "토큰 설정을 불러오거나 저장하지 못했어요.",
    "model.Standard": "표준",
    "model.Light": "라이트",
    "model.Mini": "미니",
    modelsChecking: "AI 모델을 확인하는 중…",
    modelsReady: "필요한 AI 모델이 모두 설치돼 있어요.",
    modelsMissing: "필요한 AI 모델 {count}개가 아직 없어요. 받아야 이 패턴이 작동해요.",
    modelsDownload: "모델 받기",
    modelsDownloading: "받는 중… 몇 분 걸릴 수 있어요.",
    modelsDownloaded: "AI 모델을 받았어요.",
    modelsDownloadFailed: "모델을 받지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.",
    modelsUnknown: "AI 모델 상태를 확인하지 못했어요.",
    toolsTitle: "설정 공유·초기화",
    toolsDesc: "{field} 설정을 복사해서 나누거나, 받은 설정을 넣거나, 기본값으로 되돌려요.",
    export: "설정 내보내기",
    import: "설정 가져오기",
    reset: "기본값으로 되돌리기",
    needField: "먼저 필드를 골라 주세요.",
    exportDone: "{field} 설정을 클립보드에 복사했어요.",
    exportMeta: "매크로 버전 {version} · {date}",
    exportFailed: "설정을 내보내지 못했어요.",
    importTitle: "{field} 설정 가져오기",
    importDesc: "다른 사람이 공유한 설정을 아래에 붙여 넣으세요.",
    importPlaceholder: "여기에 붙여 넣기…",
    importEmpty: "붙여 넣은 내용이 없어요.",
    importDone: "{field} 설정을 가져왔어요.",
    importFrom: "원래 필드: {field}",
    importVersion: "매크로 버전: {version}",
    importReplaced: "없는 패턴은 다른 패턴으로 바꿨어요: {list}",
    importWarnings: "확인해 주세요: {list}",
    importFailed: "가져오지 못했어요. 붙여 넣은 내용이 맞는지 확인해 주세요.",
    resetTitle: "{field} 설정을 기본값으로 되돌릴까요?",
    resetDesc: "이 필드의 채집 설정이 모두 처음 상태로 바뀌어요. 되돌릴 수 없어요.",
    resetDone: "{field} 설정을 기본값으로 되돌렸어요.",
    resetFailed: "{field} 설정을 되돌리지 못했어요. 기본 설정에 없는 필드일 수 있어요.",
  },
  en: {
    title: "Gather",
    subtitle: "Pick up to 5 fields and choose how to gather in each one.",
    importPatterns: "Import patterns",
    importPatternsHint: "Add your own pattern files (.py, .ahk).",
    slot: "Field {n}",
    slotOn: "On",
    slotOff: "Off",
    noField: "No field",
    slotTitle: "Field {n}",
    slotDesc: "Choose which field this slot gathers in and turn it on or off.",
    hiveHubNotice: "Do NOT start the macro in Hive Hub, it will travel there automatically.",
    patternMissing: "{name} (not installed)",
    "patternDesc.blooms_ai": "Chases blooms and circles for petals.",
    "patternDesc.robin_ai_gather": "Uses AI to spot tokens on screen and chase the ones you pick.",
    patternsSaved: "Imported {count} pattern(s): {list}",
    patternsErrors: "Some files failed: {list}",
    patternsNone: "No files were processed.",
    patternsFailed: "Failed to import patterns.",
    infiniteHint: "Infinite gathering is on, so the time and backpack limits are ignored.",
    tokensButton: "Customize tokens",
    tokensTitle: "Preferred tokens",
    tokensModel: "Selected model: {model}. Only tokens detected by this model are shown.",
    tokensHelp: "Enable tokens AI Gathering should chase. Drag tokens to sort them from highest to lowest priority; disabled tokens are ignored.",
    tokensCount: "{count} of {total} enabled",
    tokensAllOn: "Enable all",
    tokensAllOff: "Disable all",
    tokensUp: "Up",
    tokensDown: "Down",
    tokensDrag: "Drag to reorder",
    tokensSave: "Save tokens",
    tokensSaved: "Preferred tokens saved.",
    tokensFailed: "Could not load or save the token ranking.",
    "model.Standard": "Standard",
    "model.Light": "Light",
    "model.Mini": "Mini",
    modelsChecking: "Checking AI models…",
    modelsReady: "All AI models this pattern needs are installed.",
    modelsMissing: "{count} AI model(s) this pattern needs are missing.",
    modelsDownload: "Download models",
    modelsDownloading: "Downloading… this can take a few minutes.",
    modelsDownloaded: "AI models downloaded.",
    modelsDownloadFailed: "Some models could not be downloaded. Check your internet connection and try again.",
    modelsUnknown: "Could not check installed models.",
    toolsTitle: "Share & reset",
    toolsDesc: "Copy {field} settings to share, paste settings from someone else, or reset to default.",
    export: "Export settings",
    import: "Import settings",
    reset: "Reset field to default",
    needField: "Please select a field first.",
    exportDone: "Settings for {field} copied to clipboard!",
    exportMeta: "Macro version {version} · {date}",
    exportFailed: "Failed to export field settings.",
    importTitle: "Import {field} settings",
    importDesc: "Paste the shared settings below.",
    importPlaceholder: "Paste here…",
    importEmpty: "Please paste settings to import.",
    importDone: "Imported settings for {field}!",
    importFrom: "Imported from field: {field}",
    importVersion: "Macro version: {version}",
    importReplaced: "Some patterns were not found and were replaced: {list}",
    importWarnings: "Warnings: {list}",
    importFailed: "Failed to import field settings. Please check what you pasted.",
    resetTitle: "Reset {field} to default?",
    resetDesc: "All gather settings for this field go back to their defaults. This can't be undone.",
    resetDone: "Reset {field} settings to defaults.",
    resetFailed: "Failed to reset {field}. The field may not exist in the default settings.",
  },
}

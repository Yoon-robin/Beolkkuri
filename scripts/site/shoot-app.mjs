// Takes the landing-page screenshots of the dev UI (http://localhost:5173) with stubbed "live" data.
// Usage: node shoot-app.mjs <out-dir>   then: python to-webp.py <out-dir> ../../site/assets
import puppeteer from "puppeteer-core"
import { CHROME } from "./chrome.mjs"

const OUT = process.argv[2] ?? "out"
const now = Date.now()
const hm = (minAgo) => new Date(now - minAgo * 60000).toTimeString().slice(0, 8)

const LOGS = [
  { time: hm(14), title: "매크로 시작", desc: "일반 모드 · 프로필 default", color: "4ade80" },
  { time: hm(13), title: "부의 시계 수집", desc: "", color: "facc15" },
  { time: hm(11), title: "채집 시작: 소나무 숲", desc: "패턴 skillet · 최대 15분", color: "60a5fa" },
  { time: hm(6), title: "가방 가득 참", desc: "벌집으로 돌아가는 중", color: "f97316" },
  { time: hm(5), title: "꿀로 바꾸는 중", desc: "", color: "facc15" },
  { time: hm(2), title: "무당벌레 처치", desc: "딸기 밭", color: "f87171" },
  { time: hm(1), title: "채집 시작: 소나무 숲", desc: "패턴 skillet · 최대 15분", color: "60a5fa" },
]

const overrides = (runState) => ({
  getRunState: runState,
  getPermissionStatus: { accessibility: true, screenRecording: true, fullKeyboardAccess: false },
  getRecentLogs: LOGS,
  getManualPlanterData: { planters: ["planter of plenty", "petal planter", ""], fields: ["sunflower", "pine tree", ""], harvestTimes: [now / 1000 + 3600 * 2.3, now / 1000 - 60, 0], cycle: 1 },
})

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "shell", pipe: true, protocolTimeout: 90000, args: ["--no-sandbox", "--disable-gpu", "--force-color-profile=srgb", "--lang=ko-KR"] })

async function shot(name, { hash, theme = "dark", runState = 3, width = 1440, height = 900, before }) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 2 })
  await page.setRequestInterception(true)
  const map = overrides(runState)
  page.on("request", (req) => {
    const m = req.url().match(/\/__py\/(\w+)/)
    if (m && m[1] in map) return req.respond({ status: 200, contentType: "application/json", body: JSON.stringify(map[m[1]]) })
    req.continue()
  })
  await page.evaluateOnNewDocument((t) => {
    localStorage.setItem("beolkkuri_theme", t)
    localStorage.setItem("beolkkuri_lang", "ko")
  }, theme)
  // the app polls its backend, so networkidle never settles: wait for load plus a fixed delay
  await page.goto(`http://localhost:5173/${hash}`, { waitUntil: "load" })
  await page.evaluate(() => {
    // the browser preview labels itself as dev mode; the real app doesn't
    for (const el of document.querySelectorAll("header span")) if (el.textContent.includes("·") && el.textContent.length > 12) el.remove()
  })
  await new Promise((r) => setTimeout(r, 2500))
  if (before) await before(page)
  await page.screenshot({ path: `${OUT}/${name}.png` })
  await page.close()
  console.log("saved", name)
}

await shot("home", { hash: "#/home", runState: 2 })
await shot("gather", { hash: "#/gather" })
await shot("guide", { hash: "#/guide" })
await shot("home-light", { hash: "#/home", theme: "light", runState: 2 })
await shot("search", {
  hash: "#/home",
  runState: 2,
  before: async (page) => {
    await page.keyboard.down("Control")
    await page.keyboard.press("k")
    await page.keyboard.up("Control")
    await new Promise((r) => setTimeout(r, 400))
    await page.keyboard.type("디스코드")
    await new Promise((r) => setTimeout(r, 700))
  },
})
await browser.close()

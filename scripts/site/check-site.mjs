// Screenshots the landing page (site/) at desktop and mobile widths and reports horizontal overflow and JS errors.
// Serve it first: python -m http.server 8790 --directory site
// Usage: node check-site.mjs [out-dir]
import puppeteer from "puppeteer-core"
import { CHROME } from "./chrome.mjs"

const OUT = process.argv[2] ?? "out"
const URL = process.env.SITE_URL ?? "http://localhost:8790/"
const SECTIONS = ["top", ".stage", "#hour", "#features", ".c-planter", "#screens", "#install", "#faq", "#final"]
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "shell", pipe: true, protocolTimeout: 90000, args: ["--no-sandbox", "--disable-gpu", "--force-color-profile=srgb", "--lang=ko-KR"] })

async function check(tag, width, height, lang) {
  const page = await browser.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()))
  await page.setViewport({ width, height })
  await page.evaluateOnNewDocument((l) => localStorage.setItem("beolkkuri_site_lang", l), lang)
  await page.goto(URL, { waitUntil: "load" })
  await sleep(1500)
  for (const sel of SECTIONS) {
    // the page uses smooth scrolling, so jump instantly or reveal animations never fire
    await page.evaluate((s) => {
      const el = s === "top" ? null : document.querySelector(s)
      scrollTo({ top: el ? el.getBoundingClientRect().top + scrollY - 70 : 0, behavior: "instant" })
    }, sel)
    await sleep(sel === "#install" ? 7000 : 1500)
    await page.screenshot({ path: `${OUT}/${tag}-${sel.replace(/\W/g, "") || "top"}.png` })
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  console.log(tag, "overflowX:", overflow, "errors:", JSON.stringify(errors))
  await page.close()
}

await check("desktop", 1440, 900, "ko")
await check("mobile", 390, 844, "ko")
await check("desktop-en", 1440, 900, "en")
await browser.close()

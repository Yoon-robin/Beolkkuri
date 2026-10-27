// Renders the brand images from scripts/brand/: the app icon at every size the repo uses, the bare
// bee mascot for the site, and the 1200x630 share card (og.png). Then run `python scripts/make_logo.py`
// for the .ico file.
// Usage: node scripts/site/render-brand.mjs   (og.png needs the internet for the web fonts)
import puppeteer from "puppeteer-core"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { CHROME } from "./chrome.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
const svg = readFileSync(join(ROOT, "scripts/brand/logo.svg"), "utf8")
const ICONS = {
  ".github/logo.png": 512,
  "ui/public/icon.png": 256,
  "src/hourly_report/assets/macro_icon.png": 250,
  "site/assets/logo.png": 256,
  "site/favicon.png": 64,
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "shell", pipe: true, args: ["--no-sandbox", "--disable-gpu", "--force-color-profile=srgb"] })
const page = await browser.newPage()
for (const [rel, size] of Object.entries(ICONS)) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 })
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`)
  await page.screenshot({ path: join(ROOT, rel), omitBackground: true })
  console.log("wrote", rel)
}

// the mascot: same drawing without the tile, cropped to the bee
const mascot = svg.replace('viewBox="0 0 1024 1024"', 'viewBox="138 158 748 748"').replace('<g id="tile-art">', '<g id="tile-art" display="none">')
await page.setViewport({ width: 320, height: 320, deviceScaleFactor: 1 })
await page.setContent(`<html><body style="margin:0;background:transparent">${mascot.replace("<svg ", '<svg width="320" height="320" ')}</body></html>`)
await page.screenshot({ path: join(ROOT, "site/assets/bee.png"), omitBackground: true })
console.log("wrote site/assets/bee.png")

await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
await page.goto(pathToFileURL(join(ROOT, "scripts/brand/og.html")).href, { waitUntil: "networkidle0" })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(ROOT, "site/assets/og.png") })
console.log("wrote site/assets/og.png")
await browser.close()

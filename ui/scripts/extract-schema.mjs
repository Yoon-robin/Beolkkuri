// One-off migration helper: runs the legacy jQuery tab templates inside jsdom and
// records every buildStandardContainer() call, so the React UI can be generated
// from the same setting definitions instead of being retyped by hand.
//
// usage: node scripts/extract-schema.mjs <legacy webapp dir> <output json>
import fs from "node:fs"
import path from "node:path"
import { JSDOM } from "jsdom"

const [legacyDir, outFile] = process.argv.slice(2)
if (!legacyDir || !outFile) {
  console.error("usage: node scripts/extract-schema.mjs <legacy webapp dir> <output json>")
  process.exit(1)
}

const read = (p) => fs.readFileSync(path.join(legacyDir, p), "utf8")
const dom = new JSDOM("<!doctype html><html><body></body></html>", { runScripts: "outside-only" })
const { window } = dom

for (const lib of ["scripts/jquery.js", "scripts/utilities.js", "scripts/ui-builder.js", "scripts/emojis.js", "scripts/memory-match-rewards.js", "scripts/report-buffs.js"]) {
  // Classic-script top-level const/let would stay local to eval; hoist them to globals.
  window.eval(read(lib).replace(/^(const|let) /gm, "var "))
}

// planters.js defines the shared field list some templates use.
try {
  window.eval(read("scripts/tabs/planters.js").replace(/^(const|let) /gm, "var "))
} catch (err) {
  console.warn(`planters.js: ${err.message}`)
}

const sections = []
let currentTab = ""
const original = window.buildStandardContainer
window.buildStandardContainer = function (parentElement, title, desc, settings) {
  const panel = parentElement?.closest?.(".sub-tab-panel") || parentElement
  sections.push({
    tab: currentTab,
    panel: panel?.id || parentElement?.id || "",
    title,
    desc,
    settings: JSON.parse(JSON.stringify(settings)),
  })
  return original.call(this, parentElement, title, desc, settings)
}
// Stubs for helpers the templates call while building.
window.eel = new Proxy({}, { get: () => () => () => Promise.resolve(null) })

const tabsDir = "htmlImports/tabs"
for (const file of fs.readdirSync(path.join(legacyDir, tabsDir)).sort()) {
  currentTab = path.basename(file, ".html")
  const host = window.document.createElement("div")
  host.id = `${currentTab}-placeholder`
  window.document.body.appendChild(host)
  const html = read(path.join(tabsDir, file))
  host.innerHTML = html
  for (const script of host.querySelectorAll("script")) {
    try {
      // Each template declares top-level consts; isolate them per script.
      window.eval(`(function(){\n${script.textContent}\n}).call(window)`)
    } catch (err) {
      console.warn(`[${currentTab}] script failed: ${err.message}`)
    }
  }
}

fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, JSON.stringify(sections, null, 2))
const count = sections.reduce((n, s) => n + s.settings.length, 0)
console.log(`wrote ${sections.length} sections / ${count} settings to ${outFile}`)

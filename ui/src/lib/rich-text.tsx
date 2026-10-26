// Legacy setting titles/descriptions/options contain small bits of HTML
// (icons via <img>, <br>, <b>). Render them with a strict allow-list.
import { useMemo } from "react"

const ALLOWED: Record<string, string[]> = {
  IMG: ["src", "alt", "title"],
  BR: [],
  B: [],
  STRONG: [],
  I: [],
  EM: [],
  SPAN: [],
  CODE: [],
  U: [],
}

function sanitize(html: string) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html")
  const root = doc.body.firstElementChild as HTMLElement
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const allowed = ALLOWED[child.tagName]
      if (!allowed) {
        child.replaceWith(doc.createTextNode(child.textContent ?? ""))
        continue
      }
      for (const attr of Array.from(child.attributes)) {
        if (!allowed.includes(attr.name)) child.removeAttribute(attr.name)
      }
      if (child.tagName === "IMG") {
        const src = child.getAttribute("src") ?? ""
        if (!/^(\.\/|\/)?(assets|hourly-report-assets)\//.test(src) && !src.startsWith("data:image/")) {
          child.remove()
          continue
        }
        child.setAttribute("class", "inline-block size-[1.15em] align-[-0.2em] mx-0.5 object-contain")
        child.setAttribute("draggable", "false")
      }
      walk(child)
    }
  }
  walk(root)
  return root.innerHTML
}

export const hasMarkup = (text: string) => /<[a-z][\s\S]*>/i.test(text)

export function RichText({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => (hasMarkup(text) ? sanitize(text) : null), [text])
  if (html === null) return <span className={className}>{text}</span>
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

/** Plain-text version (for search, aria labels, toasts). */
export function plainText(text: string) {
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

import { useCallback, useEffect, useState } from "react"

export const PAGES = ["home", "gather", "collect", "kill", "boost", "quests", "planters", "tools", "settings", "guide"] as const
export type PageId = (typeof PAGES)[number]

const parse = (): PageId => {
  const id = window.location.hash.replace(/^#\/?/, "").split("/")[0]
  return (PAGES as readonly string[]).includes(id) ? (id as PageId) : "home"
}

/** Tiny hash router: the app is served from a local folder, so no history API routing. */
export function usePage() {
  const [page, setPageState] = useState<PageId>(parse)
  useEffect(() => {
    const onHash = () => setPageState(parse())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])
  const setPage = useCallback((next: PageId) => {
    window.location.hash = `/${next}`
  }, [])
  return [page, setPage] as const
}

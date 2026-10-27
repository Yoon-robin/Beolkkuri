// The app window always runs on the same computer as the macro, so the browser's
// platform tells which OS the macro is on (the dev server preview too).
const platform = typeof navigator === "undefined" ? "" : navigator.platform || navigator.userAgent

export const isMac = /Mac|iPhone|iPad/i.test(platform)
export const isWindows = /Win/i.test(platform)

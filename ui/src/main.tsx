import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./App"
import "./index.css"

// Browser shortcuts that would reload or open devtools mid-run are disabled,
// as in the original app.
window.addEventListener("keydown", (event) => {
  const devtools = event.ctrlKey && event.shiftKey && (event.key === "I" || event.key === "J")
  if (event.key === "F5" || event.key === "F12" || devtools) {
    event.preventDefault()
    event.stopPropagation()
  }
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

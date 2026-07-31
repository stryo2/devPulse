import { useState } from "react"

const STORAGE_KEY = "theme"

const readStoredTheme = () => {
  const value = localStorage.getItem(STORAGE_KEY)

  return value === "light" || value === "dark" ? value : null
}

// Applied at import time, before React renders, so a stored choice is already in
// place on the first paint. With nothing stored the attribute stays absent and
// the prefers-color-scheme rules in index.css keep following the OS.
const storedTheme = readStoredTheme()

if (storedTheme) {
  document.documentElement.dataset.theme = storedTheme
}

const systemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

function ThemeToggle() {
  const [theme, setTheme] = useState(() => storedTheme ?? systemTheme())

  const next = theme === "dark" ? "light" : "dark"

  const toggle = () => {
    document.documentElement.dataset.theme = next
    localStorage.setItem(STORAGE_KEY, next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      className="btn btn--ghost btn--icon"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  )
}

export default ThemeToggle

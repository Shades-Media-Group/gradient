/**
 * Applies the reader's display preferences before the first paint. Load it
 * as a classic, blocking script in <head>, before any stylesheet that reads
 * data-theme: <script src="/preferences-boot.js"></script>
 * Until the reader chooses, <html data-theme-default="light"> (or "dark") sets the theme.
 */
try {
  const prefs = JSON.parse(localStorage.getItem('shades:preferences') || '{}')
  const root = document.documentElement
  const theme = prefs.theme || root.getAttribute('data-theme-default')
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme)
  for (const flag of ['text', 'contrast', 'motion', 'links', 'reading'])
    if (prefs[flag]) root.setAttribute(`data-g-${flag}`, '')
} catch {
  // No storage: the page keeps the system's settings.
}

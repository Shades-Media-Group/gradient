/**
 * Applies the reader's display preferences before the first paint. Load it
 * as a classic, blocking script in <head>, before any stylesheet that reads
 * data-theme: <script src="/preferences-boot.js"></script>
 */
try {
  const prefs = JSON.parse(localStorage.getItem('shades:preferences') || '{}')
  const root = document.documentElement
  if (prefs.theme === 'light' || prefs.theme === 'dark')
    root.setAttribute('data-theme', prefs.theme)
  for (const flag of ['text', 'contrast', 'motion', 'links', 'reading'])
    if (prefs[flag]) root.setAttribute(`data-g-${flag}`, '')
} catch {
  // No storage: the page keeps the system's settings.
}

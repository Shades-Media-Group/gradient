export const REPO = 'https://github.com/Shades-Media-Group/gradient'
export const SHADES = 'https://shades.md'

/** Every `data-link` in the page templates, resolved when the pages are built. */
export const LINKS: Record<string, string> = {
  repo: REPO,
  shades: SHADES,
  npm: 'https://www.npmjs.com/package/shades-gradient',
  pagerecast: 'https://pagerecast.shades.md',
  pagerecastRepo: 'https://github.com/Shades-Media-Group/PageRecast',
  changelog: `${REPO}/blob/main/CHANGELOG.md`,
  issues: `${REPO}/issues/new/choose`,
  security: `${REPO}/blob/main/SECURITY.md`,
  license: `${REPO}/blob/main/LICENSE`,
  trademarks: `${REPO}/blob/main/TRADEMARKS.md`,
  lessons: `${REPO}/blob/main/docs/lessons.md`,
  caseStudy: `${REPO}/blob/main/docs/projects/pagerecast.md`,
  imagereframe: `${REPO}/blob/main/docs/projects/imagereframe.md`,
  newProject: `${REPO}/blob/main/docs/guides/start-a-project.md`,
  contact: 'mailto:support@shades.md',
  preferred: 'https://www.google.com/preferences/source?q=gradient.shades.md',
}

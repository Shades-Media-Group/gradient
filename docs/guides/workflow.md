# How Shades projects are built

Two working rules for every chat that builds a product on Gradient. They sit next to the
[design philosophy](../design-philosophy.md) and the [skills](skills.md): those decide what good
looks like, these decide how the work moves.

## 1. Live first, on the server PC

Each app that runs on the server PC (LMS, Shades CRM, the SocialMonitor dashboard) has its own
**"<App> [Server]"** chat in the shades group, and that chat owns both development and production
for the app.

- **Edit the production checkout:** `~/shades/<repo>` in WSL on the server PC.
- **Make it live at once:** run the repo's `deploy/server/live.sh` (or its equivalent). It runs the
  checks, builds, backs up, switches, checks health and rolls back on its own if the new version is
  unhealthy. Then look at the result in the running app.
- **Commit and push at the end of every prompt:** signed with the PC's key, as
  `git -c user.email=cristian.brinza@shades.md commit`, then `git push`. The Mac and GitHub stay in
  step, and the updater never finds a checkout with local changes.
- **Data goes through the app:** change records through the app's MCP server or its API, never by
  hand in the database. A bad state is undone with the repo's restore script from a backup.
- **Secrets stay on the PC:** in `deploy/.env` (chmod 600), typed by Cristian, never in a chat, a
  log or a commit.

The Mac's chats still build the static sites (gradient, PageRecast, ImageRefold and the product
websites on Cloudflare Workers), and may push app changes too: the PC's updater deploys signed
commits from `main` within a minute.

## 2. Parallel by default

Independent parts of a request run **at the same time**, as background subagents or separate
sessions, never one after another. In Cristian's words: "don't do the first task and then continue
to the second… use agents… in parallel… so you'll not lose time waiting."

- **The main chat coordinates:** it splits the request, starts the parts, keeps talking to Cristian
  while they run, then checks and merges what comes back.
- **Parts that touch the same files go in sequence;** everything else runs side by side. Give each
  parallel agent its own worktree or its own files.
- **Each part ends verified:** tests, the audits, screenshots for anything visual. The main chat
  reports what was checked, not only what was done.
- **Work for another app goes to that app's chat** through `SendMessage`, rather than being done
  from the wrong checkout.

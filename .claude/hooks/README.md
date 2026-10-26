# Claude Code hooks

Wired up in `.claude/settings.json`. They only run when Claude Code works in this repo
(your terminal, the desktop app, or a cloud session); they don't affect your own `git` commands.

| Hook | When | What it does |
| --- | --- | --- |
| `check-edited-file.mjs` | After Claude edits or writes a `.ts/.tsx/.js` file | Runs ESLint on that file and `tsc --noEmit` on the project; errors go back to Claude to fix. Skipped if `node_modules` isn't installed. |
| `check-commit.mjs` | Before Claude runs `git commit` | Blocks a message that doesn't start with a `[Tag]`, and blocks new lines in `src/` or `supabase/` that say "handmade" or "shot on film", or "Kyle" in customer-facing files (admin pages, API routes and `src/lib/admin*` are allowed). Code comments are ignored. |
| `check-pr-review.mjs` | Before Claude opens a pull request (GitHub tool or `gh pr create`) | Blocks the PR until `/ponytail-review` came back clean on the current commit (`--mark` records it). See `CLAUDE.md`. The review itself is the project skill in `.claude/skills/ponytail-review/`. |

To change a rule, edit the script (the banned words are the `BANNED_*` lists near the top of
`check-commit.mjs`) and commit it like any other file. To add or remove a hook, edit
`.claude/settings.json`, or run `/hooks` inside Claude Code. Changes apply to the next session.

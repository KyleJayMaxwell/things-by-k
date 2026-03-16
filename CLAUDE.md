# CLAUDE.md — Session Memory Protocol

This file instructs Claude how to use the `/memory` directory to maintain continuity across sessions.

---

## On Session Start

Read all four memory files before doing anything else:

```
/memory/user.md        — who the user is, their background and active projects
/memory/people.md      — people mentioned across sessions
/memory/preferences.md — how the user likes things done
/memory/decisions.md   — past decisions, technical choices, things ruled out
```

Use this context silently to inform every response. Do not announce that you've read the files — just act as if you already know this about the user.

---

## During a Session

Notice and mentally flag:
- New facts about the user (role, project, background)
- Preferences revealed (style choices, tool preferences, tone)
- People introduced
- Decisions made or approaches agreed upon

---

## On Session End

When the user signals they're wrapping up (or when it's naturally a good moment), update the relevant files:

- **user.md** — new stable facts about the user
- **people.md** — new people, or updated context on existing ones
- **preferences.md** — confirmed or new preferences
- **decisions.md** — any significant decisions with date, reasoning, and alternatives

### Update format for decisions.md

```markdown
## YYYY-MM-DD — [Short title]
- **Decision**: ...
- **Reasoning**: ...
- **Alternatives considered**: ...
```

---

## Principles

- Keep entries concise — these files should stay scannable
- Prefer updating existing entries over creating duplicates
- Never store sensitive data (passwords, keys, private credentials)
- If unsure whether something is worth recording, err on the side of noting it

---

*This file lives at the root of the project. The `/memory` directory holds the actual data.*
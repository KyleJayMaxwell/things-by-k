#!/usr/bin/env node
// PreToolUse hook (Bash): runs only for `git commit`. Blocks the commit (exit 2,
// reason sent back to Claude) when
//   1. the message doesn't start with a [Tag], e.g. "[MVP] Add cart page"
//   2. the changes being committed add banned shop copy
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const input = JSON.parse(readFileSync(0, 'utf8') || '{}')
const command = input.tool_input?.command ?? ''
if (!/\bgit\s+(?:-C\s+\S+\s+)?commit\b/.test(command)) process.exit(0)

const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
const problems = []

// --- 1. Commit message tag ---------------------------------------------------

// Pulls the message out of the common forms: -m "..", -m '..', --message=..,
// -am "..", and -m "$(cat <<'EOF' ... EOF)". Returns null when there is no
// inline message (editor, -F file, --no-edit), which we leave alone.
function commitMessage(cmd) {
  const heredoc = cmd.match(/<<-?\s*['"]?(\w+)['"]?\s*\n([\s\S]*?)\n\s*\1\b/)
  if (heredoc) return heredoc[2]
  const flag = cmd.match(/(?:\s-[a-zA-Z]*m|\s--message)(?:\s+|=)("((?:\\.|[^"\\])*)"|'([^']*)'|(\S+))/)
  if (!flag) return null
  return flag[2] ?? flag[3] ?? flag[4]
}

const message = commitMessage(command)
if (message !== null) {
  const subject = message.trim().split('\n')[0]
  if (!/^\[[^\]\s][^\]]*\]\s+\S/.test(subject) && !/^Merge\b/.test(subject)) {
    problems.push(
      `Commit message must start with a tag in square brackets, e.g. "[MVP] Add cart page".\n` +
        `Got: "${subject}"`,
    )
  }
}

// --- 2. Banned shop copy -----------------------------------------------------

const git = (args) =>
  spawnSync('git', args, { cwd: projectDir, encoding: 'utf8', timeout: 10_000 }).stdout ?? ''

// Never fine anywhere in the site source.
const BANNED_EVERYWHERE = [
  { re: /\bhand[\s-]?made\b/i, why: 'say "designed" or "made with intention and thought", not "handmade"' },
  { re: /\bshot on film\b/i, why: 'say "original photograph", not "shot on film"' },
]
// Only banned in customer-facing copy (admin pages, API routes, config and
// the admin allow-list can mention the owner by name).
const BANNED_IN_COPY = [{ re: /\bkyle\b/i, why: "don't use the owner's name in site copy" }]

const isSiteSource = (f) => /^(src|supabase)\//.test(f) && !/\.(png|jpe?g|gif|webp|ico|svg|woff2?|ttf|otf)$/i.test(f)
const isCustomerCopy = (f) =>
  /^src\//.test(f) &&
  !/^src\/(app\/admin|components\/admin|app\/api)\//.test(f) &&
  !/^src\/lib\/admin/.test(f) &&
  !/^src\/proxy\.ts$/.test(f)
const isComment = (line) => /^\s*(\/\/|\/\*|\*|\{\s*\/\*|--)/.test(line)

// Check added lines in everything that could land in this commit: staged and
// unstaged tracked changes (covers `git add . && git commit` and `commit -a`)
// plus new untracked files. Existing lines aren't re-flagged.
const added = [] // { file, line }
let file = null
for (const line of git(['diff', 'HEAD', '--unified=0', '--no-color', '--no-ext-diff']).split('\n')) {
  if (line.startsWith('+++ ')) file = line.startsWith('+++ b/') ? line.slice(6) : null
  else if (file && line.startsWith('+')) added.push({ file, line: line.slice(1) })
}
for (const f of git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)) {
  if (!isSiteSource(f)) continue
  try {
    for (const line of readFileSync(`${projectDir}/${f}`, 'utf8').split('\n')) added.push({ file: f, line })
  } catch {}
}

const hits = []
for (const { file: f, line } of added) {
  if (!isSiteSource(f) || isComment(line)) continue
  const rules = isCustomerCopy(f) ? [...BANNED_EVERYWHERE, ...BANNED_IN_COPY] : BANNED_EVERYWHERE
  for (const { re, why } of rules) {
    if (re.test(line)) hits.push(`  ${f}: ${line.trim().slice(0, 120)}\n    → ${why}`)
  }
}
if (hits.length) problems.push(`Banned shop copy in this commit:\n${hits.join('\n')}`)

if (problems.length) {
  console.error(`Commit blocked.\n\n${problems.join('\n\n')}`)
  process.exit(2)
}

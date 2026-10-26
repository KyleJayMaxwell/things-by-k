#!/usr/bin/env node
// PreToolUse hook (Bash + GitHub create_pull_request): blocks opening a PR
// until a ponytail review of the current commit came back clean.
//
// After /ponytail-review says "Verdict: Ship." on the branch, Claude runs
//   node .claude/hooks/check-pr-review.mjs --mark
// which records HEAD. Any later commit needs a new review before the PR.
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const marking = process.argv.includes('--mark')
// Runs before every Bash command, so leave everything but `gh pr create` fast.
const input = marking ? {} : JSON.parse(readFileSync(0, 'utf8') || '{}')
if (input.tool_name === 'Bash' && !/\bgh\s+pr\s+create\b/.test(input.tool_input?.command ?? '')) process.exit(0)

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const git = (args) =>
  (spawnSync('git', args, { cwd: projectDir, encoding: 'utf8', timeout: 10_000 }).stdout ?? '').trim()
const head = git(['rev-parse', 'HEAD'])
const marker = git(['rev-parse', '--path-format=absolute', '--git-path', 'ponytail-reviewed'])

if (marking) {
  writeFileSync(marker, head + '\n')
  console.log(`Marked ${head.slice(0, 7)} as ponytail-reviewed.`)
  process.exit(0)
}

let reviewed = ''
try {
  reviewed = readFileSync(marker, 'utf8').trim()
} catch {}
if (reviewed && reviewed === head) process.exit(0)

console.error(
  (reviewed ? `The last ponytail review was of ${reviewed.slice(0, 7)}, but HEAD is now ${head.slice(0, 7)}.\n` : '') +
    'Run /ponytail-review on this branch (git diff origin/main...HEAD), fix every "Must fix" and ' +
    '"Should fix" finding, commit, and review again until it says "Verdict: Ship." Then run ' +
    '`node .claude/hooks/check-pr-review.mjs --mark` and open the PR. See CLAUDE.md.',
)
process.exit(2)

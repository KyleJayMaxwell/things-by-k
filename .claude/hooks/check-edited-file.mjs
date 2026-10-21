#!/usr/bin/env node
// PostToolUse hook (Edit/Write/MultiEdit): lint the edited file and typecheck
// the project. Problems are sent back to Claude (exit 2) so it fixes them
// before moving on. Skips quietly when there is nothing to check.
import { execFile } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const input = JSON.parse(readFileSync(0, 'utf8') || '{}')
const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
const filePath = input.tool_input?.file_path
if (!filePath) process.exit(0)

const rel = path.relative(projectDir, path.resolve(projectDir, filePath))
const outsideProject = rel.startsWith('..') || path.isAbsolute(rel)
if (outsideProject || !/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(rel)) process.exit(0)
if (rel.startsWith('node_modules') || rel.startsWith('.next') || rel.startsWith('.claude')) process.exit(0)

const bin = (name) => path.join(projectDir, 'node_modules', '.bin', name)
// No install yet (fresh clone): nothing to run, so don't block edits.
if (!existsSync(bin('eslint')) || !existsSync(bin('tsc'))) process.exit(0)

const run = (cmd, args) =>
  new Promise((resolve) =>
    execFile(cmd, args, { cwd: projectDir, timeout: 60_000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) =>
      resolve({ ok: !err, output: (stdout + stderr).trim() }),
    ),
  )

// Run both at once to keep edits snappy. tsconfig has incremental on, so
// repeat typechecks only recheck what changed.
const [lint, tsc] = await Promise.all([
  run(bin('eslint'), ['--no-warn-ignored', rel]),
  run(bin('tsc'), ['--noEmit', '--pretty', 'false']),
])

const problems = []
if (!lint.ok) problems.push(`ESLint (${rel}):\n${lint.output}`)
if (!tsc.ok) problems.push(`TypeScript:\n${tsc.output}`)

if (problems.length) {
  const report = problems.join('\n\n')
  const trimmed = report.length > 6000 ? `${report.slice(0, 6000)}\n… (truncated)` : report
  console.error(`Lint/typecheck failed after editing ${rel}. Fix these:\n\n${trimmed}`)
  process.exit(2)
}

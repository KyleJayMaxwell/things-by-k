// mock/dev.mjs
// `npm run dev:mock`: starts the mock Supabase, then `next dev` pointed at it.
// These variables win over .env.local, so the real database is never touched.

import { spawn } from 'node:child_process'
import { MOCK_PORT, startMockSupabase } from './server.mjs'

await startMockSupabase()

const env = {
  ...process.env,
  MOCK_DATA: '1',
  NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${MOCK_PORT}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key',
  NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
}

console.log(`
  Mock data on: 18 products and 12 orders, saved in memory until you stop the server.
  Sign in with any email and password. Use the admin email to see /admin.
`)

const next = spawn('npx', ['next', 'dev', ...process.argv.slice(2)], { env, stdio: 'inherit' })
next.on('exit', code => process.exit(code ?? 0))
process.on('SIGINT', () => next.kill('SIGINT'))
process.on('SIGTERM', () => next.kill('SIGTERM'))

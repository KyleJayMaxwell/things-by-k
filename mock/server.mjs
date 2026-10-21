// mock/server.mjs
// A small stand-in for Supabase, so the shop runs locally with sample data (`npm run dev:mock`).
// It answers the slice of the REST, Auth and Storage APIs the site uses. Data lives in memory
// and resets every time it starts. Any email and password signs in.

import http from 'node:http'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { buildData } from './data.mjs'

export const MOCK_PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54321)
const BASE = `http://localhost:${MOCK_PORT}`
const BUCKET_PATH = '/storage/v1/object/public/product-images/'
const IMAGES_DIR = new URL('./images/', import.meta.url)

const db = buildData(`${BASE}${BUCKET_PATH}mock`)
const uploads = new Map()  // storage path -> { type, body } for photos added in /admin
let nextOrderNumber = db.orders.length + 1

// ── Helpers ───────────────────────────────────────────────────────────────────

const uuidFrom = text => {
  const h = createHash('sha1').update(text).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`
}
const randomId = () => uuidFrom(`${Date.now()}-${Math.random()}`)

function setSearchText(product) {
  product.search_text = [product.name, product.description, product.long_description, ...(product.locations ?? [])]
    .join(' ').toLowerCase()
  return product
}
db.products.forEach(setSearchText)

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json', ...headers })
  res.end(body === undefined ? '' : JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

// ── PostgREST: filters ────────────────────────────────────────────────────────

// Splits on commas that aren't inside parentheses or braces
function splitTop(text) {
  const parts = []
  let depth = 0, current = ''
  for (const ch of text) {
    if ('({'.includes(ch)) depth++
    if (')}'.includes(ch)) depth--
    if (ch === ',' && depth === 0) { parts.push(current); current = '' } else current += ch
  }
  if (current) parts.push(current)
  return parts.map(p => p.trim())
}

function columnValue(row, column) {
  const [col, key] = column.split('->>')
  return key ? row[col]?.[key] : row[col]
}

// SQL LIKE pattern to a regex: % and * match anything, _ matches one character, \ escapes
function likeToRegex(pattern, flags) {
  let source = ''
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    if (ch === '\\' && i + 1 < pattern.length) source += pattern[++i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    else if (ch === '%' || ch === '*') source += '.*'
    else if (ch === '_') source += '.'
    else source += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${source}$`, `s${flags ?? ''}`)
}

const unquote = v => v.replace(/^"(.*)"$/, '$1')
const asComparable = v => (typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v) ? Date.parse(v) : typeof v === 'string' && v !== '' && !isNaN(v) ? Number(v) : v)

// One test like `price=gte.300`: column, operator and value
function matches(row, column, expression) {
  const negate = expression.startsWith('not.')
  if (negate) expression = expression.slice(4)
  const dot = expression.indexOf('.')
  const op = expression.slice(0, dot)
  const raw = expression.slice(dot + 1)
  const value = columnValue(row, column)
  let ok
  switch (op) {
    case 'eq': ok = String(value) === unquote(raw); break
    case 'neq': ok = String(value) !== unquote(raw); break
    case 'gt': ok = asComparable(value) > asComparable(raw); break
    case 'gte': ok = asComparable(value) >= asComparable(raw); break
    case 'lt': ok = asComparable(value) < asComparable(raw); break
    case 'lte': ok = asComparable(value) <= asComparable(raw); break
    case 'like': ok = value != null && likeToRegex(raw).test(String(value)); break
    case 'ilike': ok = value != null && likeToRegex(raw, 'i').test(String(value)); break
    case 'is': ok = raw === 'null' ? value == null : String(value) === raw; break
    case 'in': ok = splitTop(raw.slice(1, -1)).map(unquote).includes(String(value)); break
    case 'cs': ok = splitTop(raw.slice(1, -1)).map(unquote).every(v => (value ?? []).includes(v)); break
    default: throw new Error(`mock: unsupported filter ${op}`)
  }
  return negate ? !ok : ok
}

// `or=(a.eq.1,b.ilike.%x%)` style groups
function matchesOr(row, group) {
  return splitTop(group.slice(1, -1)).some(part => {
    const [, column, expression] = part.match(/^([^.]+)\.(.*)$/)
    return matches(row, column, expression)
  })
}

const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns'])

function applyFilters(rows, params) {
  return rows.filter(row => {
    for (const [key, value] of params) {
      if (RESERVED.has(key)) continue
      if (key === 'or' ? !matchesOr(row, value) : !matches(row, key, value)) return false
    }
    return true
  })
}

// ── PostgREST: select, embeds and ordering ────────────────────────────────────

// Child tables reachable from a parent row, by foreign key
const RELATIONS = { order_items: { parent: 'orders', key: 'order_id' } }

function shape(row, table, select = '*') {
  const out = {}
  for (const field of splitTop(select)) {
    const embed = field.match(/^(\w+)\((.*)\)$/)
    if (embed) {
      const [, child, childSelect] = embed
      const relation = RELATIONS[child]
      if (relation?.parent !== table) throw new Error(`mock: unknown embed ${child} on ${table}`)
      out[child] = db[child].filter(c => c[relation.key] === row.id).map(c => shape(c, child, childSelect))
    } else if (field === '*') {
      Object.assign(out, row)
    } else {
      out[field] = row[field]
    }
  }
  return out
}

function sortRows(rows, order) {
  if (!order) return rows
  const keys = order.split(',').map(part => {
    const [column, dir = 'asc'] = part.split('.')
    return { column, desc: dir === 'desc' }
  })
  return [...rows].sort((a, b) => {
    for (const { column, desc } of keys) {
      const x = asComparable(a[column]), y = asComparable(b[column])
      if (x === y) continue
      if (x == null) return 1
      if (y == null) return -1
      const result = typeof x === 'string' ? x.localeCompare(y) : x < y ? -1 : 1
      return desc ? -result : result
    }
    return 0
  })
}

// ── PostgREST: request handling ───────────────────────────────────────────────

async function handleRest(req, res, url) {
  const [, , , table, fn] = url.pathname.split('/')  // /rest/v1/<table> or /rest/v1/rpc/<fn>
  const params = [...url.searchParams]
  const prefer = req.headers.prefer ?? ''
  const single = (req.headers.accept ?? '').includes('vnd.pgrst.object')

  if (table === 'rpc') return handleRpc(res, fn, JSON.parse((await readBody(req)).toString() || '{}'))
  if (!db[table]) return send(res, 404, { code: '42P01', message: `relation "${table}" does not exist` })

  const reply = (rows, status = 200) => {
    const select = url.searchParams.get('select') ?? '*'
    const shaped = rows.map(row => shape(row, table, select))
    if (single) {
      if (shaped.length !== 1) {
        return send(res, 406, { code: 'PGRST116', details: `The result contains ${shaped.length} rows`, message: 'JSON object requested, multiple (or no) rows returned' })
      }
      return send(res, status, shaped[0])
    }
    send(res, status, shaped)
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    const filtered = sortRows(applyFilters(db[table], params), url.searchParams.get('order'))
    const offset = Number(url.searchParams.get('offset') ?? 0)
    const limit = url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : Infinity
    if (offset > 0 && offset >= filtered.length) {
      return send(res, 416, { code: 'PGRST103', message: 'Requested range not satisfiable' })
    }
    const page = filtered.slice(offset, offset + limit)
    const total = prefer.includes('count=') ? filtered.length : '*'
    const range = page.length ? `${offset}-${offset + page.length - 1}/${total}` : `*/${total}`
    if (req.method === 'HEAD') return send(res, 200, undefined, { 'content-range': range })
    res.setHeader('content-range', range)
    return reply(page)
  }

  const returnRows = prefer.includes('return=representation')
  const finish = (rows, status) => (returnRows ? reply(rows, status) : send(res, 204))

  if (req.method === 'POST') {
    const body = JSON.parse((await readBody(req)).toString())
    const now = new Date().toISOString()
    const inserted = (Array.isArray(body) ? body : [body]).map(values => {
      const row = { id: randomId(), created_at: now, ...values }
      if (table === 'products') setSearchText(Object.assign(row, { updated_at: now }))
      db[table].push(row)
      return row
    })
    return finish(inserted, 201)
  }

  if (req.method === 'PATCH') {
    const changes = JSON.parse((await readBody(req)).toString())
    const updated = applyFilters(db[table], params)
    updated.forEach(row => {
      Object.assign(row, changes)
      if (table === 'products') setSearchText(Object.assign(row, { updated_at: new Date().toISOString() }))
    })
    return finish(updated, 200)
  }

  if (req.method === 'DELETE') {
    const removed = applyFilters(db[table], params)
    db[table] = db[table].filter(row => !removed.includes(row))
    if (table === 'orders') db.order_items = db.order_items.filter(item => !removed.some(o => o.id === item.order_id))
    return finish(removed, 200)
  }

  send(res, 405, { message: 'Method not allowed' })
}

function handleRpc(res, fn, args) {
  if (fn === 'generate_order_number') {
    return send(res, 200, `TBK-${String(nextOrderNumber++).padStart(5, '0')}`)
  }
  if (fn === 'decrement_stock') {
    const product = db.products.find(p => p.id === args.p_product_id)
    if (product) product.stock = Math.max(0, product.stock - args.p_quantity)
    return send(res, 204)
  }
  send(res, 404, { code: 'PGRST202', message: `Could not find the function public.${fn}` })
}

// ── Auth: any email and password signs in ─────────────────────────────────────

const b64url = value => Buffer.from(JSON.stringify(value)).toString('base64url')

function userFor(email) {
  const id = uuidFrom(email.toLowerCase())
  const firstName = db.profiles.find(p => p.id === id)?.first_name
  return {
    id, aud: 'authenticated', role: 'authenticated', email,
    email_confirmed_at: '2026-01-01T00:00:00Z', confirmed_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: firstName ? { first_name: firstName } : {},
    identities: [{ id, user_id: id, provider: 'email', identity_data: { email, sub: id } }],
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  }
}

function ensureProfile(email, firstName) {
  const id = uuidFrom(email.toLowerCase())
  const existing = db.profiles.find(p => p.id === id)
  if (existing) {
    if (firstName) existing.first_name = firstName
  } else {
    const fallback = email.split('@')[0].replace(/[^a-z]/gi, ' ').trim()
    db.profiles.push({ id, first_name: firstName || fallback.charAt(0).toUpperCase() + fallback.slice(1), created_at: new Date().toISOString() })
  }
}

function sessionFor(email) {
  const user = userFor(email)
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 60 * 60 * 24 * 7
  const access_token = [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: user.id, email, aud: 'authenticated', role: 'authenticated', iat, exp, session_id: user.id }),
    'mock-signature',
  ].join('.')
  return {
    access_token, token_type: 'bearer', expires_in: exp - iat, expires_at: exp,
    refresh_token: Buffer.from(email).toString('base64url'), user,
  }
}

function emailFromToken(req) {
  const token = (req.headers.authorization ?? '').replace(/^Bearer /i, '')
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).email ?? null
  } catch {
    return null
  }
}

async function handleAuth(req, res, url) {
  const route = url.pathname.replace('/auth/v1/', '')
  const body = req.method === 'GET' ? {} : JSON.parse((await readBody(req)).toString() || '{}')

  if (route === 'token') {
    const grant = url.searchParams.get('grant_type')
    const email = grant === 'refresh_token' ? Buffer.from(body.refresh_token ?? '', 'base64url').toString() : body.email
    if (!email) return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' })
    ensureProfile(email)
    return send(res, 200, sessionFor(email))
  }
  if (route === 'signup') {
    ensureProfile(body.email, body.data?.first_name)
    return send(res, 200, userFor(body.email))  // no session: the real site asks people to confirm by email first
  }
  if (route === 'user') {
    const email = emailFromToken(req)
    if (!email) return send(res, 401, { code: 401, error_code: 'no_authorization', msg: 'This endpoint requires a valid Bearer token' })
    return send(res, 200, userFor(email))
  }
  if (route === 'verify') return send(res, 200, sessionFor(body.email ?? 'customer@example.com'))
  if (route === 'logout') return send(res, 204)
  if (route === 'recover' || route === 'otp') return send(res, 200, {})
  send(res, 404, { msg: `mock: auth route ${route} not handled` })
}

// ── Storage: product photos ───────────────────────────────────────────────────

async function handleStorage(req, res, url) {
  if (url.pathname.startsWith(BUCKET_PATH)) {
    const path = decodeURIComponent(url.pathname.slice(BUCKET_PATH.length))
    const upload = uploads.get(path)
    if (upload) {
      res.writeHead(200, { 'content-type': upload.type })
      return res.end(upload.body)
    }
    if (path.startsWith('mock/') && /^[\w-]+\.jpg$/.test(path.slice(5))) {
      try {
        const file = await readFile(new URL(path.slice(5), IMAGES_DIR))
        res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=3600' })
        return res.end(file)
      } catch { /* falls through to not found */ }
    }
    return send(res, 404, { statusCode: '404', error: 'not_found', message: 'Object not found' })
  }

  const objectPath = url.pathname.replace('/storage/v1/object/', '')
  if (req.method === 'POST' || req.method === 'PUT') {
    const path = objectPath.replace(/^product-images\//, '')
    uploads.set(path, { type: req.headers['content-type'] ?? 'application/octet-stream', body: await readBody(req) })
    return send(res, 200, { Key: objectPath, Id: randomId() })
  }
  if (req.method === 'DELETE') {
    const { prefixes = [] } = JSON.parse((await readBody(req)).toString() || '{}')
    prefixes.forEach(p => uploads.delete(p))
    return send(res, 200, prefixes.map(name => ({ name })))
  }
  send(res, 404, { message: 'mock: storage route not handled' })
}

// ── Server ────────────────────────────────────────────────────────────────────

export function startMockSupabase() {
  const server = http.createServer(async (req, res) => {
    // The admin overview and sign-in run in the browser, so allow calls from the local site
    res.setHeader('access-control-allow-origin', req.headers.origin ?? '*')
    res.setHeader('access-control-allow-credentials', 'true')
    res.setHeader('access-control-allow-methods', 'GET,HEAD,POST,PATCH,PUT,DELETE,OPTIONS')
    res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers'] ?? '*')
    res.setHeader('access-control-expose-headers', 'content-range')
    if (req.method === 'OPTIONS') return send(res, 204)

    const url = new URL(req.url, BASE)
    try {
      if (url.pathname.startsWith('/rest/v1/')) return await handleRest(req, res, url)
      if (url.pathname.startsWith('/auth/v1/')) return await handleAuth(req, res, url)
      if (url.pathname.startsWith('/storage/v1/')) return await handleStorage(req, res, url)
      send(res, 404, { message: 'mock: not found' })
    } catch (error) {
      console.error('[mock-supabase]', req.method, req.url, error)
      send(res, 500, { code: 'MOCK', message: error.message })
    }
  })
  return new Promise(resolve => server.listen(MOCK_PORT, () => resolve(server)))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startMockSupabase().then(() => console.log(`Mock Supabase on ${BASE}`))
}

// src/lib/redirect.test.mjs
// Run with `npm test` (Node's built-in test runner; Node 22.18+ reads the .ts import directly)

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeRedirectPath } from './redirect.ts'

test('keeps paths on this site', () => {
  assert.equal(safeRedirectPath('/cart', '/account'), '/cart')
  assert.equal(safeRedirectPath('/account/orders/abc?x=1#top', '/account'), '/account/orders/abc?x=1#top')
})

test('rejects anything that would leave the site', () => {
  for (const evil of ['//evil.com', '/\\evil.com', '/\t/evil.com', '/\n/evil.com', 'https://evil.com', 'javascript:alert(1)', '', null, undefined]) {
    assert.equal(safeRedirectPath(evil, '/account'), '/account', JSON.stringify(evil))
  }
})

import test from 'node:test'
import assert from 'node:assert/strict'
import { createBackendReadiness } from '../src/lib/backendReadiness.js'

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const storage = { getItem: () => null }
globalThis.sessionStorage = storage
globalThis.localStorage = storage
let moduleIndex = 0
const client = () => import(`../src/lib/api.js?test=${moduleIndex++}`)

test('simultaneous requests share a probe, recent requests skip it, idle requests check again', async (t) => {
  let now = 100_000
  t.mock.method(Date, 'now', () => now)
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url) => { calls.push(url); return new Response('ok') })
  const readiness = createBackendReadiness('/api')
  await Promise.all([readiness.wait(), readiness.wait(), readiness.wait()])
  assert.equal(calls.length, 1)
  await readiness.wait()
  assert.equal(calls.length, 1)
  now += 31_000
  await readiness.wait()
  assert.equal(calls.length, 2)
})

test('GET recovers from a gateway failure before returning data', async (t) => {
  const calls = []
  let reads = 0
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(url)
    if (url.endsWith('/up')) return new Response('ready')
    return ++reads === 1 ? new Response('Unavailable', { status: 503 }) : json({ saved: true })
  })
  const { api } = await client()
  assert.deepEqual(await api('/wallets'), { saved: true })
  assert.deepEqual(calls, ['/api/up', '/api/wallets', '/api/up', '/api/wallets'])
})

test('writes are never repeated even if the response is lost or unavailable', async (t) => {
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    for (const networkFailure of [false, true]) {
      let writes = 0
      t.mock.method(globalThis, 'fetch', async (url) => {
        if (url.endsWith('/up')) return new Response('ready')
        writes += 1
        if (networkFailure) throw new TypeError('Failed to fetch')
        return json({ error: 'Unavailable' }, 503)
      })
      const { api } = await client()
      await assert.rejects(api('/transactions', { method, body: { transaction: {} } }))
      assert.equal(writes, 1)
    }
  }
})

test('failed health checks time out without submitting a form', async (t) => {
  let now = 100_000
  t.mock.method(Date, 'now', () => now)
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(url)
    now += 61_000
    return new Response('Unavailable', { status: 503 })
  })
  const { api } = await client()
  await assert.rejects(api('/transactions', { method: 'POST', body: {} }))
  assert.deepEqual(calls, ['/api/up'])
})

test('cancelling one reader does not cancel another readers shared wake-up', async (t) => {
  let complete
  let probes = 0
  t.mock.method(globalThis, 'fetch', () => { probes += 1; return new Promise((resolve) => { complete = resolve }) })
  const readiness = createBackendReadiness('/api')
  const controller = new AbortController()
  const cancelled = readiness.wait(controller.signal)
  const waiting = readiness.wait()
  controller.abort()
  await assert.rejects(cancelled, { name: 'AbortError' })
  complete(new Response('ready'))
  await waiting
  assert.equal(probes, 1)
})

test('an expired token remains an authentication error, without GET retries', async (t) => {
  let requests = 0
  t.mock.method(globalThis, 'fetch', async (url) => {
    if (url.endsWith('/up')) return new Response('ready')
    requests += 1
    return json({ error: 'Unauthorized' }, 401)
  })
  const { api } = await client()
  await assert.rejects(api('/me'), { status: 401 })
  assert.equal(requests, 1)
})

test('a sleeping health endpoint is retried before the single form submission', async (t) => {
  const calls = []
  let probes = 0
  t.mock.method(globalThis, 'fetch', async (url) => {
    calls.push(url)
    if (url.endsWith('/up')) {
      return ++probes === 1 ? new Response('Starting', { status: 503 }) : new Response('ready')
    }
    return json({ id: 1 }, 201)
  })
  const { api } = await client()
  assert.deepEqual(await api('/transactions', { method: 'POST', body: { transaction: {} } }), { id: 1 })
  assert.deepEqual(calls, ['/api/up', '/api/up', '/api/transactions'])
})

import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createVercelAiHandler } from '../api/ai.js';
import { createMemorySessionStore } from './session-store.mjs';

async function fixture(t, options = {}) {
  const handler = createVercelAiHandler({ sessionStore: createMemorySessionStore(), ...options });
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = 'http://127.0.0.1:' + server.address().port;
  return { base, request: (path, options) => fetch(base + path, options) };
}

test('Vercel original and rewritten paths preserve JSON, settings, and streaming research', async t => {
  const { request } = await fixture(t, {
    fetchImpl: async () => Response.json({ output: [{ type: 'message', content: [{ type: 'output_text', text: 'OK' }] }] }),
  });
  const status = await request('/api/ai?endpoint=status', { headers: { 'x-forwarded-proto': 'https' } });
  assert.equal(status.status, 200);
  assert.equal((await status.json()).configured, false);
  const setCookie = status.headers.get('set-cookie');
  assert.match(setCookie, /HttpOnly; SameSite=Strict; Path=\/; Max-Age=43200; Secure/);
  const cookie = setCookie.split(';')[0];
  const headers = { Cookie: cookie, 'Content-Type': 'application/json' };
  const research = await request('/api/ai?endpoint=research', {
    method: 'POST', headers, body: JSON.stringify({ question: 'Microsoft GCC Hyderabad' }),
  });
  assert.equal(research.status, 200);
  assert.match(research.headers.get('content-type'), /application\/x-ndjson/);
  const events = (await research.text()).trim().split('\n').map(JSON.parse);
  assert.equal(events[0].stage, 'local');
  assert.equal(events[0].results.some(item => item.title === 'Microsoft'), true);
  assert.equal(events.at(-1).stage, 'done');
  const saved = await request('/api/ai?endpoint=settings', {
    method: 'POST', headers, body: JSON.stringify({ provider: 'openai', apiKey: 'sk-fixture-12345678901234567890', model: 'fixture-model' }),
  });
  assert.equal(saved.status, 200);
  const savedText = await saved.text();
  assert.equal(savedText.includes('sk-fixture'), false);
  assert.equal(JSON.parse(savedText).configured, true);
  const direct = await request('/api/ai/status', { headers: { Cookie: cookie } });
  assert.equal((await direct.json()).provider, 'openai');
  const removed = await request('/api/ai?endpoint=settings', {
    method: 'DELETE', headers, body: JSON.stringify({ provider: 'openai' }),
  });
  assert.equal((await removed.json()).configured, false);
});

test('Vercel handler rejects unknown routes, unsafe origins, methods, and malformed bodies', async t => {
  const { request } = await fixture(t);
  for (const path of ['/api/ai?endpoint=missing', '/api/ai?endpoint=settings/extra', '/api/ai', '/elsewhere?endpoint=status']) {
    const response = await request(path);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).error, 'AI endpoint not found.');
  }
  const crossOrigin = await request('/api/ai?endpoint=status', { headers: { Origin: 'https://other.example' } });
  assert.equal(crossOrigin.status, 403);
  const wrongMethod = await request('/api/ai?endpoint=settings', { method: 'PUT' });
  assert.equal(wrongMethod.status, 405);
  for (const endpoint of ['settings', 'research']) {
    const invalid = await request('/api/ai?endpoint=' + endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    });
    assert.equal(invalid.status, 400);
  }
  const oversized = await request('/api/ai?endpoint=settings', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: 'x'.repeat(50001) }),
  });
  assert.equal(oversized.status, 413);
});

test('session write failures are caught and return JSON instead of leaving requests open', async t => {
  const { request } = await fixture(t, {
    sessionStore: { get: async () => null, update: async () => { throw Object.assign(new Error('Storage unavailable.'), { status: 503 }); } },
  });
  const response = await request('/api/ai?endpoint=status');
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'Storage unavailable.' });
});

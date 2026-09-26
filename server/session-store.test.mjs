import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemorySessionStore, createRedisSessionStore, createSessionStore, SESSION_MS } from './session-store.mjs';

function redisFixture() {
  const values = new Map();
  const writes = [];
  const fetchImpl = async (url, options) => {
    assert.equal(new URL(url).protocol, 'https:');
    assert.equal(options.headers.Authorization, 'Bearer fixture-redis-token');
    const command = JSON.parse(options.body);
    let result;
    if (command[0] === 'GET') result = values.get(command[1]) || null;
    else {
      assert.equal(command[0], 'EVAL');
      assert.equal(command[2], 1);
      const [, , , key, expected, value, ttl] = command;
      assert.equal(ttl, SESSION_MS);
      if ((values.get(key) || '') === expected) { values.set(key, value); writes.push(value); result = 1; }
      else result = 0;
    }
    return Response.json({ result });
  };
  const options = { url: 'https://fixture.upstash.io', token: 'fixture-redis-token', secret: 'ab'.repeat(32), fetchImpl };
  return { options, values, writes };
}
const saveProvider = provider => current => ({
  ...current, credentials: { ...current.credentials, [provider]: { key: 'secret-provider-key-' + provider, model: 'fixture-model' } },
  active: provider, revision: current.revision + 1,
});

test('independent server instances retain encrypted keys and simultaneous saves', async () => {
  const fixture = redisFixture();
  const first = createRedisSessionStore(fixture.options);
  const second = createRedisSessionStore(fixture.options);
  await first.update('session-one', current => current);
  await Promise.all([first.update('session-one', saveProvider('openai')), second.update('session-one', saveProvider('gemini'))]);
  const restarted = createRedisSessionStore(fixture.options);
  const saved = await restarted.get('session-one');
  assert.deepEqual(Object.keys(saved.credentials).sort(), ['gemini', 'openai']);
  assert.equal(saved.revision, 2);
  assert.equal(saved.credentials.openai.key, 'secret-provider-key-openai');
  for (const value of fixture.values.values()) {
    assert.equal(value.includes('secret-provider-key'), false);
    assert.equal(value.includes('fixture-model'), false);
  }
  assert.equal(new Set(fixture.writes).size, fixture.writes.length);
});

test('encrypted sessions reject tampering, another session identity, and the wrong secret', async () => {
  const fixture = redisFixture();
  const store = createRedisSessionStore(fixture.options);
  await store.update('original', saveProvider('openai'));
  const [key, value] = [...fixture.values][0];
  fixture.values.set(key.replace(':original', ':other'), value);
  await assert.rejects(store.get('other'), { status: 503 });
  await assert.rejects(createRedisSessionStore({ ...fixture.options, secret: 'cd'.repeat(32) }).get('original'), { status: 503 });
  const payload = Buffer.from(value, 'base64url');
  payload[payload.length - 1] ^= 1;
  fixture.values.set(key, payload.toString('base64url'));
  await assert.rejects(store.get('original'), { status: 503 });
});

test('session expiration clears old keys in memory and Redis', async () => {
  let time = 1000;
  const fixture = redisFixture();
  for (const store of [
    createMemorySessionStore({ now: () => time }),
    createRedisSessionStore({ ...fixture.options, now: () => time }),
  ]) {
    await store.update('expires', saveProvider('openai'));
    assert.equal((await store.get('expires')).credentials.openai.model, 'fixture-model');
    time += SESSION_MS + 1;
    assert.equal(await store.get('expires'), null);
    const fresh = await store.update('expires', current => current);
    assert.deepEqual(fresh.credentials, {});
    assert.equal(fresh.revision, 0);
  }
});

test('Vercel requires persistent storage; incomplete configuration cannot fall back to memory', () => {
  assert.throws(() => createSessionStore({ env: { VERCEL: '1' } }), { status: 503 });
  assert.throws(() => createSessionStore({ env: { UPSTASH_REDIS_REST_TOKEN: 'fixture-redis-token' } }), { status: 503 });
  assert.throws(() => createRedisSessionStore({ url: 'http://fixture.upstash.io', token: 'fixture-redis-token', secret: 'ab'.repeat(32) }), { status: 503 });
  assert.throws(() => createRedisSessionStore({ url: 'https://fixture.upstash.io', token: 'fixture-redis-token', secret: 'short' }), { status: 503 });
  assert.equal(typeof createSessionStore({ env: {} }).update, 'function');
});

test('Redis failures return a generic error without credentials or provider payloads', async () => {
  const fixture = redisFixture();
  for (const fetchImpl of [
    async () => { throw new Error('fixture-redis-token'); },
    async () => new Response('fixture-redis-token', { status: 401 }),
    async () => Response.json({ error: 'fixture-redis-token' }),
  ]) {
    const store = createRedisSessionStore({ ...fixture.options, fetchImpl });
    await assert.rejects(store.get('session'), error => error.status === 503 && !error.message.includes('fixture-redis-token'));
    await assert.rejects(store.update('session', saveProvider('openai')), { status: 503 });
  }
});

import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { createSessionStore } from '../server/session-store.mjs';

const required = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'GCC_SESSION_SECRET'];
const missing = required.filter(name => !process.env[name]);
if (missing.length) {
  console.error('Missing environment variables: ' + missing.join(', ') + '. Fill them in .env or the server environment.');
  process.exit(1);
}

const id = 'verification-' + randomBytes(16).toString('hex');
const namespace = process.env.VERCEL_ENV || 'development';
const key = 'gcc-compass:' + namespace + ':session:' + id;
const command = async args => {
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.UPSTASH_REDIS_REST_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error('Redis connection failed (' + response.status + ').');
  const data = await response.json();
  if (data.error) throw new Error('Redis rejected the verification command.');
  return data.result;
};

try {
  const first = createSessionStore();
  const second = createSessionStore();
  await first.update(id, current => current);
  const save = provider => current => ({
    ...current,
    credentials: { ...current.credentials, [provider]: { key: 'verification-key-only', model: 'verification-model' } },
    active: provider,
    revision: current.revision + 1,
  });
  await Promise.all([first.update(id, save('openai')), second.update(id, save('gemini'))]);
  const saved = await createSessionStore().get(id);
  assert.deepEqual(Object.keys(saved.credentials).sort(), ['gemini', 'openai']);
  assert.equal(saved.revision, 2);
  const encrypted = await command(['GET', key]);
  assert.equal(typeof encrypted, 'string');
  assert.equal(encrypted.includes('verification-key-only'), false);
  assert.equal(encrypted.includes('verification-model'), false);
  console.log(JSON.stringify({
    result: 'passed',
    checks: ['Redis connection and write permissions', 'encrypted session storage', 'independent server instances', 'concurrent provider saves'],
  }, null, 2));
} catch (error) {
  console.error(error.message || 'Redis verification failed.');
  process.exitCode = 1;
} finally {
  try { await command(['DEL', key]); }
  catch { console.warn('Could not clean up the synthetic verification session; it will expire automatically.'); }
}

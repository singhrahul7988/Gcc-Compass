import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export const SESSION_MS = 12 * 60 * 60 * 1000;
const emptySession = () => ({ credentials: {}, researchKeys: {}, active: null, revision: 0 });
const unavailable = () => Object.assign(new Error('AI settings storage is unavailable. Check the server session configuration and try again.'), { status: 503 });

export function createMemorySessionStore({ now = Date.now } = {}) {
  const sessions = new Map();
  const cleanup = setInterval(() => {
    for (const [id, session] of sessions) if (session.expires <= now()) sessions.delete(id);
  }, 15 * 60 * 1000);
  cleanup.unref();
  return {
    async get(id) {
      const session = sessions.get(id);
      if (session && session.expires <= now()) { sessions.delete(id); return null; }
      return session ? structuredClone(session) : null;
    },
    async update(id, change) {
      const saved = sessions.get(id);
      const current = saved && saved.expires > now() ? saved : emptySession();
      const updated = { ...change(structuredClone(current)), expires: now() + SESSION_MS };
      sessions.set(id, updated);
      return structuredClone(updated);
    },
  };
}

// Compare the encrypted value before writing, so simultaneous saves cannot drop keys.
const compareAndSet = [
  "local current = redis.call('GET', KEYS[1]) or ''",
  "if current ~= ARGV[1] then return 0 end",
  "redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3])",
  "return 1",
].join('\n');

export function createRedisSessionStore({ url, token, secret, namespace = 'development', fetchImpl = globalThis.fetch, now = Date.now }) {
  if (!url || !token || !/^[a-fA-F0-9]{64}$/.test(secret || '')) throw unavailable();
  let endpoint;
  try { endpoint = new URL(url); } catch { throw unavailable(); }
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password) throw unavailable();
  const encryptionKey = Buffer.from(secret, 'hex');
  const storageKey = id => 'gcc-compass:' + namespace + ':session:' + id;
  const encrypt = (id, session) => {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
    cipher.setAAD(Buffer.from(storageKey(id)));
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(session), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
  };
  const decrypt = (id, value) => {
    const payload = Buffer.from(value, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey, payload.subarray(0, 12));
    decipher.setAAD(Buffer.from(storageKey(id)));
    decipher.setAuthTag(payload.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(payload.subarray(28)), decipher.final()]).toString('utf8'));
  };
  const command = async args => {
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(args), signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw unavailable();
      const data = await response.json();
      if (!data || data.error || !Object.hasOwn(data, 'result')) throw unavailable();
      return data.result;
    } catch { throw unavailable(); }
  };
  const read = async id => {
    const value = await command(['GET', storageKey(id)]);
    try { return { value, session: value ? decrypt(id, value) : null }; }
    catch { throw unavailable(); }
  };
  return {
    async get(id) {
      const { session } = await read(id);
      return session && session.expires > now() ? session : null;
    },
    async update(id, change) {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const { value, session } = await read(id);
        const current = session && session.expires > now() ? session : emptySession();
        const updated = { ...change(current), expires: now() + SESSION_MS };
        const saved = await command(['EVAL', compareAndSet, 1, storageKey(id), value || '', encrypt(id, updated), SESSION_MS]);
        if (saved === 1) return updated;
      }
      throw unavailable();
    },
  };
}

export function createSessionStore({ env = process.env, fetchImpl, now } = {}) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  const secret = env.GCC_SESSION_SECRET;
  if (url || token || secret) return createRedisSessionStore({ url, token, secret, namespace: env.VERCEL_ENV || 'development', fetchImpl, now });
  if (env.VERCEL) throw unavailable();
  return createMemorySessionStore({ now });
}

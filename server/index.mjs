import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAiApiMiddleware } from './ai-api.mjs';

const dist = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const api = createAiApiMiddleware();
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer(async (req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Bad request');
    return;
  }
  if (pathname.startsWith('/api/ai/')) {
    req.url = pathname.slice('/api/ai'.length);
    await api(req, res, () => res.writeHead(404).end('Not found'));
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end('Method not allowed');
    return;
  }
  const requested = resolve(dist, '.' + pathname);
  if (requested !== dist && !requested.startsWith(dist + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  let file = requested;
  try {
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
  } catch {
    if (extname(pathname)) {
      res.writeHead(404).end('Not found');
      return;
    }
    file = resolve(dist, 'index.html');
  }
  try {
    const content = await readFile(file);
    res.setHeader('Content-Type', mimeTypes[extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', file.endsWith('index.html') ? 'no-cache' : 'public, max-age=86400');
    res.writeHead(200);
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    res.writeHead(404).end('Build the app with npm run build first.');
  }
});

const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
server.listen(port, host, () => console.log(`GCC Compass running at http://${host}:${port}`));
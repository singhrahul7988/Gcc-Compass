import { createAiApiMiddleware } from '../server/ai-api.mjs';

export function createVercelAiHandler(options) {
  const middleware = createAiApiMiddleware(options);
  return async (req, res) => {
    const url = new URL(req.url || '/', 'http://localhost');
    const endpoint = url.pathname.startsWith('/api/ai/')
      ? url.pathname.slice('/api/ai/'.length)
      : url.pathname === '/api/ai' ? url.searchParams.get('endpoint') : null;
    const notFound = () => {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ error: 'AI endpoint not found.' }));
    };
    if (!endpoint || !/^[a-z-]+$/.test(endpoint)) return notFound();
    req.url = '/' + endpoint;
    await middleware(req, res, notFound);
  };
}

export const config = { supportsResponseStreaming: true };
export default createVercelAiHandler();

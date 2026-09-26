import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { gunzipSync, inflateSync, brotliDecompressSync } from 'node:zlib';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Readability } from '@mozilla/readability';

const cache = new Map();
const MAX_BYTES = 8 * 1024 * 1024;
const CACHE_MS = 15 * 60 * 1000;

export function isPublicAddress(address) {
  const version = isIP(address);
  if (version === 4) {
    const [a, b] = address.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0)) || (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) || (a === 203 && b === 0));
  }
  if (version === 6) {
    const lower = new URL('http://[' + address + ']').hostname.slice(1, -1).toLowerCase();
    if (lower.startsWith('::ffff:')) {
      const tail = lower.slice(7);
      if (isIP(tail) === 4) return isPublicAddress(tail);
      const parts = tail.split(':');
      if (parts.length === 2) {
        const first = parseInt(parts[0], 16);
        const second = parseInt(parts[1], 16);
        return isPublicAddress([first >> 8, first & 255, second >> 8, second & 255].join('.'));
      }
      return false;
    }
    return !(lower === '::' || lower === '::1' || lower.startsWith('fc') ||
      lower.startsWith('fd') || /^fe[89ab]/.test(lower) || lower.startsWith('ff') ||
      lower.startsWith('2001:db8:') || lower.startsWith('::'));
  }
  return false;
}

export async function validateRemoteUrl(value, lookupImpl = lookup) {
  const url = new URL(value);
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
      (url.port && !['80', '443'].includes(url.port)) ||
      /(^|\.)(localhost|local|internal|invalid|test)$/.test(host)) throw new Error('This source address is not public.');
  const addresses = isIP(host) ? [{ address: host, family: isIP(host) }] : await Promise.race([lookupImpl(host, { all: true, verbatim: true }), new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('The source DNS lookup timed out.')), 8000); timer.unref?.(); })]);
  if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) throw new Error('This source address is not public.');
  return { url, address: addresses.find(item => item.family === 4) || addresses[0] };
}

async function downloadSource(value, signal, redirect = 0) {
  signal?.throwIfAborted();
  if (redirect > 3) throw new Error('The source redirected too many times.');
  const { url, address } = await validateRemoteUrl(value);
  const result = await new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = transport(url, {
      method: 'GET',
      signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GCCCompassResearch/1.0)',
        Accept: 'text/html,application/pdf,text/plain;q=0.9',
        'Accept-Encoding': 'identity',
      },
      lookup: (_hostname, options, callback) => {
        if (options?.all) callback(null, [address]);
        else callback(null, address.address, address.family);
      },
    }, res => {
      const status = res.statusCode || 0;
      if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
        res.resume();
        resolve({ redirect: new URL(res.headers.location, url).href });
        return;
      }
      if (status < 200 || status >= 300) {
        res.resume();
        reject(new Error(status === 403 || status === 401 ? 'The publisher restricted access.' : 'The source returned HTTP ' + status + '.'));
        return;
      }
      const type = String(res.headers['content-type'] || '').toLowerCase();
      if (type && !/html|pdf|text\/plain|xhtml/.test(type)) {
        res.resume();
        reject(new Error('The source is not an article, text document, or PDF.'));
        return;
      }
      const declared = Number(res.headers['content-length'] || 0);
      if (declared > MAX_BYTES) {
        res.destroy();
        reject(new Error('The source document is too large.'));
        return;
      }
      const chunks = [];
      let bytes = 0;
      res.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > MAX_BYTES) {
          res.destroy(new Error('The source document is too large.'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('error', reject);
      res.on('end', () => resolve({
        buffer: Buffer.concat(chunks), type, encoding: res.headers['content-encoding'], url: url.href,
      }));
    });
    req.setTimeout(18000, () => req.destroy(new Error('The source took too long to respond.')));
    req.on('error', reject);
    req.end();
  });
  if (result.redirect) return downloadSource(result.redirect, signal, redirect + 1);
  const limits = { maxOutputLength: MAX_BYTES };
  if (result.encoding === 'gzip') result.buffer = gunzipSync(result.buffer, limits);
  else if (result.encoding === 'deflate') result.buffer = inflateSync(result.buffer, limits);
  else if (result.encoding === 'br') result.buffer = brotliDecompressSync(result.buffer, limits);
  return result;
}

function tidy(value) {
  return String(value || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
}

function documentText(root) {
  const nodes = [...root.querySelectorAll('h1,h2,h3,h4,p,li,table')].filter(node => !node.parentElement?.closest('table') && !(node.tagName === 'P' && node.parentElement?.closest('li')));
  const seen = new Set();
  return nodes.map(node => {
    let text;
    if (node.tagName === 'TABLE') {
      text = [...node.querySelectorAll('tr')].map(row => [...row.querySelectorAll('th,td')].map(cell => tidy(cell.textContent)).join(' | ')).join('\n');
    } else text = tidy(node.textContent);
    if (!text || seen.has(text)) return '';
    seen.add(text);
    return text;
  }).filter(Boolean).join('\n\n') || tidy(root.textContent);
}

export function extractHtml(html, url) {
  const dom = new JSDOM(html, { url, virtualConsole: new VirtualConsole() });
  try {
    const document = dom.window.document;
    const publishedAt = document.querySelector('meta[property="article:published_time"],meta[name="date"],meta[itemprop="datePublished"]')?.getAttribute('content') || null;
    document.querySelectorAll('script,style,noscript,nav,footer,header,form,aside,[hidden],[aria-hidden="true"]').forEach(node => node.remove());
    const fallback = document.querySelector('article,main,[role="main"]') || document.body;
    const article = new Readability(document.cloneNode(true), { charThreshold: 150, maxElemsToParse: 40000 }).parse();
    const fragment = article?.content ? JSDOM.fragment(article.content) : null;
    return {
      title: tidy(article?.title || document.title).slice(0, 220),
      content: documentText(fragment || fallback).slice(0, 180000),
      publishedAt: article?.publishedTime || publishedAt,
    };
  } finally {
    dom.window.close();
  }
}

export async function extractPdf(buffer) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loading = getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, useSystemFonts: true, disableFontFace: true, verbosity: 0 });
  const document = await loading.promise;
  try {
    const pages = [];
    for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 35); pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let line = '';
      const lines = [];
      for (const item of content.items) {
        if (typeof item.str !== 'string') continue;
        line += item.str + ' ';
        if (item.hasEOL) { lines.push(tidy(line)); line = ''; }
      }
      if (line) lines.push(tidy(line));
      pages.push('Page ' + pageNumber + '\n' + lines.join('\n'));
      page.cleanup();
    }
    return { title: '', content: pages.join('\n\n').slice(0, 180000), publishedAt: null };
  } finally {
    await document.destroy();
  }
}

export function selectPassages(content, question, limit = 16000) {
  if (content.length <= limit) return content;
  const terms = [...new Set(question.toLowerCase().match(/[a-z]{3,}/g) || [])].filter(term => !['the', 'and', 'for', 'with', 'compare', 'what', 'which', 'people'].includes(term));
  const passages = content.split(/\n\n+/).filter(Boolean);
  const ranked = passages.map((text, index) => ({
    text, index,
    score: terms.reduce((total, term) => total + (text.toLowerCase().includes(term) ? 2 : 0), 0) + (/\d.*(%|salary|rent|cost|INR|Rs|million|lakh)/i.test(text) ? 2 : 0),
  })).sort((a, b) => b.score - a.score);
  const selected = new Set([0, 1]);
  let chars = (passages[0]?.length || 0) + (passages[1]?.length || 0);
  for (const item of ranked) {
    if (selected.has(item.index)) continue;
    if (chars + item.text.length > limit - 200) continue;
    selected.add(item.index); chars += item.text.length;
  }
  return [...selected].sort((a, b) => a - b).map(index => passages[index]).filter(Boolean).join('\n\n').slice(0, limit);
}

export async function readWebPage(url, question, { signal, downloader = downloadSource } = {}) {
  const currentTime = Date.now();
  let record = cache.get(url);
  if (!record || currentTime - record.time > CACHE_MS) {
    const response = await downloader(url, signal);
    const pdf = /pdf/.test(response.type) || response.buffer.subarray(0, 5).toString() === '%PDF-';
    const extracted = pdf ? await extractPdf(response.buffer) : /text\/plain/.test(response.type)
      ? { title: '', content: response.buffer.toString('utf8'), publishedAt: null }
      : extractHtml(response.buffer.toString('utf8'), response.url || url);
    if (extracted.content.length < 160 || /^(access denied|just a moment|enable javascript)/i.test(extracted.content)) throw new Error('The article text was not available.');
    record = { ...extracted, time: currentTime, format: pdf ? 'pdf' : 'article', url: response.url || url };
    cache.set(url, record);
    if (cache.size > 100) cache.delete(cache.keys().next().value);
  }
  return {
    title: record.title, content: selectPassages(record.content, question),
    publishedAt: record.publishedAt, retrievedAt: new Date(record.time).toISOString(),
    format: record.format, finalUrl: record.url,
  };
}


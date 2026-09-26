export type AiProvider = 'openai' | 'gemini' | 'claude' | 'deepseek';
export type AiStatus = {
  configured: boolean;
  provider: AiProvider | null;
  model: string | null;
  saved: { provider: AiProvider; model: string }[];
  searchConfigured: boolean;
};
export type LiveFinding = { text: string; citations: number[] };
export type LiveAnalysis = {
  title: string;
  summary: string;
  summaryCitations?: number[];
  findings: LiveFinding[];
  next: string;
  caveat: string;
  scope?: string;
  comparison?: {
    title: string;
    columns: string[];
    rows: { factor: string; cells: { text: string; citations: number[]; status: 'supported' | 'estimate' | 'unknown' }[] }[];
  } | null;
  sections?: { title: string; paragraphs: LiveFinding[]; bullets: LiveFinding[] }[];
  recommendation?: { choice: string; rationale: string; citations: number[] } | null;
  followUps?: string[];
};

export const providerNames: Record<AiProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  claude: 'Claude',
  deepseek: 'DeepSeek',
};
export const suggestedModels: Record<AiProvider, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o'],
  gemini: ['gemini-3.8-flash', 'gemini-3.7-flash'],
  claude: ['claude-sonnet-5', 'claude-haiku-4-5'],
  deepseek: ['deepseek-flash', 'deepseek-v4-pro'],
};

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/ai' + path, { credentials: 'same-origin', ...options });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('AI service is unavailable. Start the app server and try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'AI service is unavailable.');
  return data as T;
}

export function getAiStatus() {
  return api<AiStatus>('/status');
}

export function saveAiSettings(provider: AiProvider, apiKey: string, model: string) {
  return api<AiStatus>('/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, apiKey, model }),
  });
}

export function removeAiSettings(provider: AiProvider) {
  return api<AiStatus>('/settings', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  });
}

export function testAiConnection(provider: AiProvider) {
  return api<{ ok: true; provider: AiProvider; model: string }>('/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  });
}

export function requestLiveAnalysis(question: string, context: unknown, signal?: AbortSignal) {
  return api<{ analysis: LiveAnalysis; provider: AiProvider; model: string }>('/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, context }),
    signal,
  });
}

export type ResearchEvidence = {
  number: number;
  type: 'local' | 'web';
  kind: string;
  title: string;
  detail: string;
  url: string | null;
  sourceIds: string[];
  confidence: number | null;
  checked: string | null;
  facts: Record<string, string>;
  status?: 'read' | 'preview';
  format?: string;
  publishedAt?: string | null;
  retrievedAt?: string;
  reason?: string;
};
export type ResearchEvent =
  | { stage: 'local'; total: number; results: ResearchEvidence[]; entities?: string[] }
  | { stage: 'searching-web' | 'planning' | 'checking' | 'searching-more' }
  | { stage: 'reading'; completed: number; total: number }
  | { stage: 'web'; results: ResearchEvidence[] }
  | { stage: 'web-error'; error: string }
  | { stage: 'web-unavailable' }
  | { stage: 'analyzing'; provider?: AiProvider; model?: string }
  | { stage: 'answer'; analysis: LiveAnalysis; provider?: AiProvider; model?: string }
  | { stage: 'analysis-error'; error: string }
  | { stage: 'analysis-unavailable' }
  | { stage: 'done' };

export function saveSearchSettings(apiKey: string) {
  return api<AiStatus>('/web-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });
}

export function removeSearchSettings() {
  return api<AiStatus>('/web-settings', { method: 'DELETE' });
}

export async function requestResearch(question: string, onEvent: (event: ResearchEvent) => void, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch('/api/ai/research', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }), signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('Research service is unavailable. Start the app server and try again.');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.error === 'string' ? body.error : 'Research request failed.');
  }
  if (!response.body) throw new Error('Research stream is unavailable.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let done = false;
  const emit = (line: string) => {
    if (!line.trim()) return;
    let event: ResearchEvent;
    try { event = JSON.parse(line) as ResearchEvent; }
    catch { throw new Error('Research service sent an invalid response.'); }
    if (event.stage === 'done') done = true;
    onEvent(event);
  };
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      emit(buffer.slice(0, newline));
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf('\n');
    }
  }
  buffer += decoder.decode();
  if (buffer.trim()) emit(buffer);
  if (!done) throw new Error('Research ended before the answer was complete.');
}

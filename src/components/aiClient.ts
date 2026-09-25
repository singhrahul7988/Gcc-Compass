export type AiProvider = 'openai' | 'gemini' | 'claude' | 'deepseek';
export type AiStatus = {
  configured: boolean;
  provider: AiProvider | null;
  model: string | null;
  saved: { provider: AiProvider; model: string }[];
};
export type LiveFinding = { text: string; citations: number[] };
export type LiveAnalysis = {
  title: string;
  summary: string;
  findings: LiveFinding[];
  next: string;
  caveat: string;
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
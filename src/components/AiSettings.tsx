import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, KeyRound, LoaderCircle, ShieldCheck, Trash2, X } from 'lucide-react';
import { providerNames, removeAiSettings, removeSearchSettings, saveAiSettings, saveSearchSettings, suggestedModels, testAiConnection } from './aiClient';
import type { AiProvider, AiStatus } from './aiClient';

type Props = {
  status: AiStatus;
  onStatusChange: (status: AiStatus) => void;
  onClose: () => void;
};

const providers: AiProvider[] = ['openai', 'gemini', 'claude', 'deepseek'];
const keyExamples: Record<AiProvider, string> = {
  openai: 'sk-...', gemini: 'AIza...', claude: 'sk-ant-...', deepseek: 'sk-...',
};

export function AiSettings({ status, onStatusChange, onClose }: Props) {
  const [provider, setProvider] = useState<AiProvider>(status.provider || 'openai');
  const [model, setModel] = useState(() => status.model || suggestedModels.openai[0]);
  const [apiKey, setApiKey] = useState('');
  const [searchKey, setSearchKey] = useState('');
  const [searchPending, setSearchPending] = useState<'save' | 'remove' | null>(null);
  const searchBusy = searchPending !== null;
  const [searchMessage, setSearchMessage] = useState('');
  const [searchError, setSearchError] = useState('');
  const [pending, setPending] = useState<'save' | 'test' | 'remove' | null>(null);
  const busy = pending !== null;
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const keyInput = useRef<HTMLInputElement>(null);
  const selectedSaved = status.saved.find(item => item.provider === provider);

  useEffect(() => {
    keyInput.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const chooseProvider = (next: AiProvider) => {
    setProvider(next);
    setModel(status.saved.find(item => item.provider === next)?.model || suggestedModels[next][0]);
    setApiKey('');
    setMessage('');
    setError('');
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending('save'); setError(''); setMessage('');
    try {
      const saved = await saveAiSettings(provider, apiKey.trim(), model.trim());
      onStatusChange(saved);
      setApiKey('');
      setMessage('Saved.');
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setPending(null);
    }
  };

  const test = async () => {
    setPending('test'); setError(''); setMessage('');
    try {
      await testAiConnection(provider);
      setMessage('Connection verified.');
    } catch (testError) {
      setError((testError as Error).message);
    } finally {
      setPending(null);
    }
  };

  const remove = async () => {
    setPending('remove'); setError(''); setMessage('');
    try {
      const next = await removeAiSettings(provider);
      onStatusChange(next);
      setApiKey('');
      setMessage('Key removed.');
    } catch (removeError) {
      setError((removeError as Error).message);
    } finally {
      setPending(null);
    }
  };

  const saveSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchPending('save'); setSearchMessage(''); setSearchError('');
    try {
      const next = await saveSearchSettings(searchKey.trim());
      onStatusChange(next);
      setSearchKey('');
      setSearchMessage('Saved.');
    } catch (saveError) {
      setSearchError((saveError as Error).message);
    } finally {
      setSearchPending(null);
    }
  };

  const removeSearch = async () => {
    setSearchPending('remove'); setSearchMessage(''); setSearchError('');
    try {
      onStatusChange(await removeSearchSettings());
      setSearchMessage('Key removed.');
    } catch (removeError) {
      setSearchError((removeError as Error).message);
    } finally {
      setSearchPending(null);
    }
  };

  return <div className="ai-settings-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="ai-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title">
      <div className="ai-settings-header">
        <div className="ai-settings-icon" aria-hidden="true"><KeyRound size={20} /></div>
        <h2 id="ai-settings-title">Manage API keys</h2>
        <button type="button" onClick={onClose} aria-label="Close AI settings"><X size={19} /></button>
      </div>
      <form className="ai-settings-provider-form" aria-label="AI provider" onSubmit={save}>
        <div className="ai-settings-field-row">
          <div className="ai-settings-field">
            <label htmlFor="ai-provider">Provider</label>
            <select id="ai-provider" value={provider} onChange={event => chooseProvider(event.target.value as AiProvider)} disabled={busy}>
              {providers.map(item => <option value={item} key={item}>{providerNames[item]}</option>)}
            </select>
          </div>
          <div className="ai-settings-field">
            <label htmlFor="ai-model">Model</label>
            <input id="ai-model" list="ai-model-options" value={model} onChange={event => { setModel(event.target.value); setMessage(''); setError(''); }} placeholder={suggestedModels[provider][0]} autoComplete="off" spellCheck={false} disabled={busy} />
            <datalist id="ai-model-options">{suggestedModels[provider].map(item => <option key={item} value={item} />)}</datalist>
          </div>
        </div>
        <div className="ai-settings-field">
          <label htmlFor="ai-api-key">API key</label>
          <input ref={keyInput} id="ai-api-key" type="password" autoComplete="off" spellCheck={false} value={apiKey} onChange={event => { setApiKey(event.target.value); setMessage(''); setError(''); }} placeholder={selectedSaved ? 'Enter a replacement key' : keyExamples[provider]} disabled={busy} />
        </div>
        <div className="ai-settings-actions">
          {selectedSaved && <button type="button" className="ai-settings-remove" aria-label={'Remove ' + providerNames[provider] + ' key'} onClick={remove} disabled={busy}>{pending === 'remove' ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />} Remove key</button>}
          <div className="ai-settings-submit-actions">
            {selectedSaved && <button type="button" className="ai-settings-secondary" onClick={test} disabled={busy}>{pending === 'test' && <LoaderCircle size={15} className="spin" />} Test connection</button>}
            <button type="submit" className="ai-settings-primary" disabled={busy || !model.trim() || (!apiKey.trim() && !selectedSaved)}>{pending === 'save' && <LoaderCircle size={15} className="spin" />} Save</button>
          </div>
        </div>
        {error && <p className="ai-settings-error" role="alert">{error}</p>}
        {message && <p className="ai-settings-success" role="status"><CheckCircle2 size={16} /> {message}</p>}
      </form>
      <section className="ai-settings-search" aria-labelledby="ai-settings-search-title">
        <h3 id="ai-settings-search-title">Web search</h3>
        <p>Research the web and read source pages with <a href="https://serper.dev/" target="_blank" rel="noreferrer">Serper</a>.</p>
        <form aria-label="Web search" onSubmit={saveSearch}>
          <div className="ai-settings-field">
            <label htmlFor="ai-search-key">Serper API key</label>
            <input id="ai-search-key" type="password" autoComplete="off" spellCheck={false} value={searchKey} onChange={event => { setSearchKey(event.target.value); setSearchMessage(''); setSearchError(''); }} placeholder={status.searchConfigured ? 'Enter a replacement key' : 'Enter API key'} disabled={searchBusy} />
          </div>
          <div className="ai-settings-actions">
            {status.searchConfigured && <button type="button" className="ai-settings-remove" aria-label="Remove web search key" onClick={removeSearch} disabled={searchBusy}>{searchPending === 'remove' ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />} Remove key</button>}
            <button type="submit" className="ai-settings-primary" disabled={searchBusy || searchKey.trim().length < 10}>{searchPending === 'save' && <LoaderCircle size={15} className="spin" />} Save</button>
          </div>
          {searchError && <p className="ai-settings-error" role="alert">{searchError}</p>}
          {searchMessage && <p className="ai-settings-success" role="status"><CheckCircle2 size={16} /> {searchMessage}</p>}
        </form>
      </section>
      <p className="ai-settings-hint"><ShieldCheck size={14} /> Keys are stored for this session only.</p>
    </section>
  </div>;
}

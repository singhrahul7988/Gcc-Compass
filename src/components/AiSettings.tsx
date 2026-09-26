import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, KeyRound, LoaderCircle, ShieldCheck, Trash2, X } from 'lucide-react';
import { providerNames, removeAiSettings, removeResearchSettings, saveAiSettings, saveResearchSettings, researchProviderNames, testResearchConnection, suggestedModels, testAiConnection } from './aiClient';
import type { AiProvider, AiStatus, ResearchProvider } from './aiClient';

type Props = {
  status: AiStatus;
  onStatusChange: (status: AiStatus) => void;
  onClose: () => void;
};

const providers: AiProvider[] = ['openai', 'gemini', 'claude', 'deepseek'];
const researchServices: ResearchProvider[] = ['tavily', 'exa', 'firecrawl', 'serper'];
const serviceRoles: Record<ResearchProvider, string> = { tavily: 'Search and source text', exa: 'Additional sources and page text', firecrawl: 'Browser rendering and page reading', serper: 'Google search fallback' };
const keyExamples: Record<AiProvider, string> = {
  openai: 'sk-...', gemini: 'AIza...', claude: 'sk-ant-...', deepseek: 'sk-...',
};

export function AiSettings({ status, onStatusChange, onClose }: Props) {
  const [provider, setProvider] = useState<AiProvider>(status.provider || 'openai');
  const [model, setModel] = useState(() => status.model || suggestedModels.openai[0]);
  const [apiKey, setApiKey] = useState('');
  const [researchProvider, setResearchProvider] = useState<ResearchProvider>('tavily');
  const [searchKey, setSearchKey] = useState('');
  const [searchPending, setSearchPending] = useState<'save' | 'test' | 'remove' | null>(null);
  const searchBusy = searchPending !== null;
  const [searchMessage, setSearchMessage] = useState('');
  const [searchError, setSearchError] = useState('');
  const [pending, setPending] = useState<'save' | 'test' | 'remove' | null>(null);
  const busy = pending !== null || searchBusy;
  const allBusy = busy;
  const connectedResearch = status.researchProviders || (status.searchConfigured ? ['serper'] : []);
  const researchSaved = connectedResearch.includes(researchProvider);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const keyInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const selectedSaved = status.saved.find(item => item.provider === provider);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    keyInput.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
      if (event.key !== 'Tab') return;
      const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href]') || [])];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
      else document.querySelector<HTMLButtonElement>('[aria-label="User profile"]')?.focus();
    };
  }, []);

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
      const next = await saveResearchSettings(researchProvider, searchKey.trim());
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
      onStatusChange(await removeResearchSettings(researchProvider));
      setSearchKey('');
      setSearchMessage('Key removed.');
    } catch (removeError) {
      setSearchError((removeError as Error).message);
    } finally {
      setSearchPending(null);
    }
  };

  const chooseResearch = (next: ResearchProvider) => {
    setResearchProvider(next); setSearchKey(''); setSearchMessage(''); setSearchError('');
  };
  const testResearch = async () => {
    setSearchPending('test'); setSearchMessage(''); setSearchError('');
    try { await testResearchConnection(researchProvider); setSearchMessage('Connection verified.'); }
    catch (testError) { setSearchError((testError as Error).message); }
    finally { setSearchPending(null); }
  };

  return <div className="ai-settings-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialog} className="ai-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title">
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
            <input id="ai-model" value={model} onChange={event => { setModel(event.target.value); setMessage(''); setError(''); }} placeholder={suggestedModels[provider][0]} autoComplete="off" spellCheck={false} disabled={busy} />
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
        <h3 id="ai-settings-search-title">Research APIs</h3>
        <p>Connected services work together to find sources and read pages. Add each key once.</p>
        <div className="ai-settings-services" aria-label="Research services">
          {researchServices.map(item => <button key={item} type="button" className={researchProvider === item ? 'selected' : ''} aria-pressed={researchProvider === item} disabled={allBusy} onClick={() => chooseResearch(item)}>
            <span>{researchProviderNames[item]}{connectedResearch.includes(item) && <CheckCircle2 size={15} aria-label="Connected" />}</span>
            <small>{serviceRoles[item]}</small>
          </button>)}
        </div>
        <form aria-label="Research APIs" onSubmit={saveSearch}>
          <div className="ai-settings-field">
            <label htmlFor="ai-search-key">{researchProviderNames[researchProvider]} API key</label>
            <input id="ai-search-key" type="password" autoComplete="off" spellCheck={false} value={searchKey} onChange={event => { setSearchKey(event.target.value); setSearchMessage(''); setSearchError(''); }} placeholder={researchSaved ? 'Enter a replacement key' : 'Enter API key'} disabled={allBusy} />
          </div>
          <div className="ai-settings-actions">
            {researchSaved && <button type="button" className="ai-settings-remove" aria-label={'Remove ' + researchProviderNames[researchProvider] + ' key'} onClick={removeSearch} disabled={allBusy}>{searchPending === 'remove' ? <LoaderCircle size={15} className="spin" /> : <Trash2 size={15} />} Remove key</button>}
            <div className="ai-settings-submit-actions">
              {researchSaved && <button type="button" className="ai-settings-secondary" onClick={testResearch} disabled={allBusy}>{searchPending === 'test' && <LoaderCircle size={15} className="spin" />} Test connection</button>}
              <button type="submit" className="ai-settings-primary" disabled={allBusy || searchKey.trim().length < 10}>{searchPending === 'save' && <LoaderCircle size={15} className="spin" />} Save</button>
            </div>
          </div>
          {searchError && <p className="ai-settings-error" role="alert">{searchError}</p>}
          {searchMessage && <p className="ai-settings-success" role="status"><CheckCircle2 size={16} /> {searchMessage}</p>}
        </form>
      </section>
      <p className="ai-settings-hint"><ShieldCheck size={14} /> Keys are stored for this session only.</p>
    </section>
  </div>;
}

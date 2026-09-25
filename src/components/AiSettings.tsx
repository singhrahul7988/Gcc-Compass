import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, KeyRound, LoaderCircle, ShieldCheck, Trash2, X } from 'lucide-react';
import { removeAiSettings, saveAiSettings, testAiConnection } from './aiClient';
import type { AiStatus } from './aiClient';

type Props = {
  status: AiStatus;
  onStatusChange: (status: AiStatus) => void;
  onClose: () => void;
};

export function AiSettings({ status, onStatusChange, onClose }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(status.model || 'gpt-4o-mini');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const keyInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    keyInput.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const saved = await saveAiSettings(apiKey.trim(), model);
      onStatusChange(saved);
      setApiKey('');
      try {
        await testAiConnection();
        setMessage('OpenAI key saved and connection verified. New analyst questions will use live AI.');
      } catch (testError) {
        const reason = (testError as Error).message;
        if (reason.includes('rejected this API key')) {
          const reset = await removeAiSettings();
          onStatusChange(reset);
          setError(reason + ' The rejected key was removed.');
        } else {
          setError(reason + ' The key is saved for this session; update it here if needed.');
        }
      }
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      await testAiConnection();
      setMessage('OpenAI connection verified.');
    } catch (testError) {
      setError((testError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const next = await removeAiSettings();
      onStatusChange(next);
      setApiKey('');
      setMessage('API key removed. The analyst will use local evidence answers.');
    } catch (removeError) {
      setError((removeError as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return <div className="ai-settings-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="ai-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title">
      <div className="ai-settings-header">
        <div className="ai-settings-icon"><KeyRound size={21} /></div>
        <div><p className="eyebrow">Profile / AI settings</p><h2 id="ai-settings-title">Connect live AI analysis</h2></div>
        <button type="button" onClick={onClose} aria-label="Close AI settings"><X size={19} /></button>
      </div>
      <p className="ai-settings-description">Add your OpenAI API key to get a fresh, question-specific analysis of the evidence shown in GCC Compass.</p>
      <div className="ai-settings-status"><span className={status.configured ? 'connected' : ''} />{status.configured ? 'OpenAI key saved for this session' : 'Using local evidence answers'}{status.model && <small>Model: {status.model}</small>}</div>
      <form onSubmit={save}>
        <label htmlFor="ai-provider">Provider</label>
        <select id="ai-provider" value="openai" disabled><option value="openai">OpenAI</option></select>
        <label htmlFor="ai-model">Model</label>
        <select id="ai-model" value={model} onChange={event => setModel(event.target.value)} disabled={busy}>
          <option value="gpt-4o-mini">GPT-4o mini</option>
          <option value="gpt-4o">GPT-4o</option>
        </select>
        <label htmlFor="ai-api-key">API key</label>
        <input ref={keyInput} id="ai-api-key" type="password" autoComplete="off" spellCheck={false} value={apiKey} onChange={event => setApiKey(event.target.value)} placeholder="sk-..." disabled={busy} />
        <p className="ai-settings-hint"><ShieldCheck size={16} /> The key stays in server memory for this session. It is never saved in your browser or included in the app build. Questions and cited context are sent to OpenAI when you run live analysis.</p>
        {error && <p className="ai-settings-error" role="alert">{error}</p>}
        {message && <p className="ai-settings-success" role="status"><CheckCircle2 size={16} /> {message}</p>}
        <div className="ai-settings-actions">
          {status.configured && <button type="button" className="ai-settings-secondary" onClick={test} disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <CheckCircle2 size={16} />} Test connection</button>}
          <button type="submit" className="ai-settings-primary" disabled={busy || !apiKey.trim()}>{busy ? <LoaderCircle size={16} className="spin" /> : <KeyRound size={16} />} Save and test key</button>
        </div>
      </form>
      {status.configured && <button type="button" className="ai-settings-remove" onClick={remove} disabled={busy}><Trash2 size={16} /> Remove saved key</button>}
    </section>
  </div>;
}


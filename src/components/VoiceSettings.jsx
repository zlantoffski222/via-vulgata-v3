import React, { useEffect, useState } from 'react';
import { useSettings, settingsStore } from '../store';
import { voicesFor, sample, stop, STUDIO_VOICES, speechSupported } from '../speech';

const Toggle = ({ on, set, label, help }) => <label className={'toggle' + (on ? ' on' : '')}><input type="checkbox" checked={on} onChange={e => set(e.target.checked)} /><span className="sw" /><span><b>{label}</b>{help && <small>{help}</small>}</span></label>;
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '') || /Mac OS|iPhone|iPad/.test(navigator.userAgent);
const isWin = /Win/.test(navigator.platform || '');

// Which voice reads the text: the best of the browser's own, or the studio voice.
export default function VoiceSettings() {
  const s = useSettings();
  const [tick, setTick] = useState(0);
  useEffect(() => { if (!('speechSynthesis' in window)) return; const f = () => setTick(t => t + 1); speechSynthesis.addEventListener('voiceschanged', f); const t = setTimeout(f, 500); return () => { speechSynthesis.removeEventListener('voiceschanged', f); clearTimeout(t); }; }, []);
  useEffect(() => () => stop(), []);
  if (!speechSupported) return null;
  const en = voicesFor('en'), la = voicesFor('la'); void tick;
  const label = v => `${v.name}${/premium/i.test(v.voiceURI + v.name) ? ' · premium' : /enhanced/i.test(v.voiceURI + v.name) ? ' · enhanced' : /natural|neural|online/i.test(v.name) ? ' · natural' : ''} (${v.lang})`;
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="eyebrow">The reading voice</div>
      <div className="help" style={{ marginTop: 6 }}>Two ways to have the text read to you. The browser's own voices cost nothing and work offline; the best one installed is chosen for you, and you can pick another. The studio voice is a neural voice from OpenAI — much closer to a human reader — and needs a key of your own.</div>

      <div className="field">
        <label>English voice — {en.length ? `${en.length} available` : 'none found yet'}</label>
        <div className="row">
          <select value={s.voiceEn || ''} onChange={e => settingsStore.set({ voiceEn: e.target.value || null })} style={{ flex: 1, minWidth: 200 }}>
            <option value="">Best available{en[0] ? ` — ${en[0].name}` : ''}</option>
            {en.map(v => <option key={v.voiceURI} value={v.voiceURI}>{label(v)}</option>)}
          </select>
          <button className="btn sm" onClick={() => sample('en', s.voiceEn || (en[0] && en[0].voiceURI))}>▶ Hear it</button>
        </div>
      </div>
      <div className="field">
        <label>Latin voice — read with an Italian voice</label>
        <div className="row">
          <select value={s.voiceLa || ''} onChange={e => settingsStore.set({ voiceLa: e.target.value || null })} style={{ flex: 1, minWidth: 200 }}>
            <option value="">Best available{la[0] ? ` — ${la[0].name}` : ''}</option>
            {la.map(v => <option key={v.voiceURI} value={v.voiceURI}>{label(v)}</option>)}
          </select>
          <button className="btn sm" onClick={() => sample('la', s.voiceLa || (la[0] && la[0].voiceURI))}>▶ Hear it</button>
        </div>
        <div className="help">
          {isMac ? <>Better voices are free from Apple: on a Mac open System Settings → Accessibility → Spoken Content → System Voice → Manage Voices, and download an <b>Enhanced</b> or <b>Premium</b> English voice (Ava, Zoe, Evan, Serena and Daniel are good). On an iPhone: Settings → Accessibility → Spoken Content → Voices. They appear here after a reload.</>
            : isWin ? <>On Windows the natural voices come with Microsoft Edge — open this site in Edge and pick a voice marked <b>natural</b>. In Chrome the "Google" voices are the clearest.</>
            : <>In Chrome the "Google" voices are the clearest; on Android install a higher-quality voice under Settings → Accessibility → Text-to-speech.</>}
        </div>
      </div>

      <div className="togglelist">
        <Toggle on={!!s.studioVoice} set={v => settingsStore.set({ studioVoice: v })} label="Studio voice" help="Read with OpenAI's neural voice instead. Each verse is fetched as it is read, so it needs a connection; about a cent for a chapter" />
      </div>
      {s.studioVoice && <>
        <div className="field">
          <label>OpenAI API key</label>
          <input type="password" value={s.ttsKey || ''} onChange={e => settingsStore.set({ ttsKey: e.target.value.trim() })} placeholder="sk-…" autoComplete="off" />
          <div className="help">Stored only in this browser and sent straight to OpenAI. Get one at platform.openai.com. Without a key the browser voice is used.</div>
        </div>
        <div className="field">
          <label>Voice</label>
          <div className="row">
            <select value={s.ttsVoice || 'sage'} onChange={e => settingsStore.set({ ttsVoice: e.target.value })} style={{ flex: 1, minWidth: 200 }}>{STUDIO_VOICES.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
            <button className="btn sm" onClick={() => sample('en')} disabled={!s.ttsKey}>▶ Hear it</button>
            <button className="btn sm" onClick={() => sample('la')} disabled={!s.ttsKey}>▶ Latin</button>
          </div>
        </div>
      </>}
    </div>
  );
}

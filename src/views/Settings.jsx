import VoiceSettings from '../components/VoiceSettings';
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { data, useSettings, settingsStore, exportProgress, importProgress, progressStore, notesStore, memoryStore, syncText, importSyncText, cloudPush, cloudPull, withBase } from '../store';

const Toggle = ({ on, set, label, help }) => <label className={'toggle' + (on ? ' on' : '')}><input type="checkbox" checked={on} onChange={e => set(e.target.checked)} /><span className="sw" /><span><b>{label}</b>{help && <small>{help}</small>}</span></label>;

export default function Settings() {
  const s = useSettings();
  const [msg, setMsg] = useState('');
  const [sync, setSync] = useState(''); const [code, setCode] = useState(s.syncId || '');
  const [off, setOff] = useState(null);
  const file = useRef(null);
  function download() {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `via-vulgata-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  }
  function upload(e) {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => { try { importProgress(t, true); setMsg('Progress, notes and memory cards restored (merged with what was here).'); } catch { setMsg('That file could not be read.'); } });
  }
  async function makeSync() { setSync(await syncText()); try { await navigator.clipboard.writeText(await syncText()); setMsg('Sync text copied — paste it into Settings on your other device.'); } catch { setMsg('Sync text ready below — copy it to your other device.'); } }
  async function pasteSync() { try { const t = await navigator.clipboard.readText(); await importSyncText(t, true); setMsg('Merged the sync text from your clipboard.'); } catch (e) { setMsg('Nothing usable on the clipboard — paste the sync text into the box below instead.'); } }
  async function push() { setMsg('Sending…'); try { const id = await cloudPush(); setCode(id); setMsg(`Saved to the cloud. Your sync code is ${id} — enter it on another device to pull.`); } catch (e) { setMsg('Cloud sync is not reachable right now (' + e.message + '). The sync text and backups still work.'); } }
  async function pull() { if (!code.trim()) return; setMsg('Fetching…'); try { await cloudPull(code.trim(), true); setMsg('Merged from the cloud.'); } catch (e) { setMsg(e.message); } }
  async function cacheAll() {
    // Fetching through the service worker stores each file in its offline cache.
    const files = []; for (const b of data.books) { files.push(`/data/text/vul/${b.id}.json`, `/data/text/drc/${b.id}.json`, `/data/xref/${b.id}.json`, `/data/speakers/${b.id}.json`); for (const v of data.versions) if (v.id !== 'drc' && v.books.includes(b.id)) files.push(`/data/text/${v.id}/${b.id}.json`); }
    files.push('/data/latin.json'); for (const url of Object.values(data.timeline.artFiles)) if (url.startsWith('/')) files.push(url);
    let n = 0; setOff({ n, total: files.length });
    for (let i = 0; i < files.length; i += 6) { await Promise.all(files.slice(i, i + 6).map(f => fetch(withBase(f)).catch(() => {}))); n = Math.min(files.length, i + 6); setOff({ n, total: files.length }); }
    setMsg(navigator.serviceWorker?.controller ? 'Everything is stored for offline reading.' : 'Files fetched. Offline storage needs the installed app (service worker) — open the site over https and reload once.');
  }
  return (
    <div className="page fade-in" style={{ maxWidth: 760 }}>
      <div className="eyebrow">Settings</div>
      <h1 className="title">Your reading</h1>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="field">
          <label>Text shown while reading</label>
          <div className="seg">
            <button className={s.mode === 'la' ? 'on' : ''} onClick={() => settingsStore.set({ mode: 'la' })}>Latin only</button>
            <button className={s.mode === 'parallel' ? 'on' : ''} onClick={() => settingsStore.set({ mode: 'parallel' })}>Latin + English</button>
            <button className={s.mode === 'en' ? 'on' : ''} onClick={() => settingsStore.set({ mode: 'en' })}>English only</button>
          </div>
        </div>
        <div className="field">
          <label>Theme</label>
          <div className="seg"><button className={s.theme === 'day' ? 'on' : ''} onClick={() => settingsStore.set({ theme: 'day' })}>Day</button><button className={(s.theme || 'auto') === 'auto' ? 'on' : ''} onClick={() => settingsStore.set({ theme: 'auto' })}>Follow the device</button><button className={s.theme === 'night' ? 'on' : ''} onClick={() => settingsStore.set({ theme: 'night' })}>Lights out</button></div>
          <div className="help">Lights-out is a warm, low-light page for reading in bed. Press T anywhere to switch.</div>
        </div>
        <div className="field">
          <label>English version</label>
          <div className="vlist">
            {data.versions.filter(v => !['grc', 'heb'].includes(v.id)).map(v => (
              <label key={v.id} className={(s.enVersion || 'drc') === v.id ? 'on' : ''}>
                <input type="radio" name="ver" checked={(s.enVersion || 'drc') === v.id} onChange={() => settingsStore.set({ enVersion: v.id })} />
                <span><b>{v.long}</b><span className="tr">{v.tradition}</span><p>{v.blurb}{v.id !== 'drc' && ` Covers ${v.books.length} of the Vulgate's 73 books.`}</p></span>
              </label>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Text size — {s.fontSize}px</label>
          <input type="range" min="14" max="28" value={s.fontSize} onChange={e => settingsStore.set({ fontSize: +e.target.value })} style={{ width: '100%', accentColor: 'var(--gold)' }} />
        </div>
        <div className="togglelist">
          <Toggle on={s.livingArt !== false} set={v => settingsStore.set({ livingArt: v })} label="The gallery wall" help="A slow, dimmed collage of the app's paintings drifting behind every page. Turn it off for a plain page or on an older phone" />
          <Toggle on={s.showSpeakers !== false} set={v => settingsStore.set({ showSpeakers: v })} label="Who is speaking" help="Colour the words of Jesus (red), God (gold), angels (blue) and named people — worked out from the quotation marks of the World English Bible, so treat it as a guide" />
          <Toggle on={!!s.showOriginal} set={v => settingsStore.set({ showOriginal: v })} label="Original Greek and Hebrew" help="Show the Greek New Testament (SBLGNT) or Hebrew Bible (Leningrad Codex) under each verse. Tap any word for its Strong's entry and every other place it appears" />
          <Toggle on={s.showXrefs !== false} set={v => settingsStore.set({ showXrefs: v })} label="Cross-references" help="⇄ marks after verses, with the passages that echo them" />
          <Toggle on={s.latinHelp !== false} set={v => settingsStore.set({ latinHelp: v })} label="Latin word help" help="Tap any Latin word for its dictionary form, part of speech and meaning" />
          <Toggle on={s.showGlosses !== false} set={v => settingsStore.set({ showGlosses: v })} label="Passage notes" help={`${data.notes.length} short notes under significant verses, Old and New Testament`} />
          <Toggle on={s.showArtInline !== false} set={v => settingsStore.set({ showArtInline: v })} label="Art and sources beside the verses" help="When hidden, they stay in the Context panel" />
          <Toggle on={s.markDiffs !== false} set={v => settingsStore.set({ markDiffs: v })} label="Mark verses that read differently" help="When another English version is laid over the Vulgate grid" />
          <Toggle on={s.dailyScope === 'all'} set={v => settingsStore.set({ dailyScope: v ? 'all' : 'nt' })} label="Daily five from the whole Bible" help="Off: five New Testament passages a day. On: Old Testament passages too" />
        </div>
      </div>

      <VoiceSettings />

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Ask Claude</div>
        <div className="field">
          <label>Anthropic API key</label>
          <input type="password" value={s.apiKey} onChange={e => settingsStore.set({ apiKey: e.target.value.trim() })} placeholder="sk-ant-…" autoComplete="off" />
          <div className="help">Stored only in this browser and sent straight to Anthropic when you ask a question. Get one at console.anthropic.com. Each question costs a fraction of a cent.</div>
        </div>
        <div className="field">
          <label>Model</label>
          <input type="text" value={s.model} onChange={e => settingsStore.set({ model: e.target.value.trim() })} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Sync between devices</div>
        <div className="help" style={{ marginTop: 6 }}>Your progress, highlights, notes and memory cards live on this device. Three ways to carry them across — all merge, nothing is lost.</div>
        <div className="field"><label>1 · Sync text (works everywhere)</label>
          <div className="row"><button className="btn" onClick={makeSync}>Copy sync text</button><button className="btn" onClick={pasteSync}>Paste sync text</button></div>
          {sync && <textarea readOnly value={sync} rows={3} style={{ marginTop: 8, fontSize: 11, fontFamily: 'monospace' }} onFocus={e => e.target.select()} />}
          <textarea placeholder="…or paste a sync text from another device here and press Merge" rows={2} style={{ marginTop: 8, fontSize: 12 }} id="synctext" />
          <div className="row" style={{ marginTop: 6 }}><button className="btn sm" onClick={async () => { try { await importSyncText(document.getElementById('synctext').value, true); setMsg('Merged.'); } catch (e) { setMsg('That is not a sync text.'); } }}>Merge</button></div>
          <div className="help">Copy on one device, paste on the other — AirDrop, iMessage, email, the universal clipboard: anything that moves text.</div>
        </div>
        <div className="field"><label>2 · Cloud code</label>
          <div className="row"><button className="btn" onClick={push}>{s.syncId ? 'Push to the cloud' : 'Create a sync code'}</button><input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="sync code" style={{ width: 200 }} /><button className="btn" onClick={pull} disabled={!code.trim()}>Pull</button></div>
          <div className="help">Uses a small public JSON store (jsonblob.com); the code is the only key, so keep it private. Codes expire after 30 days without use. Push after reading, pull on the other device.</div>
        </div>
        <div className="field"><label>3 · Backup file</label>
          <div className="row"><button className="btn" onClick={download}>Download backup</button><button className="btn" onClick={() => file.current.click()}>Restore from backup</button><input ref={file} type="file" accept="application/json" hidden onChange={upload} /></div>
        </div>
        {msg && <div className="help" style={{ color: 'var(--accent)', marginTop: 8 }}>{msg}</div>}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Offline</div>
        <div className="help" style={{ marginTop: 6 }}>Chapters you open are kept for offline reading automatically. To have the whole Bible, every version, the cross-references, the Latin dictionary and the art ready before a flight or a retreat, store everything now (about 45 MB).</div>
        <div className="row" style={{ marginTop: 10 }}><button className="btn solid" onClick={cacheAll} disabled={!!off && off.n < off.total}>{off && off.n < off.total ? `Storing… ${off.n}/${off.total}` : 'Store everything for offline'}</button>{off && off.n >= off.total && <span className="chip gold">✓ stored</span>}</div>
        <div className="help" style={{ marginTop: 10 }}>On iPhone: open this page in Safari, tap Share, then <b>Add to Home Screen</b>. On Android or desktop Chrome: use <b>Install app</b> in the browser menu.</div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="eyebrow">Start over</div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn ghost" onClick={() => { if (confirm('Clear every verse you have marked as read? Highlights, notes and memory cards stay. This cannot be undone.')) { progressStore.replace({ read: {}, last: null, log: [] }); setMsg('Progress cleared.'); } }}>Clear reading progress</button>
          <button className="btn ghost" onClick={() => { if (confirm('Delete all highlights, notes and memory cards?')) { notesStore.replace({ hl: {}, notes: {} }); memoryStore.replace({ cards: [] }); setMsg('Notebook and deck cleared.'); } }}>Clear notebook & deck</button>
        </div>
      </div>

      <div className="help" style={{ marginTop: 18 }}>
        Texts: Clementine Vulgate, Douay-Rheims, King James, World English Bible and JPS 1917 (public domain), via the scrollmapper bible_databases and open-bibles projects. Cross-references: OpenBible.info (CC-BY). Latin dictionary: William Whitaker's WORDS (public domain). Lectionary tables compiled from the Roman Missal. Artworks are public-domain reproductions from Wikimedia Commons. Timeline compiled from the author's study notes. Keyboard: <Link to="/read/GEN/1">← → chapters</Link>, / search, T theme.
      </div>
    </div>
  );
}

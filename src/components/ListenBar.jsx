import React, { useEffect, useState } from 'react';
import { subscribeSpeech, pause, resume, stop, skip, speechSupported, setRate } from '../speech';
import { useSettings } from '../store';

// Floating playback bar shown while something is being read aloud.
export default function ListenBar() {
  const [st, setSt] = useState({ playing: false, idx: -1, items: [], title: '' });
  const s = useSettings();
  useEffect(() => subscribeSpeech(setSt), []);
  useEffect(() => { setRate(s.voiceRate || 1); }, [s.voiceRate]);
  if (!speechSupported || (!st.items.length)) return null;
  const cur = st.items[st.idx];
  return (
    <div className="listenbar" role="region" aria-label="Now reading">
      <button className="ib" onClick={() => skip(-1)} aria-label="Previous">‹</button>
      <button className="ib main" onClick={() => st.playing ? pause() : resume()} aria-label={st.playing ? 'Pause' : 'Play'}>{st.playing ? '❚❚' : '▶'}</button>
      <button className="ib" onClick={() => skip(1)} aria-label="Next">›</button>
      <div className="lb-info"><div className="lb-t">{st.title}</div><div className="lb-s">{cur ? `${cur.label || ''} · ${st.idx + 1} of ${st.items.length}` : 'finished'}</div></div>
      <button className="ib x" onClick={stop} aria-label="Stop">×</button>
    </div>
  );
}

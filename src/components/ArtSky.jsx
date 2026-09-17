import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { data, useSettings, withBase } from '../store';
import { useIsMobile } from '../hooks';

// The gallery wall: a slow, dimmed collage of the app's own paintings drifting behind every page.
// Columns drift at different speeds; every so often one picture fades into another.
// Wikipedia titles of the paintings among the bundled art (maps and photographs are left out)
const PAINTINGS = ["The_Creation_of_Adam", "The_Subsiding_of_the_Waters_of_the_Deluge", "The_Tower_of_Babel_(Bruegel)", "Isaac", "Sodom_and_Gomorrah", "Sacrifice_of_Isaac_(Caravaggio)", "Jacob_Wrestling_with_the_Angel", "Joseph_(Genesis)", "Moses", "Burning_bush", "Plagues_of_Egypt", "Crossing_the_Red_Sea", "The_Adoration_of_the_Golden_Calf", "Manna", "Deborah", "Book_of_Ruth", "Samuel", "Saul", "Elijah", "Elisha", "Amos_(prophet)", "Isaiah", "Jeremiah_Lamenting_the_Destruction_of_Jerusalem", "Psalm_137", "Ezekiel", "Nehemiah", "Belshazzar's_Feast_(Rembrandt)", "Adoration_of_the_Shepherds", "Baptism_of_Jesus", "Sermon_on_the_Mount", "The_Three_Crosses", "Pentecost", "Saint_Stephen", "Conversion_on_the_Way_to_Damascus", "Paul_the_Apostle", "Battle_of_the_Milvian_Bridge", "Saint_Jerome_in_His_Study_(Dürer)", "Expulsion_from_the_Garden_of_Eden", "Cain_and_Abel", "Samson_and_Delilah_(Rubens)", "David_with_the_Head_of_Goliath_(Caravaggio,_Rome)", "Judgement_of_Solomon", "Jonah", "Daniel_in_the_Lions'_Den", "Job_(biblical_figure)", "Esther", "The_Storm_on_the_Sea_of_Galilee", "The_Return_of_the_Prodigal_Son_(Rembrandt)", "Transfiguration_(Raphael)", "The_Raising_of_Lazarus_(Sebastiano_del_Piombo)", "The_Last_Supper_(Leonardo)", "Supper_at_Emmaus_(Caravaggio,_London)", "Four_Horsemen_of_the_Apocalypse"];
const src = wp => withBase(data.timeline.artFiles[wp]);

// a day-seeded shuffle so the wall is the same all day but different tomorrow
function seeded(n) { let s = n; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function shuffle(arr, rnd) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function Tile({ initial, pool, swapEvery, index }) {
  const [imgs, setImgs] = useState([initial, null]); const [front, setFront] = useState(0);
  const timer = useRef(null); const frontRef = useRef(0);
  useEffect(() => {
    if (!swapEvery) return;
    // stagger tiles so only one picture changes at a time
    const first = 2500 + swapEvery * (((index * 7) % 16) / 16);
    let t2;
    timer.current = setTimeout(function tick() {
      const back = 1 - frontRef.current; frontRef.current = back;
      setImgs(cur => { let next = pool[Math.floor(Math.random() * pool.length)]; if (next === cur[1 - back]) next = pool[(pool.indexOf(next) + 1) % pool.length]; const n = [...cur]; n[back] = next; return n; });
      setFront(back);
      t2 = setTimeout(tick, swapEvery);
    }, first);
    return () => { clearTimeout(timer.current); clearTimeout(t2); };
  }, [swapEvery, pool, index]); // eslint-disable-line
  return (
    <div className="sky-tile">
      {imgs.map((f, i) => f && <img key={i + f} src={src(f)} alt="" loading="lazy" decoding="async" className={i === front ? 'on' : ''} />)}
    </div>
  );
}

export default function ArtSky() {
  const s = useSettings(); const mobile = useIsMobile(); const loc = useLocation();
  const inReader = loc.pathname.startsWith('/read/');
  const on = s.livingArt !== false;
  const cols = mobile ? 2 : 4, per = mobile ? 4 : 4;
  const columns = useMemo(() => {
    const d = new Date(); const rnd = seeded(d.getFullYear() * 400 + d.getMonth() * 32 + d.getDate());
    const order = shuffle(PAINTINGS, rnd); const out = [];
    for (let c = 0; c < cols; c++) out.push(order.slice(c * per, c * per + per));
    return out;
  }, [cols, per]);
  if (!on) return null;
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div className={'sky' + (inReader ? ' quiet' : '') + (mobile ? ' m' : '')} aria-hidden="true">
      {columns.map((files, c) => (
        <div key={c} className="sky-col" style={{ '--dur': `${34 + c * 9}s`, '--delay': `${-c * 13}s`, '--dir': c % 2 ? -1 : 1 }}>
          {files.map((f, i) => <Tile key={c + '-' + i} initial={f} pool={PAINTINGS} swapEvery={reduce ? 0 : 32000} index={c * per + i} />)}
        </div>
      ))}
      <div className="sky-veil" />
    </div>
  );
}

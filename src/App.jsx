import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useData, useSettings, settingsStore } from './store';
import { useIsMobile, useTheme } from './hooks';
import Home from './views/Home';
import Books from './views/Books';
import Book from './views/Book';
import Reader from './views/Reader';
import Timeline from './views/Timeline';
import Event from './views/Event';
import Journey from './views/Journey';
import Settings from './views/Settings';
import People, { Person } from './views/People';
import Harmony from './views/Harmony';
import Prophecy from './views/Prophecy';
import Calendar from './views/Calendar';
import Notebook from './views/Notebook';
import Memory from './views/Memory';
import Study from './views/Study';
import Explore from './views/Explore';
import Saints, { Saint } from './views/Saints';
import Diagrams, { Diagram } from './views/Diagrams';
import Quiz from './views/Quiz';
import Story, { Stop } from './views/Story';
import Lists from './views/Lists';
import Hours, { Examen, Psalms } from './views/Hours';
import RosaryPlayer from './views/RosaryPlayer';
import Gallery from './views/Gallery';
import Review from './views/Review';
import Latin, { Lesson, Alphabets } from './views/Latin';
import Prayer, { Rosary, Stations, Mercy, Lectio } from './views/Prayer';
import QuickSearch from './components/QuickSearch';
import ListenBar from './components/ListenBar';
import ArtSky from './components/ArtSky';
import { setVoices, setStudio, setRate } from './speech';

const I = {
  home: <svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>,
  books: <svg viewBox="0 0 24 24"><path d="M4 4h5a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6z"/></svg>,
  journey: <svg viewBox="0 0 24 24"><path d="M5 20c0-6 4-6 7-9s3-6 0-8M12 3l3 1-3 1M5 20l2 1-2 1"/><circle cx="12" cy="12" r="1.5"/></svg>,
  time: <svg viewBox="0 0 24 24"><path d="M3 12h18M7 12V8M12 12V5M17 12V9M7 12v4M12 12v6M17 12v3"/></svg>,
  map: <svg viewBox="0 0 24 24"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/></svg>,
  today: <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v5M9.5 15.5h5"/></svg>,
  study: <svg viewBox="0 0 24 24"><path d="M12 3l9 4.5-9 4.5-9-4.5z"/><path d="M5 10v5c0 1.5 3 3.5 7 3.5s7-2 7-3.5v-5"/></svg>,
  people: <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5c3 0 5.5 2 5.5 5"/></svg>,
  search: <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/></svg>,
  star: <svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>,
  note: <svg viewBox="0 0 24 24"><path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4M8 13h8M8 17h5"/></svg>,
  gear: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>,
};

export default function App() {
  const d = useData();
  const s = useSettings();
  const loc = useLocation();
  const mobile = useIsMobile();
  useTheme();
  const [search, setSearch] = useState(false);
  useEffect(() => { document.documentElement.style.setProperty('--fs', s.fontSize + 'px'); document.documentElement.dataset.font = s.font || 'serif'; }, [s.fontSize, s.font]);
  useEffect(() => { setVoices({ en: s.voiceEn || null, la: s.voiceLa || null }); setStudio({ key: s.ttsKey || '', voice: s.ttsVoice || 'sage', on: !!s.studioVoice }); setRate(s.voiceRate || 1); }, [s.voiceEn, s.voiceLa, s.ttsKey, s.ttsVoice, s.studioVoice, s.voiceRate]);
  useEffect(() => { if (!loc.pathname.startsWith('/read')) window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => {
    const k = e => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); setSearch(true); }
      else if (e.key === 't') { const cur = settingsStore.get().theme || 'auto'; const night = document.documentElement.dataset.theme === 'night'; settingsStore.set({ theme: night ? 'day' : 'night' }); void cur; }
      else if (e.key === '?') { alert('Keyboard\n\n/  search or jump to a passage\n← →  previous / next chapter\n↑ ↓  move between verses · space marks a verse · H verse tools\nM  mark the chapter read\nL  read aloud · C  context panel · O  reading options\nT  day / lights-out\nEsc closes any panel'); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  if (!d) return <div className="loading">Opening the book…</div>;
  const inReader = loc.pathname.startsWith('/read/');
  const on = (paths) => paths.some(p => loc.pathname === p || loc.pathname.startsWith(p + '/') || loc.pathname.startsWith(p + '?'));
  return (<>
    <ArtSky />
    <div className={'shell' + (mobile ? ' m' : '') + (mobile && inReader ? ' in-reader' : '')}>
      <nav className="nav" aria-label="Main">
        <div className="brand" title="Christ is King">✦</div>
        <NavLink to="/" end className={({ isActive }) => isActive ? 'on' : ''}>{I.home}<span>Home</span></NavLink>
        <NavLink to="/books" className={() => on(['/books', '/read', '/book']) ? 'on' : ''}>{I.books}<span>Bible</span></NavLink>
        {mobile ? <>
          <NavLink to="/calendar" className={({ isActive }) => isActive ? 'on' : ''}>{I.today}<span>Today</span></NavLink>
          <NavLink to="/study" className={() => on(['/study', '/people', '/harmony', '/prophecy', '/notebook', '/memory', '/timeline', '/event', '/explore', '/journey', '/saints', '/prayer', '/diagrams', '/quiz', '/story', '/lists', '/gallery', '/psalms', '/review', '/latin', '/alphabets']) ? 'on' : ''}>{I.study}<span>Study</span></NavLink>
        </> : <>
          <NavLink to="/journey" className={({ isActive }) => isActive ? 'on' : ''}>{I.journey}<span>Journey</span></NavLink>
          <NavLink to="/calendar" className={({ isActive }) => isActive ? 'on' : ''}>{I.today}<span>Today</span></NavLink>
          <NavLink to="/explore" className={() => on(['/explore', '/timeline', '/event']) ? 'on' : ''}>{I.map}<span>Explore</span></NavLink>
          <NavLink to="/people" className={({ isActive }) => isActive ? 'on' : ''}>{I.people}<span>People</span></NavLink>
          <NavLink to="/study" className={() => on(['/study', '/harmony', '/prophecy', '/saints', '/prayer', '/diagrams', '/quiz', '/story', '/lists', '/gallery', '/psalms', '/review', '/latin', '/alphabets']) ? 'on' : ''}>{I.study}<span>Study</span></NavLink>
          <NavLink to="/notebook" className={({ isActive }) => isActive ? 'on' : ''}>{I.note}<span>Notes</span></NavLink>
          <NavLink to="/memory" className={({ isActive }) => isActive ? 'on' : ''}>{I.star}<span>Memory</span></NavLink>
          <button className="navbtn" onClick={() => setSearch(true)} title="Search (/)">{I.search}<span>Search</span></button>
        </>}
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'on' : ''}>{I.gear}<span>Settings</span></NavLink>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          <Route path="/book/:id" element={<Book />} />
          <Route path="/read/:id/:c" element={<Reader />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/event/:id" element={<Event />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/people" element={<People />} />
          <Route path="/people/:id" element={<Person />} />
          <Route path="/harmony" element={<Harmony />} />
          <Route path="/prophecy" element={<Prophecy />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/notebook" element={<Notebook />} />
          <Route path="/memory" element={<Memory />} />
          <Route path="/study" element={<Study />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/saints" element={<Saints />} />
          <Route path="/saints/:d" element={<Saint />} />
          <Route path="/diagrams" element={<Diagrams />} />
          <Route path="/diagrams/:id" element={<Diagram />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/story" element={<Story />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/lists/:id" element={<Lists />} />
          <Route path="/story/:n" element={<Stop />} />
          <Route path="/prayer" element={<Prayer />} />
          <Route path="/prayer/rosary" element={<Rosary />} />
          <Route path="/prayer/rosary/pray" element={<RosaryPlayer />} />
          <Route path="/prayer/stations" element={<Stations />} />
          <Route path="/prayer/mercy" element={<Mercy />} />
          <Route path="/prayer/lectio" element={<Lectio />} />
          <Route path="/prayer/hours/:which" element={<Hours />} />
          <Route path="/prayer/examen" element={<Examen />} />
          <Route path="/psalms" element={<Psalms />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/review" element={<Review />} />
          <Route path="/latin" element={<Latin />} />
          <Route path="/latin/:n" element={<Lesson />} />
          <Route path="/alphabets" element={<Alphabets />} />
        </Routes>
      </main>
      {mobile && !inReader && <button className="fab-search" onClick={() => setSearch(true)} aria-label="Search">{I.search}</button>}
      <QuickSearch open={search} onClose={() => setSearch(false)} />
      <ListenBar />
    </div>
  </>);
}

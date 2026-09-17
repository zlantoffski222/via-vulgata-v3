import React from 'react';
import { Link } from 'react-router-dom';
import { data, useMemory, useNotes, useProgress, useSettings, goalStatus } from '../store';
import { liturgicalDay } from '../lectionary';
import { Ways } from './Home';

// Hub for everything beyond the reader: people, journeys, harmony, prophecy, calendar, notebook, memory deck.
export default function Study() {
  const m = useMemory(); const n = useNotes(); const p = useProgress(); const s = useSettings();
  const due = m.cards.filter(c => c.due <= Date.now()).length; const nb = Object.keys(n.hl).length + Object.keys(n.notes).length;
  const day = liturgicalDay(new Date()); const g = goalStatus(p, s);
  const items = [
    ['/calendar', 'Today', day.name, 'The Church\'s calendar and the readings of the day, with five passages chosen for today.'],
    ['/explore', 'Timeline & map', `${data.timeline.events.length} events · ${Object.keys(data.timeline.locs).length} places`, 'The interactive chronicle: zoom through 4,000 years, play the journeys of Abraham, Moses, Jesus and Paul on the map.'],
    ['/people', 'People', `${data.people.length} lives`, 'From Adam to Timothy — portraits, chapters, events and places for every major figure.'],
    ['/harmony', 'Harmony of the Gospels', `${data.harmony?.sections.reduce((a, s) => a + s.items.length, 0) || 0} scenes`, 'The life of Christ scene by scene, with Matthew, Mark, Luke and John side by side.'],
    ['/prophecy', 'Prophecy & fulfilment', `${data.prophecy.length} pairs`, 'Old Testament promises beside the New Testament passages that claim them — and the Hebrew reading alongside.'],
    ['/journey', 'Reading plan & goal', g ? `${g.left} chapters to go · ${g.daysLeft} days` : 'set a goal', 'Canonical or story order, and a finishing date that tells you how much to read each day.'],
    ['/notebook', 'Notebook', nb ? `${nb} highlights & notes` : 'empty', 'Everything you have highlighted or written, by book. Export it as Markdown.'],
    ['/memory', 'Memory verses', m.cards.length ? `${due} due · ${m.cards.length} cards` : 'start a deck', 'Learn verses by heart with spaced repetition — in English or Latin.'],
    ['/timeline', 'Chronicle', 'the story in order', 'Every event as a reading list with its art and passages.'],
  ];
  return (
    <div className="page fade-in">
      <div className="eyebrow">Study</div>
      <h1 className="title">Ways into the book</h1>
      <Ways />
      <div className="section-h" style={{ marginTop: 18 }}><span className="eyebrow">Also</span></div>
      <div className="study-grid">{items.filter(([to]) => ['/calendar', '/timeline'].includes(to)).map(([to, t, sub, d]) => <Link key={to} to={to} className="study"><div className="h">{t}</div><div className="sub">{sub}</div><div className="d">{d}</div></Link>)}</div>
    </div>
  );
}

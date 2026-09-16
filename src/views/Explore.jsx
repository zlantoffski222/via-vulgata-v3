import React from 'react';
import { Link } from 'react-router-dom';
import { data } from '../store';
import EngineHost from '../components/EngineHost';

// The timeline and map on their own page (the phone's way in, and a full-width view on desktop).
export default function Explore() {
  return (
    <div className="page fade-in explore">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div><div className="eyebrow">Explore</div><h1 className="title">Timeline &amp; map</h1></div>
        <div className="row" style={{ gap: 6 }}>{data.journeys.map(j => <Link key={j.id} className="chip" to={`/explore?route=${j.id}`} style={{ textDecoration: 'none', borderColor: j.color, color: j.color }}>⟶ {j.name.replace("'s journey", '').replace('Paul\'s ', 'Paul ')}</Link>)}</div>
      </div>
      <EngineHost />
    </div>
  );
}

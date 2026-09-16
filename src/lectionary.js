// Roman calendar (Ordinary Form) computation: season, week, cycle and the day's principal readings.
import { data } from './store';

const DAY = 86400000;
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const md = d => ymd(d).slice(5);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sameDay = (a, b) => ymd(a) === ymd(b);
const local = (y, m, d) => new Date(y, m - 1, d);

export function easter(y) { // Meeus/Jones/Butcher
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1; return local(y, month, day);
}
function adventStart(y) { const xmas = local(y, 12, 25); const dow = xmas.getDay(); const adv4 = addDays(xmas, -(dow === 0 ? 7 : dow)); return addDays(adv4, -21); }
function epiphanySunday(y) { const d = local(y, 1, 2); return addDays(d, (7 - d.getDay()) % 7); } // Sunday between Jan 2 and 8 (transferred, as in most English-speaking countries)
function baptismSunday(y) { const ep = epiphanySunday(y); return ep.getDate() >= 7 ? addDays(ep, 1) : addDays(ep, 7); }

export const CYCLE = y => ['C', 'A', 'B'][y % 3]; // liturgical year: 2025 = C, 2026 = A
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORD = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');

// Returns { name, season, cycle, weekdayCycle, key (sundays table key), readings: [ref strings], feast, rank, color }
export function liturgicalDay(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const y = d.getFullYear();
  const dow = d.getDay(); const L = data.lectionary || { sundays: {}, feasts: {}, weekdayGospels: {} };
  const adv = adventStart(y); const litYear = d >= adv ? y + 1 : y; const cycle = CYCLE(litYear); const wcycle = litYear % 2 ? 'I' : 'II';
  const E = easter(y); const ash = addDays(E, -46), palm = addDays(E, -7), pent = addDays(E, 49), trinity = addDays(E, 56), corpus = addDays(E, 63), sacred = addDays(E, 68), ascension = addDays(E, 42); // kept on the seventh Sunday of Easter, as in most English-speaking dioceses
  const xmas = local(y, 12, 25); const bapt = baptismSunday(y);
  const res = { date: d, cycle, weekdayCycle: wcycle, weekday: WEEKDAYS[dow], readings: [], color: 'green', key: null, season: 'Ordinary Time', name: '' };
  const S = (key, cyc) => { const t = L.sundays[key]; return t ? (t[cyc] || t['*'] || []) : []; };
  const feast = L.feasts[md(d)];
  // ---- seasons
  if (d >= adv && d < xmas) { // Advent (of next liturgical year)
    const wk = Math.floor((d - adv) / DAY / 7) + 1; res.season = 'Advent'; res.color = wk === 3 && dow === 0 ? 'rose' : 'violet';
    if (d >= local(y, 12, 24) && dow !== 0) { res.name = 'December ' + d.getDate() + ' — late Advent'; }
    else if (dow === 0) { res.key = 'ADV' + wk; res.name = ORD(wk) + ' Sunday of Advent'; res.readings = S(res.key, cycle); }
    else res.name = WEEKDAYS[dow] + ' of the ' + ORD(wk) + ' week of Advent';
    if (sameDay(d, local(y, 12, 24))) { res.name = 'Christmas Eve'; res.key = 'XMAS_VIGIL'; res.readings = S('XMAS_VIGIL'); res.color = 'white'; }
    else if (feast && feast.rank === 1 && dow !== 0) { res.name = feast.n; res.readings = feast.r['*'] || []; res.feast = true; res.color = 'white'; }
    return finish(res, L, dow);
  }
  if (sameDay(d, bapt)) { res.season = 'Christmas'; res.color = 'white'; res.name = 'The Baptism of the Lord'; res.key = 'BAPTISM'; res.readings = S('BAPTISM', cycle); return finish(res, L, dow); }
  if (d >= xmas || d < bapt) { // Christmas season
    res.season = 'Christmas'; res.color = 'white';
    const holyFamily = xmas.getDay() === 0 ? local(y, 12, 30) : addDays(xmas, 7 - xmas.getDay());
    if (sameDay(d, xmas)) { res.name = 'The Nativity of the Lord — Christmas'; res.key = 'XMAS_DAY'; res.readings = [...S('XMAS_NIGHT'), ...S('XMAS_DAY')]; }
    else if (sameDay(d, local(y, 1, 1))) { res.name = 'Solemnity of Mary, Mother of God (Octave of Christmas)'; res.key = 'MOTHEROFGOD'; res.readings = S('MOTHEROFGOD'); }
    else if (d < xmas && sameDay(d, epiphanySunday(y))) { res.name = 'The Epiphany of the Lord'; res.key = 'EPIPHANY'; res.readings = S('EPIPHANY'); }
    else if (d >= xmas && sameDay(d, holyFamily)) { res.name = 'The Holy Family of Jesus, Mary and Joseph'; res.key = 'HOLYFAMILY'; res.readings = S('HOLYFAMILY', cycle); }
    else if (feast) { res.name = feast.n; res.readings = feast.r[cycle] || feast.r['*'] || []; res.feast = true; res.color = /Stephen|Innocents/.test(feast.n) ? 'red' : 'white'; }
    else if (dow === 0) { res.name = d < xmas ? 'Second Sunday after Christmas' : 'Sunday in the Octave of Christmas'; }
    else res.name = d >= xmas ? WEEKDAYS[dow] + ' in the Octave of Christmas' : WEEKDAYS[dow] + ' of Christmas time';
    return finish(res, L, dow);
  }
  if (d >= ash && d < E) { // Lent
    res.season = 'Lent'; res.color = 'violet';
    if (sameDay(d, ash)) { res.name = 'Ash Wednesday'; res.key = 'ASH'; res.readings = S('ASH'); }
    else if (d < addDays(ash, 4)) res.name = WEEKDAYS[dow] + ' after Ash Wednesday';
    else if (d >= palm) { res.season = 'Holy Week';
      if (dow === 0) { res.name = 'Palm Sunday of the Passion of the Lord'; res.key = 'PALM'; res.readings = S('PALM', cycle); res.color = 'red'; }
      else if (dow === 4) { res.name = 'Holy Thursday — Mass of the Lord\'s Supper'; res.key = 'HOLYTHU'; res.readings = S('HOLYTHU'); res.color = 'white'; }
      else if (dow === 5) { res.name = 'Good Friday of the Passion of the Lord'; res.key = 'GOODFRI'; res.readings = S('GOODFRI'); res.color = 'red'; }
      else if (dow === 6) { res.name = 'Holy Saturday — the Easter Vigil'; res.key = 'VIGIL'; res.readings = S('VIGIL', cycle); res.color = 'white'; }
      else res.name = WEEKDAYS[dow] + ' of Holy Week';
    } else { const wk = Math.floor((d - addDays(ash, 4)) / DAY / 7) + 1; if (dow === 0) { res.key = 'LENT' + wk; res.name = ORD(wk) + ' Sunday of Lent'; res.readings = S(res.key, cycle); if (wk === 4) res.color = 'rose'; } else res.name = WEEKDAYS[dow] + ' of the ' + ORD(wk) + ' week of Lent'; }
    if (feast && feast.rank === 1 && !res.key && dow !== 0) { res.name = feast.n; res.readings = feast.r['*'] || []; res.feast = true; res.color = 'white'; }
    return finish(res, L, dow);
  }
  if (d >= E && d <= pent) { // Easter season
    res.season = 'Easter'; res.color = 'white';
    if (sameDay(d, E)) { res.name = 'Easter Sunday of the Resurrection of the Lord'; res.key = 'EASTER'; res.readings = S('EASTER'); }
    else if (sameDay(d, pent)) { res.name = 'Pentecost Sunday'; res.key = 'PENTECOST'; res.readings = S('PENTECOST'); res.color = 'red'; }
    else if (sameDay(d, ascension)) { res.name = 'The Ascension of the Lord'; res.key = 'ASCENSION'; res.readings = S('ASCENSION', cycle); }
    else if (d < addDays(E, 7)) res.name = WEEKDAYS[dow] + ' in the Octave of Easter';
    else if (sameDay(d, addDays(E, 39))) res.name = 'Thursday of the 6th week of Easter (Ascension Thursday where it is kept)';
    else { const wk = Math.floor((d - E) / DAY / 7) + 1; if (dow === 0) { res.key = 'EASTER' + wk; res.name = ORD(wk) + ' Sunday of Easter'; res.readings = S(res.key, cycle); if (wk === 2) res.name += ' (Divine Mercy)'; } else res.name = WEEKDAYS[dow] + ' of the ' + ORD(wk) + ' week of Easter'; }
    return finish(res, L, dow);
  }
  // ---- Ordinary Time
  res.season = 'Ordinary Time'; res.color = 'green';
  let week;
  if (d < ash) { week = Math.floor((d - bapt) / DAY / 7) + 1; } // week of Baptism Sunday = week 1
  else { const ctk = addDays(adv, -7); const sundayOfWeek = addDays(d, -dow); week = 34 - Math.round((ctk - sundayOfWeek) / DAY / 7); }
  res.week = week;
  if (dow === 0) {
    if (sameDay(d, trinity)) { res.name = 'The Most Holy Trinity'; res.key = 'TRINITY'; res.readings = S('TRINITY', cycle); res.color = 'white'; }
    else if (sameDay(d, corpus)) { res.name = 'The Most Holy Body and Blood of Christ (Corpus Christi)'; res.key = 'CORPUS'; res.readings = S('CORPUS', cycle); res.color = 'white'; }
    else if (week === 34) { res.name = 'Our Lord Jesus Christ, King of the Universe'; res.key = 'OT34'; res.readings = S('OT34', cycle); res.color = 'white'; }
    else if (feast && feast.rank <= 2 && /Lord|Peter and Paul|John the Baptist|Assumption|All Saints|All Souls|Cross|Transfiguration/.test(feast.n)) { res.name = feast.n; res.readings = feast.r[cycle] || feast.r['*'] || []; res.feast = true; res.color = 'white'; }
    else { res.key = 'OT' + week; res.name = ORD(week) + ' Sunday in Ordinary Time'; res.readings = S(res.key, cycle); }
  } else {
    if (sameDay(d, sacred)) { res.name = 'The Most Sacred Heart of Jesus'; res.key = 'SACREDHEART'; res.readings = S('SACREDHEART', cycle); res.color = 'white'; }
    else if (feast) { res.name = feast.n; res.readings = feast.r[cycle] || feast.r['*'] || []; res.feast = true; res.color = /Martyr|Peter and Paul|Andrew|Stephen|Cross/.test(feast.n) ? 'red' : 'white'; }
    else { res.name = WEEKDAYS[dow] + ' of the ' + ORD(week) + ' week in Ordinary Time'; const g = (L.weekdayGospels[week] || [])[dow - 1]; if (g) { res.readings = [g]; res.gospelOnly = true; } }
  }
  return finish(res, L, dow);
}
function finish(res, L, dow) {
  if (!res.readings.length && res.feast === undefined) { const feast = L.feasts[md(res.date)]; if (feast && dow !== 0) { res.name = feast.n; res.readings = feast.r[res.cycle] || feast.r['*'] || []; res.feast = true; } }
  res.refs = res.readings.map(parseRef);
  return res;
}

// "ISA 9:2-7" | "GEN 1:1-2:2" | "MAT 6:1-6,16-18" | "TIT 2:11-14;3:4-7" -> { b, label, c, v, parts:[[c,v1,v2]...] }
export function parseRef(ref) {
  const [b, rest] = ref.split(' '); const book = data.byId[b]; const parts = [];
  for (const chunk of rest.split(';')) {
    const m = chunk.match(/^(\d+):(.*)$/); if (!m) continue; let c = +m[1];
    for (const seg of m[2].split(',')) { const mm = seg.match(/^(\d+)(?:-(\d+)(?::(\d+))?)?$/); if (!mm) continue; const v1 = +mm[1]; if (mm[3]) { parts.push([c, v1, book ? book.chapters[c - 1] : v1]); c = +mm[2]; parts.push([c, 1, +mm[3]]); } else parts.push([c, v1, +(mm[2] || v1)]); }
  }
  const label = book ? `${book.abbr} ${rest.replace(/;/g, '; ')}` : ref;
  return { b, book, label, c: parts[0]?.[0] || 1, v: parts[0]?.[1] || 1, parts, ref };
}

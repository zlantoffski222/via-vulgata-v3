// What fasting or abstinence a day asks, under three disciplines:
//  catholic     — current law of the Latin Church (canons 1249–1253) with the common US/UK practice noted
//  traditional  — the discipline in force before 1966 (1962 calendar): Lenten fast, Ember days, vigils
//  orthodox     — the Byzantine rule (new-calendar fixed feasts, Julian Paschalion), simplified to the main seasons
import { easter } from './lectionary';

const DAY = 86400000;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const local = (y, m, d) => new Date(y, m - 1, d);
const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const md = d => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const between = (d, a, b) => d >= a && d <= b;

// Julian-calendar Easter (Meeus), returned as a Gregorian date
export function orthodoxEaster(y) {
  const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31), day = ((d + e + 114) % 31) + 1;
  const julian = local(y, month, day); const offset = y >= 2100 ? 14 : 13; // Julian → Gregorian
  return addDays(julian, offset);
}
function adventStart(y) { const xmas = local(y, 12, 25); const dow = xmas.getDay(); return addDays(addDays(xmas, -(dow === 0 ? 7 : dow)), -21); }

// Solemnities on which the Friday penance does not bind (Latin Church)
const SOLEMN = new Set(['01-01', '03-19', '03-25', '06-24', '06-29', '08-15', '11-01', '12-08', '12-25']);
const LEVELS = { none: 0, penance: 1, abstain: 2, fast: 3, strict: 4 };

export function fastingFor(date, rule = 'catholic') {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()); const y = d.getFullYear(); const dow = d.getDay(); const key = md(d);
  const E = easter(y); const ash = addDays(E, -46), goodFri = addDays(E, -2), holySat = addDays(E, -1), pent = addDays(E, 49);
  const inLent = d >= ash && d < E; const isSunday = dow === 0; const isFriday = dow === 5;
  const out = { rule, level: 'none', title: 'No fast today', detail: '', notes: [] };
  const set = (level, title, detail) => { if (LEVELS[level] >= LEVELS[out.level]) { out.level = level; out.title = title; out.detail = detail; } };

  if (rule === 'catholic') {
    out.notes.push('Eucharistic fast: nothing but water and medicine for one hour before Holy Communion.');
    if (same(d, ash) || same(d, goodFri)) set('fast', 'Fast and abstinence', 'One full meal and two smaller ones that together do not equal it; no meat. Fasting binds from 18 to 59, abstinence from 14.');
    else if (same(d, holySat)) set('penance', 'The Paschal fast is encouraged', 'The Church commends keeping the Good Friday fast through Holy Saturday until the Easter Vigil.');
    else if (isFriday && inLent) set('abstain', 'Abstinence from meat', 'Every Friday of Lent is a day of abstinence from meat for all aged 14 and over.');
    else if (isFriday && !SOLEMN.has(key) && !(d >= E && d < addDays(E, 8))) set('penance', 'Friday penance', 'Every Friday is a day of penance in memory of the Passion: abstinence from meat, or, where the bishops allow (as in the United States), another act of penance, prayer or charity in its place. In England and Wales abstinence from meat is the norm.');
    else if (isFriday && SOLEMN.has(key)) set('none', 'No penance — a solemnity', 'The Friday penance does not bind on a solemnity.');
    else if (isFriday) set('none', 'Friday in the Easter Octave', 'The Octave of Easter is kept as one great Sunday; no penance.');
    else if (isSunday) set('none', 'Sunday — no fasting', 'Sundays are never days of fast or abstinence, even in Lent.');
    else if (inLent) set('penance', 'A weekday of Lent', 'The season itself is penitential: the Church asks for prayer, fasting and almsgiving freely chosen. Meat may be eaten.');
    else if (d >= adventStart(y) && d < local(y, 12, 25)) set('none', 'Advent', 'A season of joyful expectation; no fast is required, though many keep a lighter table.');
    return out;
  }
  if (rule === 'traditional') {
    out.notes.push('Eucharistic fast (1957 rule): three hours from food and alcohol, one hour from other drinks; water never breaks it. Before 1957: from midnight.');
    // Ember days: Wed, Fri, Sat after Dec 13 (St Lucy), after Ash Wednesday, after Pentecost, after Sept 14 (Holy Cross)
    const emberWeeks = [local(y, 12, 13), ash, pent, local(y, 9, 14)].map(x => { const s = addDays(x, x === ash ? 0 : 1); const wed = addDays(s, (3 - s.getDay() + 7) % 7); return [wed, addDays(wed, 2), addDays(wed, 3)]; });
    const ember = emberWeeks.some(([w, f, s]) => same(d, w) || same(d, f) || same(d, s));
    const vigils = ['12-24', '08-14', '10-31'].includes(key) || same(d, addDays(pent, -1));
    if (same(d, goodFri) || same(d, ash)) set('fast', 'Fast and abstinence', 'One full meal, two small collations; no meat, and on Good Friday the strictest observance of the year.');
    else if (same(d, holySat)) set('fast', 'Fast and abstinence until noon', 'The Holy Saturday fast ends at midday under the 1962 rubrics.');
    else if (vigils && !isSunday) set('fast', 'Vigil — fast and abstinence', 'The vigils of Pentecost, the Assumption, All Saints and Christmas are days of fast and complete abstinence.');
    else if (ember && !isSunday) set('fast', isFriday ? 'Ember Friday — fast and abstinence' : 'Ember day — fast and partial abstinence', 'The four Ember weeks (after St Lucy, the first Sunday of Lent, Pentecost and Holy Cross) are days of fasting for the seasons and for ordinations. Meat only at the main meal on Wednesday and Saturday; none on Friday.');
    else if (inLent && isFriday) set('fast', 'Friday of Lent — fast and abstinence', 'Every weekday of Lent is a fast day; on Fridays no meat at all.');
    else if (inLent && !isSunday) set('fast', 'Lenten fast', 'One full meal a day, with two small collations, for all aged 21 to 59; meat is allowed at the main meal except on Friday.');
    else if (isFriday && !SOLEMN.has(key)) set('abstain', 'Friday abstinence', 'No meat on any Friday of the year, for all aged 7 and over, unless a holy day of obligation falls on it.');
    else if (isSunday) set('none', 'Sunday — no fasting', 'Sundays are never days of fast or abstinence.');
    return out;
  }
  if (rule === 'orthodox') {
    const P = orthodoxEaster(y); const cleanMon = addDays(P, -48), lazarusSat = addDays(P, -8), palm = addDays(P, -7), pentO = addDays(P, 49);
    const brightEnd = addDays(P, 6), pentWeekEnd = addDays(pentO, 6), apostlesStart = addDays(pentO, 8), apostlesEnd = local(y, 6, 28);
    const nativityFast = between(d, local(y, 11, 15), local(y, 12, 24)), dormitionFast = between(d, local(y, 8, 1), local(y, 8, 14));
    const fastFree = between(d, local(y, 12, 25), local(y, 1, 4)) || between(d, local(y, 12, 25), local(y, 12, 31)) || between(d, local(y, 1, 1), local(y, 1, 4)) || between(d, P, brightEnd) || between(d, addDays(pentO, 1), pentWeekEnd) || between(d, addDays(cleanMon, -21), addDays(cleanMon, -15));
    const cheesefare = between(d, addDays(cleanMon, -7), addDays(cleanMon, -1));
    const wedFri = dow === 3 || dow === 5;
    out.notes.push('Orthodox fasting means abstaining from meat, dairy and eggs; on strict days also from fish, wine and oil. Fixed dates follow the new (Gregorian) calendar, the Paschal cycle the Julian computus — Pascha ' + P.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) + '.');
    if (between(d, palm, addDays(P, -1))) set('strict', 'Holy Week — strict fast', 'The strictest week of the year. Great and Holy Friday is kept, where possible, without food at all until the Vespers of the Burial.');
    else if (same(d, lazarusSat)) set('fast', 'Lazarus Saturday — fast, with wine, oil and caviar', 'Fish is not eaten; fish roe is the traditional relaxation.');
    else if (between(d, cleanMon, addDays(lazarusSat, -1))) { const wk = isSunday || dow === 6; set(wk ? 'fast' : 'strict', wk ? 'Great Lent — fast, with wine and oil' : 'Great Lent — strict fast', wk ? 'No meat, dairy, eggs or fish; wine and oil are allowed on Saturdays and Sundays.' : 'No meat, dairy, eggs, fish, wine or oil. Fish is allowed on the Annunciation (March 25) and Palm Sunday.'); }
    else if (cheesefare) set(wedFri ? 'abstain' : 'penance', 'Cheesefare week', 'The last week before Lent: meat is gone, but dairy, eggs and fish are eaten every day, even Wednesday and Friday.');
    else if (dormitionFast) set(key === '08-06' ? 'fast' : (wedFri || !(dow === 0 || dow === 6)) ? 'strict' : 'fast', key === '08-06' ? 'Transfiguration — fish, wine and oil allowed' : 'Dormition Fast', 'August 1–14 is kept almost as strictly as Great Lent: wine and oil on weekends only; fish on the Transfiguration.');
    else if (nativityFast) set(wedFri ? 'strict' : 'fast', wedFri ? 'Nativity Fast — strict day' : 'Nativity Fast', 'November 15 to December 24: no meat, dairy or eggs. Fish, wine and oil are allowed on most days except Wednesday and Friday; the last days (December 20–24) are stricter.');
    else if (between(d, apostlesStart, apostlesEnd)) set(wedFri ? 'strict' : 'fast', wedFri ? 'Apostles\' Fast — strict day' : 'Apostles\' Fast', 'From the Monday after All Saints (the Sunday after Pentecost) to the eve of Saints Peter and Paul: no meat, dairy or eggs; fish, wine and oil except Wednesday and Friday.');
    else if (['08-29', '09-14', '01-05'].includes(key)) set('strict', key === '01-05' ? 'Eve of Theophany — strict fast' : key === '08-29' ? 'Beheading of the Forerunner — strict fast' : 'Exaltation of the Cross — strict fast', 'A one-day strict fast: no meat, dairy, eggs, fish, wine or oil.');
    else if (fastFree) set('none', 'Fast-free period', 'Bright Week, the week after Pentecost, the Twelve Days of Christmas and the week of the Publican and Pharisee are kept without fasting, even on Wednesday and Friday.');
    else if (wedFri) set('abstain', dow === 3 ? 'Wednesday — fast for the betrayal' : 'Friday — fast for the Crucifixion', 'Every Wednesday and Friday of the year: no meat, dairy or eggs. Fish, wine and oil vary by the day\'s rank.');
    else set('none', 'No fast today', '');
    return out;
  }
  return out;
}

export const RULES = [['catholic', 'Catholic (current)'], ['traditional', 'Traditional (1962)'], ['orthodox', 'Orthodox']];
export const LEVEL_COLOR = { none: 'var(--gold)', penance: '#8a6a22', abstain: '#5a3d7a', fast: '#7b2d26', strict: '#4a1c18' };

// Tags who is speaking in each verse, derived from the quotation marks and speech cues of the
// World English Bible (aligned to the Vulgate verse grid in text/web/*.json).
// Output: public/data/speakers/BOOK.json = { "chapter": { "verse": code } } where code is
// 'J' (Jesus), 'G' (God), 'A' (an angel), or a name such as 'Moses'. Heuristic, verse-level.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'); const DATA = path.join(ROOT, 'public', 'data');
const OUT = path.join(DATA, 'speakers');
const NT = new Set(['MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH', 'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS', '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV']);
const VERBS = 'answered|said|says|saith|replied|asked|spoke|speaks|cried|commanded|told|prayed|declared|proclaimed|shouted|exclaimed|swore|sang|testified|taught|wrote|questioned|warned|urged|begged|pleaded|whispered|announced|responded|answers|asks|tells|cries|calls out|called out';
const SUBJ = `(?:(?:[Tt]he|[Hh]is|[Hh]er|[Tt]heir) (?:chief |high |other |whole |wise )?[a-z]+(?: of [A-Z][a-z]+)?|[A-Z][a-z]+(?: (?:the|of) [A-Z][a-z]+)?(?:’s [a-z]+)?|Yahweh(?: God| of Armies)?|God|an angel|he|she|they|He|She|They|I)`;
const FILL = `(?:,? (?:also|then|again|himself|too|likewise|therefore|immediately))?(?:,? (?:[a-z]+(?:ing|ed)|sent|went|came|took|opened|stood|rose|turned|looked|stretched|lifted|reached|drew|fell|knelt|put|set|got|began|saw|heard|found|wept|sighed|spoke|answered|replied|cried|bowed|ran|left|entered|arose|sat|lay|threw|gave|brought) [^.;:“”]{0,50}?,?(?: and| then)?)?`;
const CUE = new RegExp(`(${SUBJ})${FILL} (?:${VERBS})\\b`, 'g');
const ROLES = new Set(['devil', 'tempter', 'serpent', 'woman', 'women', 'man', 'disciples', 'crowd', 'crowds', 'multitude', 'multitudes', 'people', 'king', 'queen', 'prophet', 'priest', 'priests', 'scribes', 'elders', 'soldiers', 'servant', 'servants', 'centurion', 'governor', 'boy', 'girl', 'father', 'mother', 'brothers', 'ruler', 'rulers', 'officers', 'apostles', 'twelve', 'messengers', 'spirit', 'spirits', 'demon', 'demons', 'witnesses', 'sailors', 'magicians', 'shepherds', 'jailer', 'lawyer', 'lawyers', 'sadducees', 'pharisees', 'jews', 'greeks', 'chief', 'captain', 'steward', 'master', 'lord', 'owner', 'judge', 'nobleman', 'blind', 'leper', 'lepers', 'sons', 'daughters', 'children', 'wife', 'husband', 'friends', 'neighbors', 'guards', 'council', 'assembly', 'congregation', 'levites', 'princes', 'nobles', 'young', 'old', 'maid', 'maidens', 'voice', 'bridegroom', 'bride', 'physician', 'unclean']);
const STOP = new Set(['Being', 'Whose', 'Sabbath', 'In', 'On', 'We', 'Bethany', 'Philippi', 'Seeing', 'Answering', 'Hearing', 'Knowing', 'Having', 'Turning', 'Coming', 'Going', 'Rising', 'Standing', 'Sitting', 'Looking', 'Taking', 'Calling', 'Beginning', 'Being', 'Passing', 'Departing', 'Entering', 'Leaving', 'Then', 'But', 'And', 'So', 'Now', 'When', 'After', 'Therefore', 'Again', 'Behold', 'For', 'Yet', 'Also', 'The', 'His', 'Her', 'Their', 'Some', 'Many', 'All', 'One', 'Others', 'Those', 'These', 'Immediately', 'Truly', 'Because', 'While', 'If', 'As', 'However', 'Meanwhile', 'Likewise', 'Finally', 'Moreover', 'Thus', 'Whoever', 'Everyone', 'No', 'Nobody', 'Someone', 'Since', 'Which', 'What', 'Who', 'That', 'Later', 'Next', 'Once', 'Even', 'Here', 'There', 'Him', 'Them', 'Me', 'You', 'It', 'This', 'Be', 'Let', 'Go', 'Come', 'See', 'Hear', 'O', 'May', 'Blessed', 'Lord', 'Peace', 'Woe', 'Amen', 'Yes', 'Sir', 'Master', 'Teacher', 'Rabbi', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Man', 'Woman', 'Please', 'Alas', 'Holy', 'Most', 'Great', 'Hail', 'King']);

function speakerFrom(subj, book, last) {
  subj = subj.replace(/^the /, '').replace(/’s.*$/, '').trim();
  if (/^(Jesus|Christ|the Lord Jesus)$/.test(subj)) return 'J';
  if (/^(Yahweh|God|LORD|Lord Yahweh|Yahweh of Armies|Yahweh God)$/.test(subj)) return NT.has(book) && subj === 'Lord' ? 'J' : 'G';
  if (subj === 'Lord') return NT.has(book) ? 'J' : 'G';
  if (/angel/i.test(subj)) return 'A';
  if (/^(he|He|she|She|they|They|I)$/.test(subj)) return typeof last === 'function' ? last(subj.toLowerCase()) : (last || null);
  if (/^(the|his|her|their) /.test(subj)) { const n = subj.replace(/^(the|his|her|their) /, ''); if (/^(devil|tempter|serpent)$/.test(n)) return 'the ' + n; if (/^(voice)$/.test(n)) return 'G'; return ROLES.has(n) ? 'the ' + n : null; }
  const name = subj.split(' ')[0]; if (STOP.has(name) || /ing$/.test(name)) return null;
  return name;
}

const GOSPELS = new Set(['MAT', 'MRK', 'LUK', 'JHN']);
const GOD_RE = /(says|said|saith) (Yahweh|the Lord Yahweh|the LORD|God)|Yahweh(?:’s)? word came|Thus says (?:Yahweh|the Lord)|word of Yahweh came|Yahweh (?:has )?spoke[n]?|Yahweh says|mouth of Yahweh has spoken/;
function tagBook(book, chapters) {
  const out = {}; let n = 0;
  const hist = []; // [{v: absolute index, s: speaker}] recent tagged verses
  let abs = 0;
  for (let ci = 0; ci < chapters.length; ci++) {
    let open = false, current = null, pending = null;
    const tags = {};
    const resolvePronoun = (pr) => {
      const recent = hist.filter(h => abs - h.v <= 6).map(h => h.s); const distinct = [];
      for (let i = recent.length - 1; i >= 0; i--) if (!distinct.includes(recent[i])) distinct.push(recent[i]);
      if (pr === 'she' || pr === 'they' || pr === 'i') { const c = distinct.filter(x => x !== 'J' && x !== 'G'); return c[0] || null; }
      if (GOSPELS.has(book)) { if (!distinct.length) return 'J'; if (distinct[0] !== 'J') return 'J'; return distinct[1] || 'J'; }
      return distinct[1] || distinct[0] || null;
    };
    for (let vi = 0; vi < chapters[ci].length; vi++, abs++) {
      const text = chapters[ci][vi] || ''; if (!text) continue;
      const q = text.indexOf('“'); const lead = q >= 0 ? text.slice(0, q) : text;
      let cue = null; const cues = [...lead.matchAll(CUE)]; if (cues.length) cue = speakerFrom(cues[cues.length - 1][1], book, resolvePronoun);
      if (GOD_RE.test(lead)) cue = 'G';
      let tag = null;
      if (q >= 0) { tag = cue || pending || current || null; current = tag; pending = null; }
      else if (open) { tag = current; }
      else if (cue && !/[.!?]”?\s*$/.test(text.trim())) { pending = cue; }
      else if (GOD_RE.test(text)) tag = 'G';
      const opens = (text.match(/“/g) || []).length, closes = (text.match(/”/g) || []).length;
      if (opens || closes) open = text.lastIndexOf('“') > text.lastIndexOf('”');
      if (tag) { tags[vi + 1] = tag; n++; hist.push({ v: abs, s: tag }); if (hist.length > 12) hist.shift(); }
      if (!open && closes) current = null;
    }
    if (Object.keys(tags).length) out[ci + 1] = tags;
  }
  return [out, n];
}

function main() {
  fs.mkdirSync(OUT, { recursive: true }); let total = 0;
  for (const f of fs.readdirSync(path.join(DATA, 'text', 'web'))) {
    const book = f.replace('.json', ''); const web = JSON.parse(fs.readFileSync(path.join(DATA, 'text', 'web', f), 'utf8')).v;
    const [tags, n] = tagBook(book, web); total += n;
    fs.writeFileSync(path.join(OUT, f), JSON.stringify(tags));
  }
  console.log('speakers: tagged', total, 'verses');
}
main();

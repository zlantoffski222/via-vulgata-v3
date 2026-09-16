import React from 'react';

// Hand-drawn teaching diagrams. Each has labelled parts; tapping a part explains it and opens the verses behind it.
// svg(active, pick) draws the picture; parts[] carries the text; chapters{} says where the reader should surface it.

const T = ({ x, y, children, s = 12, a = 'middle', w = 500, fill = 'currentColor', cls = '' }) => <text x={x} y={y} fontSize={s} textAnchor={a} fontWeight={w} fill={fill} className={'dl ' + cls}>{children}</text>;
const H = ({ id, active, pick, children }) => <g className={'hs' + (active === id ? ' on' : '')} onClick={e => { e.stopPropagation(); pick(id); }} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && pick(id)}>{children}</g>;

export const DIAGRAMS = [
  {
    id: 'tabernacle', n: 'The Tabernacle', sub: 'Exodus 25–40 · the tent in the wilderness', era: 'c. 1446 BC',
    intro: 'God gave Moses the pattern on Sinai: a court of linen curtains a hundred cubits long, and inside it a tent of two rooms, the whole thing built to be carried. Everything faces east, and everything moves inward from the gate — altar, laver, lampstand, incense, veil — toward the one room where God said he would meet Israel between the cherubim. The letter to the Hebrews reads it as a picture of heaven itself.',
    refs: [['EXO', 25, 8, 9], ['EXO', 40, 33, 38], ['HEB', 9, 1, 12]],
    chapters: { EXO: [25, 26, 27, 28, 29, 30, 31, 35, 36, 37, 38, 39, 40], LEV: [1, 8, 16], NUM: [2, 3, 4], HEB: [8, 9] },
    parts: [
      { id: 'court', n: 'The court', t: 'A hundred cubits by fifty (about 45 m × 22 m), fenced by linen hangings five cubits high on bronze pillars. Any Israelite could enter it with a sacrifice; only priests went further.', ref: ['EXO', 27, 9, 19] },
      { id: 'gate', n: 'The gate', t: 'One entrance, twenty cubits wide, always on the east, its screen woven in blue, purple and scarlet — the only way in.', ref: ['EXO', 27, 16, 16] },
      { id: 'altar', n: 'The altar of burnt offering', t: 'Acacia wood overlaid with bronze, five cubits square with a horn at each corner. The first thing met inside the gate: no one approached God without a sacrifice.', ref: ['EXO', 27, 1, 8] },
      { id: 'laver', n: 'The bronze laver', t: 'A basin made from the bronze mirrors of the women who served at the door. The priests washed their hands and feet in it before entering the tent, on pain of death.', ref: ['EXO', 30, 17, 21] },
      { id: 'holy', n: 'The Holy Place', t: 'The first room of the tent, twenty cubits long, lit only by the lampstand. Priests entered every morning and evening to tend the lamps and burn incense.', ref: ['EXO', 26, 33, 35] },
      { id: 'table', n: 'The table of showbread', t: 'On the north side: twelve loaves, one for each tribe, set before the Lord every Sabbath and eaten by the priests.', ref: ['EXO', 25, 23, 30] },
      { id: 'lamp', n: 'The lampstand (menorah)', t: 'On the south side, hammered from a single talent of pure gold, with seven lamps and almond-blossom cups. It burned all night, the only light in the tent.', ref: ['EXO', 25, 31, 40] },
      { id: 'incense', n: 'The altar of incense', t: 'Just before the veil, a cubit square, overlaid with gold. Incense rose from it morning and evening — the prayers of the saints, says the Apocalypse.', ref: ['EXO', 30, 1, 10] },
      { id: 'veil', n: 'The veil', t: 'Blue, purple and scarlet, woven with cherubim, hung on four gold-covered pillars. It divided the holy from the most holy; the Gospels record it torn in two at the death of Jesus.', ref: ['EXO', 26, 31, 33] },
      { id: 'hoh', n: 'The Holy of Holies', t: 'A perfect cube of ten cubits, containing only the Ark. The high priest entered it one day in the year, the Day of Atonement, with blood and a cloud of incense.', ref: ['LEV', 16, 2, 2] },
      { id: 'ark', n: 'The Ark of the Covenant', t: 'The throne of God on earth, the mercy seat between the cherubim. Its own diagram is below.', ref: ['EXO', 25, 10, 22] },
    ],
    svg: (a, p) => (
      <svg viewBox="0 0 800 460" className="dg">
        <defs><pattern id="linen" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 3h6" stroke="currentColor" strokeOpacity=".12" /></pattern></defs>
        <H id="court" active={a} pick={p}><rect x="60" y="60" width="680" height="340" fill="url(#linen)" stroke="currentColor" strokeWidth="2" rx="3" />
          {Array.from({ length: 21 }, (_, i) => <circle key={'t' + i} cx={60 + i * 34} cy="60" r="3" fill="currentColor" />)}{Array.from({ length: 21 }, (_, i) => <circle key={'b' + i} cx={60 + i * 34} cy="400" r="3" fill="currentColor" />)}
          {Array.from({ length: 11 }, (_, i) => <circle key={'l' + i} cx="60" cy={60 + i * 34} r="3" fill="currentColor" />)}{Array.from({ length: 11 }, (_, i) => <circle key={'r' + i} cx="740" cy={60 + i * 34} r="3" fill="currentColor" />)}
          <T x="400" y="440" s={11} cls="muted">100 cubits · the court faces east — the gate is on the right</T><T x="30" y="235" s={11} cls="muted">50</T></H>
        <H id="gate" active={a} pick={p}><rect x="732" y="165" width="16" height="130" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><T x="740" y="155" s={11}>gate</T><path d="M760 230l-10-5v10z" fill="currentColor" /></H>
        <H id="altar" active={a} pick={p}><rect x="610" y="200" width="60" height="60" fill="var(--dg-bronze)" stroke="currentColor" strokeWidth="2" /><path d="M610 200l6-8M670 200l-6-8M610 260l6 8M670 260l-6 8" stroke="currentColor" strokeWidth="2" /><T x="640" y="285" s={11}>altar</T></H>
        <H id="laver" active={a} pick={p}><circle cx="530" cy="230" r="20" fill="var(--dg-bronze)" stroke="currentColor" strokeWidth="2" /><circle cx="530" cy="230" r="10" fill="none" stroke="currentColor" /><T x="530" y="270" s={11}>laver</T></H>
        <H id="holy" active={a} pick={p}><rect x="230" y="150" width="200" height="160" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="3" /><T x="330" y="300" s={11}>Holy Place · 20 × 10</T></H>
        <H id="hoh" active={a} pick={p}><rect x="120" y="150" width="110" height="160" fill="var(--dg-gold-soft)" stroke="currentColor" strokeWidth="3" /><T x="175" y="300" s={11}>Holy of Holies</T></H>
        <H id="veil" active={a} pick={p}><path d="M230 150v160" stroke="var(--dg-purple)" strokeWidth="6" strokeDasharray="8 4" /><T x="230" y="140" s={11}>veil</T></H>
        <H id="table" active={a} pick={p}><rect x="340" y="170" width="44" height="22" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><T x="362" y="165" s={11}>table</T></H>
        <H id="lamp" active={a} pick={p}><g transform="translate(362 275)"><path d="M0 0v-18M-14 0v-12q0 -8 14 -8M14 0v-12q0 -8 -14 -8M-7 0v-14q0-4 7-4M7 0v-14q0-4-7-4" stroke="var(--dg-gold)" strokeWidth="3" fill="none" /><path d="M-18 -2h36" stroke="currentColor" strokeWidth="2" /></g><T x="362" y="250" s={11}>lampstand</T></H>
        <H id="incense" active={a} pick={p}><rect x="248" y="220" width="20" height="20" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><path d="M258 214q-4-6 0-12q4 6 0 12" fill="none" stroke="currentColor" /><T x="258" y="254" s={10}>incense</T></H>
        <H id="ark" active={a} pick={p}><rect x="156" y="216" width="38" height="24" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><path d="M162 216l6-8 5 8M182 216l6-8 5 8" fill="none" stroke="currentColor" strokeWidth="2" /><T x="175" y="256" s={10}>ark</T></H>
        <T x="400" y="40" s={14} w={600}>The Tabernacle — plan, looking down</T>
      </svg>
    ),
  },
  {
    id: 'ark', n: 'The Ark of the Covenant', sub: 'Exodus 25 · the throne between the cherubim', era: 'c. 1446 BC',
    intro: 'A chest of acacia wood, two and a half cubits long and a cubit and a half high and wide — a little larger than a cedar chest — overlaid with gold inside and out. Its lid was a slab of solid gold, the mercy seat, with two cherubim beaten out of the same piece, wings spread, faces turned down toward the place where the blood was sprinkled. It went before Israel through the Jordan, circled Jericho, was captured by the Philistines, danced before by David, and disappeared when Babylon burned the Temple.',
    refs: [['EXO', 25, 10, 22], ['HEB', 9, 4, 5], ['1KI', 8, 6, 9]],
    chapters: { EXO: [25, 37], NUM: [10], JOS: [3, 6], '1SA': [4, 5, 6], '2SA': [6], '1KI': [8], HEB: [9], REV: [11] },
    parts: [
      { id: 'box', n: 'The chest', t: 'Acacia (shittim) wood — the hard, incorruptible wood of the desert — covered in pure gold within and without, with a gold moulding round the rim. Two and a half cubits by one and a half (about 114 cm × 69 cm).', ref: ['EXO', 25, 10, 11] },
      { id: 'seat', n: 'The mercy seat (propitiatorium)', t: 'The lid, of pure gold, exactly the size of the chest. Here God promised to speak with Moses, and here the high priest sprinkled blood on the Day of Atonement. The Vulgate calls it the propitiatorium; Paul uses the same word of Christ.', ref: ['EXO', 25, 17, 22] },
      { id: 'cher', n: 'The two cherubim', t: 'Hammered from the one piece of gold with the lid, facing one another, wings overshadowing the seat. God is "enthroned upon the cherubim" — the Ark is a footstool, the invisible king above it.', ref: ['EXO', 25, 18, 20] },
      { id: 'rings', n: 'Rings and poles', t: 'Four gold rings at the feet, two gilded poles that were never to be removed. The Ark was carried on the shoulders of the Levites, never touched: Uzzah died for steadying it.', ref: ['EXO', 25, 12, 15] },
      { id: 'inside', n: 'What lay inside', t: 'The two tablets of the Law; and, by Hebrews 9:4, the golden pot of manna and the rod of Aaron that budded — the law, the bread and the priesthood. By Solomon\'s day only the tablets remained.', ref: ['HEB', 9, 4, 4] },
    ],
    svg: (a, p) => (
      <svg viewBox="0 0 800 460" className="dg">
        <H id="rings" active={a} pick={p}><rect x="120" y="330" width="560" height="10" rx="5" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><rect x="120" y="360" width="560" height="10" rx="5" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><circle cx="250" cy="335" r="10" fill="none" stroke="currentColor" strokeWidth="3" /><circle cx="550" cy="335" r="10" fill="none" stroke="currentColor" strokeWidth="3" /><T x="400" y="395" s={11}>poles of acacia overlaid with gold — never drawn out</T></H>
        <H id="box" active={a} pick={p}><rect x="230" y="220" width="340" height="110" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="3" /><rect x="230" y="220" width="340" height="12" fill="var(--dg-gold-2)" stroke="currentColor" strokeWidth="2" /><T x="400" y="290" s={12}>2½ × 1½ × 1½ cubits</T></H>
        <H id="inside" active={a} pick={p}><g transform="translate(400 262)"><rect x="-60" y="-16" width="24" height="30" rx="8" fill="var(--dg-cream)" stroke="currentColor" /><rect x="-34" y="-16" width="24" height="30" rx="8" fill="var(--dg-cream)" stroke="currentColor" /><circle cx="20" cy="0" r="12" fill="var(--dg-cream)" stroke="currentColor" /><path d="M50 -16v32M50 -8q8-8 8 0" stroke="currentColor" strokeWidth="2" fill="none" /></g><T x="400" y="315" s={10} cls="muted">tablets · manna · Aaron's rod</T></H>
        <H id="seat" active={a} pick={p}><rect x="222" y="200" width="356" height="22" fill="var(--dg-gold-2)" stroke="currentColor" strokeWidth="3" /><T x="400" y="180" s={12}>the mercy seat — pure gold</T></H>
        <H id="cher" active={a} pick={p}>
          <path d="M290 200v-40q-10-30 20-40q30 10 30 40l-10 40M310 120q-40-30-80 10q30 5 60 30" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><path d="M300 110q60-40 100 30" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M510 200v-40q10-30-20-40q-30 10-30 40l10 40M490 120q40-30 80 10q-30 5-60 30" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><path d="M500 110q-60-40-100 30" fill="none" stroke="currentColor" strokeWidth="2" />
          <T x="400" y="80" s={12}>two cherubim, wings overshadowing, faces toward the seat</T></H>
        <T x="400" y="40" s={14} w={600}>The Ark of the Covenant — from the side</T>
      </svg>
    ),
  },
  {
    id: 'solomon', n: "Solomon's Temple", sub: '1 Kings 6–8 · the First Temple', era: 'c. 966–586 BC',
    intro: 'Solomon built the Tabernacle in stone, twice the size in every direction: a porch, a long hall and a cube of a shrine, on the threshing floor David had bought on Mount Moriah. Seven years in the building, cedar from Lebanon, stone dressed at the quarry so that no hammer was heard on the site, and the walls carved with cherubim, palms and flowers and overlaid with gold. Nebuchadnezzar burned it in 586 BC.',
    refs: [['1KI', 6, 1, 3], ['1KI', 8, 10, 13], ['2CH', 3, 1, 2]],
    chapters: { '1KI': [5, 6, 7, 8], '2CH': [2, 3, 4, 5, 6, 7], '2KI': [25], EZK: [40, 41, 42, 43] },
    parts: [
      { id: 'ulam', n: 'The porch (Ulam)', t: 'Ten cubits deep across the full twenty-cubit width of the house, its entrance flanked by the two bronze pillars. Everything again faces east.', ref: ['1KI', 6, 3, 3] },
      { id: 'pillars', n: 'Jachin and Boaz', t: 'Two free-standing bronze pillars eighteen cubits high, cast by Hiram of Tyre, crowned with lilies and two hundred pomegranates. Jachin — "he establishes"; Boaz — "in him is strength".', ref: ['1KI', 7, 15, 22] },
      { id: 'hekal', n: 'The Holy Place (Hekal)', t: 'Forty cubits long, twenty wide, thirty high, panelled in cedar so that no stone was seen, with the ten lampstands, the golden table and the altar of incense.', ref: ['1KI', 6, 17, 22] },
      { id: 'debir', n: 'The Holy of Holies (Debir)', t: 'A cube of twenty cubits, floor to ceiling in gold, with two olive-wood cherubim ten cubits high whose wings touched the walls and each other over the Ark.', ref: ['1KI', 6, 19, 28] },
      { id: 'side', n: 'The side chambers', t: 'Three storeys of rooms wrapped round the north, west and south walls, for the treasury and the vessels, the beams resting on ledges so that nothing was cut into the walls of the house.', ref: ['1KI', 6, 5, 10] },
      { id: 'sea', n: 'The bronze sea', t: 'A cast basin ten cubits across holding two thousand baths, standing on twelve bronze oxen, three facing each point of the compass. The priests washed in it.', ref: ['1KI', 7, 23, 26] },
      { id: 'lavers', n: 'The ten lavers', t: 'Ten wheeled bronze stands, five each side, each carrying a basin for washing the parts of the burnt offerings.', ref: ['1KI', 7, 27, 39] },
      { id: 'altar', n: 'The bronze altar', t: 'Twenty cubits square and ten high — the whole Tabernacle altar would have fitted on top of it. Solomon offered twenty-two thousand oxen at the dedication.', ref: ['2CH', 4, 1, 1] },
    ],
    svg: (a, p) => (
      <svg viewBox="0 0 800 460" className="dg">
        <H id="side" active={a} pick={p}><rect x="140" y="130" width="330" height="200" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" /><T x="305" y="120" s={11} cls="muted">side chambers, three storeys, on three sides</T></H>
        <H id="debir" active={a} pick={p}><rect x="160" y="160" width="90" height="140" fill="var(--dg-gold-soft)" stroke="currentColor" strokeWidth="3" /><T x="205" y="235" s={11}>Debir</T><T x="205" y="250" s={10} cls="muted">20 × 20 × 20</T><path d="M175 200l10-14 10 14M215 200l10-14 10 14" fill="none" stroke="currentColor" strokeWidth="2" /></H>
        <H id="hekal" active={a} pick={p}><rect x="250" y="160" width="200" height="140" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="3" /><T x="350" y="235" s={11}>Hekal — the Holy Place</T><T x="350" y="250" s={10} cls="muted">40 × 20 × 30</T>
          {Array.from({ length: 5 }, (_, i) => <circle key={'n' + i} cx={275 + i * 35} cy="175" r="4" fill="var(--dg-gold)" />)}{Array.from({ length: 5 }, (_, i) => <circle key={'s' + i} cx={275 + i * 35} cy="285" r="4" fill="var(--dg-gold)" />)}</H>
        <H id="ulam" active={a} pick={p}><rect x="450" y="160" width="50" height="140" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="3" /><T x="475" y="235" s={11}>porch</T></H>
        <H id="pillars" active={a} pick={p}><circle cx="515" cy="185" r="9" fill="var(--dg-bronze)" stroke="currentColor" strokeWidth="2" /><circle cx="515" cy="275" r="9" fill="var(--dg-bronze)" stroke="currentColor" strokeWidth="2" /><T x="515" y="170" s={10}>Boaz</T><T x="515" y="300" s={10}>Jachin</T></H>
        <H id="altar" active={a} pick={p}><rect x="590" y="190" width="80" height="80" fill="var(--dg-bronze)" stroke="currentColor" strokeWidth="2" /><path d="M590 190l6-8M670 190l-6-8M590 270l6 8M670 270l-6 8" stroke="currentColor" strokeWidth="2" /><T x="630" y="235" s={11}>altar</T><T x="630" y="250" s={10} cls="muted">20 × 20</T></H>
        <H id="sea" active={a} pick={p}><circle cx="640" cy="340" r="26" fill="var(--dg-bronze)" stroke="currentColor" strokeWidth="2" /><circle cx="640" cy="340" r="16" fill="none" stroke="currentColor" />{Array.from({ length: 12 }, (_, i) => <circle key={i} cx={640 + 32 * Math.cos(i * Math.PI / 6)} cy={340 + 32 * Math.sin(i * Math.PI / 6)} r="2.5" fill="currentColor" />)}<T x="640" y="392" s={11}>the sea on twelve oxen</T></H>
        <H id="lavers" active={a} pick={p}>{Array.from({ length: 5 }, (_, i) => <rect key={'a' + i} x={520 + i * 30} y="120" width="14" height="14" fill="var(--dg-bronze)" stroke="currentColor" />)}{Array.from({ length: 5 }, (_, i) => <rect key={'b' + i} x={520 + i * 30} y="326" width="14" height="14" fill="var(--dg-bronze)" stroke="currentColor" />)}<T x="590" y="110" s={10}>five lavers each side</T></H>
        <T x="400" y="40" s={14} w={600}>The Temple of Solomon — plan, east to the right</T>
        <T x="400" y="430" s={11} cls="muted">Each cubit about 45 cm · the house itself 60 × 20 × 30 cubits, twice the Tabernacle in every measure</T>
      </svg>
    ),
  },
  {
    id: 'herod', n: "Herod's Temple", sub: 'The Temple Jesus knew · the Second Temple enlarged', era: '20 BC – AD 70',
    intro: 'The returned exiles rebuilt a modest house in 516 BC; Herod the Great, from 20 BC, doubled the platform into the largest sacred enclosure of the ancient world and rebuilt the sanctuary in white stone and gold. This is the Temple of the Gospels: where the twelve-year-old Jesus sat among the teachers, where he drove out the money-changers in the Court of the Gentiles, where the widow dropped her two coins into the treasury, and whose veil was torn. Titus burned it in AD 70; the platform, the Haram, remains.',
    refs: [['LUK', 2, 41, 49], ['JHN', 2, 13, 22], ['MRK', 13, 1, 2]],
    chapters: { MAT: [21, 24], MRK: [11, 12, 13], LUK: [1, 2, 19, 20, 21], JHN: [2, 7, 8, 10], ACT: [3, 21], EZR: [3, 6], HAG: [1, 2] },
    parts: [
      { id: 'gentiles', n: 'The Court of the Gentiles', t: 'The great outer platform, open to anyone, ringed with colonnades. Here the sellers of doves and the money-changers set up, and here Jesus overturned their tables. Roughly 480 by 300 m — thirty-five acres.', ref: ['MRK', 11, 15, 17] },
      { id: 'stoa', n: 'The Royal Stoa', t: 'A basilica of 162 columns along the south side, where the Sanhedrin sat in its last years and the traders did their business.', ref: ['LUK', 19, 45, 47] },
      { id: 'portico', n: "Solomon's Portico", t: 'The colonnade along the east wall, said to survive from Solomon\'s day. Jesus walked there in winter at the feast of the Dedication; the first Christians met there.', ref: ['JHN', 10, 22, 24] },
      { id: 'soreg', n: 'The Soreg', t: 'A low stone balustrade with inscriptions in Greek and Latin: no foreigner may pass, on pain of death. Paul was nearly lynched for allegedly bringing a Greek past it. Its "middle wall of partition" is Ephesians 2:14.', ref: ['ACT', 21, 27, 31] },
      { id: 'women', n: 'The Court of Women', t: 'The first inner court, open to all Israel, men and women, with the treasury\'s thirteen trumpet-shaped chests along its walls. Here Anna prayed, here Jesus watched the widow give her two mites, here the great lamps of Tabernacles burned.', ref: ['MRK', 12, 41, 44] },
      { id: 'nicanor', n: 'The Nicanor Gate', t: 'Fifteen semicircular steps and a gate of Corinthian bronze led up from the Court of Women to the Court of Israel — the "Beautiful Gate" where Peter healed the lame man, by most reckonings.', ref: ['ACT', 3, 1, 10] },
      { id: 'israel', n: 'The Court of Israel and of the Priests', t: 'A narrow strip for Israelite men, then the priests\' court with the great altar and the place of slaughter. Zechariah drew his lot to burn incense here.', ref: ['LUK', 1, 8, 11] },
      { id: 'altar2', n: 'The altar', t: 'Unhewn stone, about 15 m square and 7 m high, with a ramp on the south. The daily lambs morning and evening, and the Passover lambs by the tens of thousands.', ref: ['EXO', 20, 24, 26] },
      { id: 'sanct', n: 'The Sanctuary', t: 'Herod\'s new house, 100 cubits high and wide at the front, its face plated with gold so that, Josephus says, it blinded those who looked at sunrise. Inside, the Holy Place and, behind the veil, an empty Holy of Holies — the Ark was gone.', ref: ['MAT', 27, 50, 51] },
      { id: 'antonia', n: 'The Antonia Fortress', t: 'Herod\'s barracks at the north-west corner, named for Mark Antony, from which Roman soldiers watched the courts. Paul was rescued into it and spoke from its steps.', ref: ['ACT', 21, 34, 40] },
    ],
    svg: (a, p) => (
      <svg viewBox="0 0 800 520" className="dg">
        <H id="gentiles" active={a} pick={p}><rect x="90" y="70" width="620" height="400" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="3" /><T x="400" y="455" s={11} cls="muted">Court of the Gentiles — the whole platform, colonnaded on every side</T></H>
        <H id="stoa" active={a} pick={p}><rect x="90" y="430" width="620" height="40" fill="var(--dg-gold-soft)" stroke="currentColor" strokeWidth="2" />{Array.from({ length: 30 }, (_, i) => <circle key={i} cx={100 + i * 21} cy="450" r="2.5" fill="currentColor" />)}<T x="400" y="490" s={11}>Royal Stoa — south</T></H>
        <H id="portico" active={a} pick={p}><rect x="680" y="70" width="30" height="360" fill="var(--dg-gold-soft)" stroke="currentColor" strokeWidth="2" />{Array.from({ length: 17 }, (_, i) => <circle key={i} cx="695" cy={80 + i * 21} r="2.5" fill="currentColor" />)}<T x="740" y="250" s={11} a="start">Solomon's Portico</T></H>
        <H id="soreg" active={a} pick={p}><rect x="200" y="130" width="380" height="250" fill="none" stroke="var(--dg-red)" strokeWidth="2" strokeDasharray="5 4" /><T x="390" y="395" s={10} fill="var(--dg-red)">the Soreg — no Gentile beyond this line</T></H>
        <H id="women" active={a} pick={p}><rect x="430" y="170" width="120" height="170" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="3" /><rect x="432" y="172" width="22" height="22" fill="none" stroke="currentColor" /><rect x="526" y="172" width="22" height="22" fill="none" stroke="currentColor" /><rect x="432" y="316" width="22" height="22" fill="none" stroke="currentColor" /><rect x="526" y="316" width="22" height="22" fill="none" stroke="currentColor" /><T x="490" y="252" s={11}>Court of</T><T x="490" y="266" s={11}>Women</T></H>
        <H id="nicanor" active={a} pick={p}><path d="M430 235v40" stroke="var(--dg-gold)" strokeWidth="8" /><path d="M425 230q-16 25 0 50" fill="none" stroke="currentColor" strokeWidth="2" /><T x="415" y="300" s={10}>Nicanor</T></H>
        <H id="israel" active={a} pick={p}><rect x="240" y="170" width="190" height="170" fill="var(--dg-gold-soft)" stroke="currentColor" strokeWidth="3" /><path d="M410 170v170" stroke="currentColor" strokeDasharray="3 3" /><T x="420" y="160" s={9}>Israel</T><T x="330" y="160" s={10}>Court of the Priests</T></H>
        <H id="altar2" active={a} pick={p}><rect x="355" y="230" width="44" height="44" fill="var(--dg-bronze)" stroke="currentColor" strokeWidth="2" /><path d="M377 274v20" stroke="currentColor" strokeWidth="6" /><T x="377" y="312" s={10}>altar</T></H>
        <H id="sanct" active={a} pick={p}><rect x="230" y="200" width="110" height="110" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="3" /><rect x="248" y="220" width="30" height="70" fill="var(--dg-gold-soft)" stroke="currentColor" /><rect x="282" y="220" width="46" height="70" fill="var(--dg-cream)" stroke="currentColor" /><path d="M282 220v70" stroke="var(--dg-purple)" strokeWidth="3" /><T x="285" y="330" s={10}>the Sanctuary</T></H>
        <H id="antonia" active={a} pick={p}><rect x="70" y="50" width="70" height="60" fill="var(--dg-red)" fillOpacity=".25" stroke="currentColor" strokeWidth="2" /><rect x="66" y="46" width="12" height="12" fill="currentColor" /><rect x="132" y="46" width="12" height="12" fill="currentColor" /><rect x="66" y="102" width="12" height="12" fill="currentColor" /><rect x="132" y="102" width="12" height="12" fill="currentColor" /><T x="105" y="84" s={10}>Antonia</T></H>
        <T x="400" y="35" s={14} w={600}>The Temple Mount under Herod — plan, north at the top</T>
      </svg>
    ),
  },
  {
    id: 'jerusalem', n: 'Jerusalem in the days of Jesus', sub: 'Where the Passion happened', era: 'AD 30–33',
    intro: 'A city of perhaps forty thousand, swollen to several times that at Passover, on two ridges divided by the Tyropoeon valley, with the Temple filling the eastern hill and the Kidron dropping away to the Mount of Olives. From the Upper Room to Gethsemane is a twenty-minute walk downhill; from Gethsemane to the house of Caiaphas, uphill again; from Pilate\'s praetorium to Golgotha, outside the wall, a few hundred paces.',
    refs: [['LUK', 22, 39, 46], ['JHN', 18, 12, 14], ['JHN', 19, 17, 20]],
    chapters: { MAT: [21, 26, 27, 28], MRK: [11, 14, 15, 16], LUK: [19, 22, 23, 24], JHN: [5, 9, 12, 13, 18, 19, 20], ACT: [1, 2, 3] },
    parts: [
      { id: 'temple', n: 'The Temple Mount', t: 'Herod\'s vast platform on the eastern ridge, Mount Moriah, filling the north-east of the city. See its own diagram.', ref: ['MRK', 13, 1, 2] },
      { id: 'olives', n: 'The Mount of Olives and Gethsemane', t: 'Across the Kidron to the east, the ridge from which Jesus wept over the city and rode the colt, and at its foot the olive press — Gethsemane — where he prayed and was arrested. The Ascension is placed on its summit.', ref: ['MRK', 14, 32, 42] },
      { id: 'kidron', n: 'The Kidron valley', t: 'The ravine between the Temple and the Mount of Olives, crossed by Jesus on the night of the arrest, as David had crossed it fleeing Absalom.', ref: ['JHN', 18, 1, 1] },
      { id: 'upper', n: 'The Upper City', t: 'The wealthy western hill: Herod\'s palace, the houses of the high priests. Tradition places the house of Caiaphas, where Peter denied him, on its south-east slope.', ref: ['MAT', 26, 57, 58] },
      { id: 'cenacle', n: 'The Upper Room', t: 'The "large upper room, furnished" of the Last Supper, and by tradition of Pentecost too, on the south-west hill now called Mount Zion.', ref: ['MRK', 14, 12, 16] },
      { id: 'praet', n: 'The Praetorium', t: 'Pilate\'s seat when in Jerusalem — either Herod\'s palace in the west or the Antonia by the Temple. Here the trial, the scourging, the crown of thorns, and Ecce homo.', ref: ['JHN', 18, 28, 33] },
      { id: 'golgotha', n: 'Golgotha and the tomb', t: 'A disused quarry just outside the western wall, by a gate and a road, with rock-cut tombs in a garden beside it. The Church of the Holy Sepulchre stands over both — the city wall was later moved out to enclose them.', ref: ['JHN', 19, 17, 20] },
      { id: 'siloam', n: 'The Pool of Siloam', t: 'At the bottom of the city, fed by Hezekiah\'s tunnel from the Gihon spring. Jesus sent the man born blind to wash here.', ref: ['JHN', 9, 1, 7] },
      { id: 'bethesda', n: 'The Pool of Bethesda', t: 'Twin pools by the Sheep Gate north of the Temple, with five porticoes, where Jesus healed the man who had lain thirty-eight years.', ref: ['JHN', 5, 1, 9] },
      { id: 'lower', n: 'The Lower City', t: 'The crowded old town on the eastern ridge south of the Temple — the City of David — running down to Siloam.', ref: ['2SA', 5, 6, 9] },
    ],
    svg: (a, p) => (
      <svg viewBox="0 0 800 560" className="dg">
        <path d="M150 120q60-70 200-60q120-30 210 30v230q-30 80-120 130q-90 30-140-10q-70-30-120-100q-50-80-30-220z" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="3" />
        <H id="kidron" active={a} pick={p}><path d="M590 90q10 120-20 250q-20 90-60 150" fill="none" stroke="var(--dg-blue)" strokeWidth="6" strokeOpacity=".5" /><T x="612" y="330" s={11} a="start" fill="var(--dg-blue)">Kidron</T></H>
        <path d="M330 130q-10 150 30 300" fill="none" stroke="var(--dg-blue)" strokeWidth="3" strokeOpacity=".3" strokeDasharray="6 5" /><T x="335" y="300" s={9} cls="muted">Tyropoeon valley</T>
        <H id="temple" active={a} pick={p}><rect x="400" y="120" width="160" height="150" fill="var(--dg-gold-soft)" stroke="currentColor" strokeWidth="3" /><rect x="455" y="170" width="40" height="40" fill="var(--dg-gold)" stroke="currentColor" /><T x="480" y="250" s={12} w={600}>Temple Mount</T></H>
        <H id="bethesda" active={a} pick={p}><rect x="470" y="88" width="24" height="24" fill="var(--dg-blue)" fillOpacity=".5" stroke="currentColor" /><rect x="496" y="88" width="24" height="24" fill="var(--dg-blue)" fillOpacity=".5" stroke="currentColor" /><T x="495" y="80" s={10}>Bethesda</T></H>
        <H id="praet" active={a} pick={p}><rect x="380" y="100" width="40" height="34" fill="var(--dg-red)" fillOpacity=".35" stroke="currentColor" strokeWidth="2" /><T x="355" y="95" s={10}>Antonia / Praetorium</T></H>
        <H id="upper" active={a} pick={p}><path d="M170 150q50-40 150-30v250l-100 40q-40-80-50-260z" fill="var(--dg-gold-soft)" fillOpacity=".7" stroke="currentColor" strokeDasharray="4 3" /><T x="240" y="190" s={12} w={600}>Upper City</T><rect x="185" y="200" width="50" height="40" fill="var(--dg-red)" fillOpacity=".25" stroke="currentColor" /><T x="210" y="255" s={9}>Herod's palace</T><T x="270" y="330" s={9}>house of Caiaphas</T><circle cx="270" cy="315" r="5" fill="currentColor" /></H>
        <H id="cenacle" active={a} pick={p}><rect x="215" y="360" width="26" height="22" fill="var(--dg-purple)" fillOpacity=".4" stroke="currentColor" /><T x="228" y="400" s={10}>Upper Room</T></H>
        <H id="lower" active={a} pick={p}><path d="M400 280q30 40 20 110l-50 60q-40-40-40-160z" fill="var(--dg-cream)" stroke="currentColor" strokeDasharray="4 3" /><T x="390" y="340" s={10}>Lower City</T><T x="390" y="354" s={9} cls="muted">City of David</T></H>
        <H id="siloam" active={a} pick={p}><rect x="370" y="440" width="30" height="18" fill="var(--dg-blue)" fillOpacity=".5" stroke="currentColor" /><T x="385" y="475" s={10}>Siloam</T></H>
        <H id="olives" active={a} pick={p}><path d="M640 120q60 60 60 200q0 80-40 130" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" /><T x="690" y="200" s={12} w={600} a="start">Mount of</T><T x="690" y="216" s={12} w={600} a="start">Olives</T><g transform="translate(615 280)"><circle r="6" fill="var(--dg-green)" /><circle cx="10" cy="-6" r="5" fill="var(--dg-green)" /><circle cx="-8" cy="-7" r="5" fill="var(--dg-green)" /></g><T x="640" y="300" s={10} a="start">Gethsemane</T></H>
        <H id="golgotha" active={a} pick={p}><path d="M120 150l8-14 8 14M128 136v-10M124 130h8" stroke="currentColor" strokeWidth="2" fill="none" /><circle cx="128" cy="150" r="4" fill="currentColor" /><T x="128" y="170" s={10}>Golgotha</T><T x="128" y="182" s={9} cls="muted">& the tomb</T></H>
        <T x="400" y="35" s={14} w={600}>Jerusalem, c. AD 30 — north at the top</T>
        <T x="400" y="540" s={11} cls="muted">Upper Room → Gethsemane, downhill, about 1 km · Gethsemane → Caiaphas, uphill · Praetorium → Golgotha, a few hundred paces</T>
      </svg>
    ),
  },
  {
    id: 'tribes', n: 'The land of the twelve tribes', sub: 'Joshua 13–21 · the allotment of Canaan', era: 'c. 1400 BC',
    intro: 'When the conquest was done, Joshua cast lots at Shiloh and divided the land west of the Jordan among nine and a half tribes; Reuben, Gad and half of Manasseh had already taken the high pasture east of the river. Levi received no land — the Lord was their inheritance — but forty-eight cities scattered through the rest. Judah took the south, Ephraim and Manasseh the centre, and Dan, squeezed out by the Philistines, migrated to the far north.',
    refs: [['JOS', 13, 7, 8], ['JOS', 18, 1, 10], ['NUM', 34, 1, 15]],
    chapters: { JOS: [13, 14, 15, 16, 17, 18, 19, 20, 21], NUM: [32, 34], JDG: [1, 18], GEN: [49], DEU: [33], EZK: [47, 48] },
    parts: [
      { id: 'judah', n: 'Judah', t: 'The largest share — the hill country from Jerusalem south to the desert, with Hebron and Bethlehem. From it came David and, by the promise of Jacob, the sceptre that would not depart.', ref: ['JOS', 15, 1, 12] },
      { id: 'simeon', n: 'Simeon', t: 'Cities inside Judah\'s share in the Negev — Beersheba among them — fulfilling Jacob\'s word that Simeon would be "scattered in Israel". It was soon absorbed.', ref: ['JOS', 19, 1, 9] },
      { id: 'benjamin', n: 'Benjamin', t: 'A small strip between Judah and Ephraim holding Jericho, Bethel, Gibeon and — on its border with Judah — Jerusalem. Saul\'s tribe, and Paul\'s.', ref: ['JOS', 18, 11, 28] },
      { id: 'dan', n: 'Dan', t: 'Allotted the coast west of Benjamin, but the Amorites and Philistines kept them out; the tribe migrated to Laish in the far north and renamed it Dan — "from Dan to Beersheba".', ref: ['JDG', 18, 27, 31] },
      { id: 'ephraim', n: 'Ephraim', t: 'The heart of the hill country, with Shiloh and the Tabernacle, and Shechem where Joshua renewed the covenant. Joshua\'s own tribe, and later the leading tribe of the northern kingdom.', ref: ['JOS', 16, 5, 10] },
      { id: 'manasseh', n: 'Manasseh', t: 'Joseph\'s elder son, given a double portion: half west of the Jordan, north of Ephraim, and half in Bashan and Gilead to the east.', ref: ['JOS', 17, 1, 11] },
      { id: 'issachar', n: 'Issachar', t: 'The valley of Jezreel and the plain below Mount Tabor — the best farmland, and the battlefield of Deborah, Gideon and Saul.', ref: ['JOS', 19, 17, 23] },
      { id: 'zebulun', n: 'Zebulun', t: 'The Galilean hills around Nazareth. Isaiah\'s "land of Zebulun and Naphtali" that would see a great light is where Jesus grew up and preached.', ref: ['ISA', 9, 1, 2] },
      { id: 'naphtali', n: 'Naphtali', t: 'West of the Sea of Galilee and north into the hills: Capernaum, Chorazin, Hazor. The heartland of the ministry of Jesus.', ref: ['MAT', 4, 13, 16] },
      { id: 'asher', n: 'Asher', t: 'The fertile coastal strip up to Tyre and Sidon — "his bread shall be fat". The prophetess Anna was of Asher.', ref: ['JOS', 19, 24, 31] },
      { id: 'reuben', n: 'Reuben', t: 'East of the Dead Sea, the plateau of Moab around Heshbon; the firstborn who lost his pre-eminence and faded from the story.', ref: ['JOS', 13, 15, 23] },
      { id: 'gad', n: 'Gad', t: 'Gilead east of the Jordan, cattle country, with the Jabbok where Jacob wrestled and Mahanaim where David sheltered.', ref: ['JOS', 13, 24, 28] },
      { id: 'levi', n: 'Levi', t: 'No territory: forty-eight cities with their pasture, spread among all the tribes, six of them cities of refuge. "The Lord is his inheritance."', ref: ['JOS', 21, 1, 3] },
    ],
    svg: (a, p) => (
      <svg viewBox="0 0 800 560" className="dg">
        <path d="M0 0h800v560H0z" fill="var(--dg-blue)" fillOpacity=".08" />
        <path d="M240 40q-40 200 30 480L800 560V0z" fill="var(--dg-cream)" />
        <T x="110" y="280" s={13} fill="var(--dg-blue)" cls="it">The Great Sea</T>
        <path d="M520 40v60q-30 30-40 90q10 60-10 120q-10 60-5 100" fill="none" stroke="var(--dg-blue)" strokeWidth="4" />
        <ellipse cx="500" cy="130" rx="26" ry="32" fill="var(--dg-blue)" fillOpacity=".5" /><T x="500" y="134" s={8} fill="#fff">Galilee</T>
        <path d="M455 400q-10 80 30 140h40q20-70-5-140z" fill="var(--dg-blue)" fillOpacity=".5" /><T x="490" y="470" s={9} fill="#fff">Dead</T><T x="490" y="482" s={9} fill="#fff">Sea</T>
        <H id="asher" active={a} pick={p}><path d="M262 40h90v130l-60 20q-30-60-30-150z" fill="var(--dg-green)" fillOpacity=".25" stroke="currentColor" /><T x="300" y="110" s={11}>Asher</T></H>
        <H id="naphtali" active={a} pick={p}><path d="M352 40h150l14 60q-40 20-40 80l-30 10-94-20z" fill="var(--dg-gold-soft)" stroke="currentColor" /><T x="420" y="100" s={11}>Naphtali</T><T x="500" y="60" s={9} cls="muted">Dan (later)</T></H>
        <H id="zebulun" active={a} pick={p}><path d="M292 190l60-20 94 20-10 50-100 10-20-30z" fill="var(--dg-purple)" fillOpacity=".2" stroke="currentColor" /><T x="380" y="220" s={11}>Zebulun</T><circle cx="345" cy="235" r="3" fill="currentColor" /><T x="345" y="248" s={8}>Nazareth</T></H>
        <H id="issachar" active={a} pick={p}><path d="M446 190l30-10 10 90-50 10-10-40z" fill="var(--dg-gold)" fillOpacity=".3" stroke="currentColor" /><T x="465" y="240" s={10}>Issachar</T></H>
        <H id="manasseh" active={a} pick={p}><path d="M280 240l20 30 100-10 30 20 50-10 10 70-70 20-140 0-20-90z" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="2" /><T x="360" y="300" s={11}>Manasseh</T><path d="M536 100l60-10 130 0 0 190-100 10-40-70 10-70z" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="2" /><T x="640" y="170" s={11}>Manasseh (east)</T><T x="640" y="184" s={9} cls="muted">Bashan · Gilead</T></H>
        <H id="ephraim" active={a} pick={p}><path d="M260 360h200l10 50-200 20-20-40z" fill="var(--dg-green)" fillOpacity=".3" stroke="currentColor" /><T x="360" y="390" s={11}>Ephraim</T><circle cx="410" cy="378" r="3" fill="currentColor" /><T x="410" y="372" s={8}>Shiloh</T></H>
        <H id="dan" active={a} pick={p}><path d="M245 420l35 10-10 40-30-10z" fill="var(--dg-gold-soft)" stroke="currentColor" /><T x="258" y="448" s={9}>Dan</T></H>
        <H id="benjamin" active={a} pick={p}><path d="M280 430l190-20 5 50-190 10z" fill="var(--dg-purple)" fillOpacity=".25" stroke="currentColor" /><T x="380" y="452" s={11}>Benjamin</T><circle cx="400" cy="465" r="3.5" fill="currentColor" /><T x="420" y="478" s={8} a="start">Jerusalem</T></H>
        <H id="judah" active={a} pick={p}><path d="M270 470l205-10 5 100-170 0-30-40z" fill="var(--dg-red)" fillOpacity=".2" stroke="currentColor" strokeWidth="2" /><T x="380" y="510" s={12} w={600}>Judah</T><circle cx="400" cy="490" r="3" fill="currentColor" /><T x="418" y="494" s={8} a="start">Bethlehem</T><circle cx="380" cy="525" r="3" fill="currentColor" /><T x="395" y="528" s={8} a="start">Hebron</T></H>
        <H id="simeon" active={a} pick={p}><path d="M300 540l60-5 10 25h-80z" fill="var(--dg-gold)" fillOpacity=".3" stroke="currentColor" /><T x="335" y="553" s={9}>Simeon</T></H>
        <H id="gad" active={a} pick={p}><path d="M536 290l100-10 60 0 10 70-130 20-40-40z" fill="var(--dg-green)" fillOpacity=".25" stroke="currentColor" /><T x="620" y="330" s={11}>Gad</T><T x="620" y="344" s={9} cls="muted">Gilead</T></H>
        <H id="reuben" active={a} pick={p}><path d="M540 370l140-20 20 90-140 10z" fill="var(--dg-purple)" fillOpacity=".2" stroke="currentColor" /><T x="620" y="410" s={11}>Reuben</T></H>
        <H id="levi" active={a} pick={p}>{[[300, 380], [440, 470], [610, 300], [640, 400], [360, 90], [420, 280]].map(([x, y], i) => <path key={i} d={`M${x} ${y}l4-6 4 6z`} fill="currentColor" />)}<T x="120" y="520" s={10} a="start">▲ Levi — cities of refuge</T><T x="120" y="534" s={9} a="start" cls="muted">no land; 48 cities among the tribes</T></H>
        <path d="M700 60v70" stroke="currentColor" /><path d="M700 60l-4 8h8z" fill="currentColor" /><T x="700" y="145" s={10}>N</T>
        <T x="500" y="330" s={9} fill="var(--dg-blue)" cls="it">Jordan</T>
      </svg>
    ),
  },
  {
    id: 'kingdoms', n: 'One kingdom, then two', sub: 'From Saul to the exile · 1050–538 BC', era: '1050–538 BC',
    intro: 'Israel asked for a king and got Saul; David united the tribes and took Jerusalem; Solomon built the Temple. Then, in 931 BC, ten tribes broke away under Jeroboam and the story runs on two tracks for two centuries: Israel in the north with its capital at Samaria and nineteen kings, not one of them good; Judah in the south with the line of David and the Temple. Assyria destroyed Israel in 722 BC and its people were lost. Babylon burned Jerusalem in 586, but Judah came home.',
    refs: [['1KI', 12, 16, 20], ['2KI', 17, 5, 8], ['2KI', 25, 8, 12]],
    chapters: { '1SA': [8, 9, 10], '2SA': [5], '1KI': [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], '2KI': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25], '2CH': [10, 11, 12, 13, 36], HOS: [1], AMO: [1], ISA: [1, 7, 36, 37, 39], JER: [1, 39, 52] },
    parts: [
      { id: 'united', n: 'The united kingdom', t: 'Three kings, forty years each, by the traditional count: Saul (1050–1010), David (1010–970), Solomon (970–931). One capital, one Temple, borders from the Euphrates to Egypt under Solomon — and heavy taxes and forced labour to pay for it.', ref: ['1KI', 4, 20, 25] },
      { id: 'split', n: 'The split — 931 BC', t: 'Rehoboam, Solomon\'s son, refused to lighten the yoke: "my little finger is thicker than my father\'s loins." The northern tribes walked out — "What portion have we in David? To your tents, O Israel!" — and made Jeroboam king.', ref: ['1KI', 12, 1, 20] },
      { id: 'israel', n: 'Israel — the northern kingdom', t: 'Ten tribes, capital at Samaria, golden calves at Bethel and Dan so that pilgrims would not go to Jerusalem. Nine dynasties in two hundred years, ended by murder more often than not: Omri, Ahab and Jezebel, Jehu. Elijah, Elisha, Amos and Hosea preached here.', ref: ['1KI', 12, 25, 33] },
      { id: 'judah', n: 'Judah — the southern kingdom', t: 'Two tribes, Judah and Benjamin, one dynasty — David\'s — for three and a half centuries in Jerusalem. Some good kings (Asa, Jehoshaphat, Hezekiah, Josiah) among the bad. Isaiah, Micah and Jeremiah preached here.', ref: ['2KI', 18, 1, 7] },
      { id: 'assyria', n: 'The fall of Israel — 722 BC', t: 'Shalmaneser V and Sargon II took Samaria after three years\' siege and deported the population across the empire — the "lost ten tribes". Foreigners were settled in their place; their descendants were the Samaritans.', ref: ['2KI', 17, 5, 24] },
      { id: 'babylon', n: 'The fall of Judah — 586 BC', t: 'Nebuchadnezzar took Jerusalem twice: in 597 (Ezekiel and the king deported) and finally in 586, when Temple, palace and walls were burned and Zedekiah\'s sons killed before his eyes. Seventy years of exile, as Jeremiah had said.', ref: ['2KI', 25, 1, 12] },
      { id: 'return', n: 'The return — 538 BC', t: 'Cyrus of Persia, in the first year of his conquest of Babylon, sent the Jews home to rebuild. Zerubbabel and Joshua laid the Temple foundations; Ezra and Nehemiah followed. The northern tribes never came back.', ref: ['EZR', 1, 1, 4] },
    ],
    svg: (a, p) => (
      <svg viewBox="0 0 800 460" className="dg">
        <path d="M60 80h680" stroke="currentColor" strokeOpacity=".25" />
        {[[60, '1050'], [230, '931'], [500, '722'], [640, '586'], [720, '538']].map(([x, y]) => <g key={y}><path d={`M${x} 74v12`} stroke="currentColor" /><T x={x} y="66" s={10} cls="muted">{y} BC</T></g>)}
        <H id="united" active={a} pick={p}><rect x="60" y="180" width="170" height="70" rx="8" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><T x="145" y="205" s={12} w={600}>United kingdom</T><T x="145" y="222" s={10}>Saul · David · Solomon</T><T x="145" y="238" s={9} cls="muted">Jerusalem · the Temple</T></H>
        <H id="split" active={a} pick={p}><path d="M230 215l60-90h40M230 215l60 90h40" fill="none" stroke="currentColor" strokeWidth="3" /><circle cx="230" cy="215" r="7" fill="var(--dg-red)" stroke="currentColor" strokeWidth="2" /><T x="260" y="215" s={9} fill="var(--dg-red)">931</T></H>
        <H id="israel" active={a} pick={p}><rect x="330" y="95" width="170" height="60" rx="8" fill="var(--dg-green)" fillOpacity=".3" stroke="currentColor" strokeWidth="2" /><T x="415" y="118" s={12} w={600}>ISRAEL — north</T><T x="415" y="134" s={10}>10 tribes · Samaria</T><T x="415" y="148" s={9} cls="muted">19 kings, 9 dynasties, none good</T></H>
        <H id="judah" active={a} pick={p}><rect x="330" y="275" width="310" height="60" rx="8" fill="var(--dg-purple)" fillOpacity=".2" stroke="currentColor" strokeWidth="2" /><T x="485" y="298" s={12} w={600}>JUDAH — south</T><T x="485" y="314" s={10}>2 tribes · Jerusalem · the house of David</T><T x="485" y="328" s={9} cls="muted">20 kings, one dynasty, some good</T></H>
        <H id="assyria" active={a} pick={p}><path d="M500 125h20" stroke="currentColor" strokeWidth="2" /><path d="M520 100l30 50M550 100l-30 50" stroke="var(--dg-red)" strokeWidth="4" /><T x="600" y="120" s={10} a="start">722 — Assyria</T><T x="600" y="134" s={9} a="start" cls="muted">deported, never returned</T></H>
        <H id="babylon" active={a} pick={p}><path d="M640 305h10" stroke="currentColor" strokeWidth="2" /><path d="M650 285l30 40M680 285l-30 40" stroke="var(--dg-red)" strokeWidth="4" /><T x="665" y="345" s={10}>586 — Babylon</T><T x="665" y="359" s={9} cls="muted">seventy years of exile</T></H>
        <H id="return" active={a} pick={p}><path d="M690 305q40 0 40 60" fill="none" stroke="var(--dg-gold)" strokeWidth="3" strokeDasharray="5 3" /><rect x="690" y="370" width="80" height="44" rx="8" fill="var(--dg-gold-soft)" stroke="currentColor" strokeWidth="2" /><T x="730" y="388" s={10} w={600}>Return</T><T x="730" y="404" s={9}>538 · Cyrus</T></H>
        <T x="400" y="35" s={14} w={600}>The kingdoms of Israel and Judah</T>
        <T x="145" y="290" s={9} cls="muted">the prophets Samuel, Nathan</T><T x="415" y="190" s={9} cls="muted">Elijah · Elisha · Amos · Hosea</T><T x="485" y="370" s={9} cls="muted">Isaiah · Micah · Jeremiah · Ezekiel (in exile)</T>
      </svg>
    ),
  },
  {
    id: 'noah', n: "Noah's Ark", sub: 'Genesis 6 · the measure of the ark', era: 'before Abraham',
    intro: 'Three hundred cubits long, fifty wide, thirty high — about 137 by 23 by 14 metres, a box of the proportions of a modern cargo ship, with three decks, one door in the side and an opening a cubit high beneath the roof. It was not built to sail anywhere but to float, and its Hebrew word, tebah, is used elsewhere only once: for the basket in which the infant Moses floated on the Nile. Peter and the early Fathers saw in it the Church, and in the flood, baptism.',
    refs: [['GEN', 6, 13, 22], ['GEN', 8, 1, 4], ['1PE', 3, 18, 22]],
    chapters: { GEN: [6, 7, 8, 9], MAT: [24], HEB: [11], '1PE': [3] },
    parts: [
      { id: 'hull', n: 'The ark', t: 'Gopher wood — a word found nowhere else, perhaps cypress — sealed with pitch inside and out. Its ratio of 30 : 5 : 3 is close to what shipbuilders use for stability in heavy seas.', ref: ['GEN', 6, 14, 15] },
      { id: 'decks', n: 'Three decks', t: '"Lower, second and third stories", divided into rooms (literally "nests"). Total floor area about 8,900 m², the size of twenty basketball courts.', ref: ['GEN', 6, 16, 16] },
      { id: 'door', n: 'The door in the side', t: 'One door, which Noah did not shut: "and the Lord shut him in." The Fathers saw in it the wound in the side of Christ from which the Church was born.', ref: ['GEN', 7, 16, 16] },
      { id: 'window', n: 'The opening (tsohar)', t: 'A cubit from the top, running under the roof — light and air for the whole length. From "the window" Noah sent out the raven and the dove.', ref: ['GEN', 8, 6, 12] },
      { id: 'scale', n: 'For scale', t: 'A football pitch is 105 m long; the ark was 137. Nothing larger was built of wood until the nineteenth century.', ref: ['GEN', 6, 15, 15] },
    ],
    svg: (a, p) => (
      <svg viewBox="0 0 800 400" className="dg">
        <path d="M0 330q100-20 200 0t200 0 200 0 200 0v70H0z" fill="var(--dg-blue)" fillOpacity=".25" />
        <H id="hull" active={a} pick={p}><path d="M100 140h600v160q0 20-20 20H120q-20 0-20-20z" fill="var(--dg-bronze)" stroke="currentColor" strokeWidth="3" /><path d="M100 300h600" stroke="currentColor" strokeOpacity=".3" /><path d="M100 140l20-20h560l20 20" fill="var(--dg-gold-soft)" stroke="currentColor" strokeWidth="2" /><T x="400" y="355" s={12}>300 cubits (137 m)</T><T x="740" y="230" s={11} a="start">30</T><T x="740" y="244" s={9} a="start" cls="muted">cubits</T></H>
        <H id="decks" active={a} pick={p}><path d="M100 194h600M100 248h600" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />{Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${150 + i * 50} 140v160`} stroke="currentColor" strokeOpacity=".2" />)}<T x="60" y="170" s={10} a="end">third</T><T x="60" y="224" s={10} a="end">second</T><T x="60" y="278" s={10} a="end">lower</T></H>
        <H id="door" active={a} pick={p}><rect x="370" y="250" width="40" height="50" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><circle cx="403" cy="278" r="2.5" fill="currentColor" /><T x="390" y="315" s={10}>the door</T></H>
        <H id="window" active={a} pick={p}><rect x="120" y="128" width="560" height="10" fill="var(--dg-cream)" stroke="currentColor" /><T x="400" y="110" s={10}>the opening, a cubit below the roof</T></H>
        <H id="scale" active={a} pick={p}><rect x="100" y="370" width="460" height="14" fill="var(--dg-green)" fillOpacity=".4" stroke="currentColor" /><T x="330" y="381" s={9}>a football pitch — 105 m</T><T x="580" y="381" s={9} a="start" cls="muted">the ark runs 32 m further →</T></H>
        <T x="400" y="40" s={14} w={600}>The ark — side view, a cubit taken as 45 cm</T>
      </svg>
    ),
  },
  {
    id: 'priest', n: 'The High Priest', sub: 'Exodus 28 · the garments for glory and for beauty', era: 'from Aaron',
    intro: 'Aaron and his sons after him were dressed by God\'s own design: linen underneath, a blue robe hung with bells and pomegranates, over it the ephod of gold thread and the breastplate with twelve stones for the twelve tribes, and on the turban a plate of gold engraved "Holiness to the Lord." He carried the names of Israel on his shoulders and over his heart when he went in before God. Hebrews reads every piece as a picture of Christ, the great high priest.',
    refs: [['EXO', 28, 1, 4], ['EXO', 28, 29, 30], ['HEB', 4, 14, 16]],
    chapters: { EXO: [28, 29, 39], LEV: [8, 16, 21], NUM: [27], HEB: [4, 5, 7], ZEC: [3] },
    parts: [
      { id: 'plate', n: 'The golden plate', t: 'On the front of the turban, a plate of pure gold engraved like a seal: HOLINESS TO THE LORD — Sanctum Domino. Whatever was wanting in the people\'s offerings, the priest bore the guilt of it.', ref: ['EXO', 28, 36, 38] },
      { id: 'breast', n: 'The breastplate of judgement', t: 'A span square, doubled, of the same work as the ephod, set with twelve stones in four rows, each engraved with the name of a tribe. Inside it the Urim and Thummim, by which the will of God was asked.', ref: ['EXO', 28, 15, 30] },
      { id: 'ephod', n: 'The ephod', t: 'A kind of apron of gold, blue, purple, scarlet and fine linen, with two shoulder-pieces, each carrying an onyx stone engraved with six tribal names: Israel carried on the priest\'s shoulders.', ref: ['EXO', 28, 6, 14] },
      { id: 'robe', n: 'The robe of the ephod', t: 'All of blue, woven in one piece, its hem hung alternately with golden bells and pomegranates of blue, purple and scarlet — "that his sound may be heard when he goes into the holy place, so that he does not die."', ref: ['EXO', 28, 31, 35] },
      { id: 'tunic', n: 'The tunic, sash and turban', t: 'Fine linen, embroidered; the sash of needlework; the turban (mitre) of linen. On the Day of Atonement the high priest laid aside all the gold and entered the Holy of Holies in plain linen only.', ref: ['LEV', 16, 3, 4] },
    ],
    svg: (a, p) => (
      <svg viewBox="0 0 800 520" className="dg">
        <g transform="translate(400 0)">
          <H id="tunic" active={a} pick={p}><path d="M-70 200l-40 20-10 270h240l-10-270-40-20z" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="2" /><path d="M-30 90a30 30 0 1 1 60 0a30 30 0 1 1-60 0" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="2" /><path d="M-32 90q0-30 32-32q32 2 32 32" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="2" /><T x="0" y="100" s={10}>turban</T><T x="150" y="470" s={11} a="start">linen tunic</T><path d="M150 466l-50-20" stroke="currentColor" strokeOpacity=".4" /></H>
          <H id="plate" active={a} pick={p}><rect x="-28" y="70" width="56" height="14" rx="2" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><T x="-140" y="80" s={11} a="end">Holiness to the Lord</T><path d="M-140 76l100 0" stroke="currentColor" strokeOpacity=".4" /></H>
          <H id="robe" active={a} pick={p}><path d="M-80 200l-30 30v200h220V230l-30-30z" fill="var(--dg-blue)" fillOpacity=".5" stroke="currentColor" strokeWidth="2" />{Array.from({ length: 11 }, (_, i) => <g key={i} transform={`translate(${-100 + i * 20} 430)`}>{i % 2 ? <circle r="5" fill="var(--dg-gold)" stroke="currentColor" /> : <circle r="5" fill="var(--dg-red)" stroke="currentColor" />}</g>)}<T x="170" y="330" s={11} a="start">robe of blue</T><T x="170" y="344" s={9} a="start" cls="muted">bells and pomegranates</T><path d="M168 326l-58-10" stroke="currentColor" strokeOpacity=".4" /></H>
          <H id="ephod" active={a} pick={p}><path d="M-60 200h120v140h-120z" fill="var(--dg-gold)" fillOpacity=".8" stroke="currentColor" strokeWidth="2" /><rect x="-70" y="185" width="26" height="20" rx="4" fill="var(--dg-bronze)" stroke="currentColor" /><rect x="44" y="185" width="26" height="20" rx="4" fill="var(--dg-bronze)" stroke="currentColor" /><T x="-150" y="200" s={11} a="end">ephod — two onyx stones</T><T x="-150" y="214" s={9} a="end" cls="muted">six names on each shoulder</T><path d="M-148 196l78 0" stroke="currentColor" strokeOpacity=".4" /></H>
          <H id="breast" active={a} pick={p}><rect x="-40" y="220" width="80" height="80" fill="var(--dg-gold-2)" stroke="currentColor" strokeWidth="2" />{['#8a2e2e', '#c9a45c', '#2f6a4f', '#3b6ea5', '#5a3d7a', '#b8b8b8', '#d97b3a', '#2f6a4f', '#8a2e2e', '#3b6ea5', '#c9a45c', '#5a3d7a'].map((c, i) => <circle key={i} cx={-25 + (i % 4) * 17} cy={235 + Math.floor(i / 4) * 24} r="6" fill={c} stroke="currentColor" />)}<T x="-150" y="260" s={11} a="end">breastplate — twelve stones</T><T x="-150" y="274" s={9} a="end" cls="muted">the tribes over his heart</T><path d="M-148 256l106 0" stroke="currentColor" strokeOpacity=".4" /></H>
        </g>
        <T x="400" y="35" s={14} w={600}>The vestments of the high priest</T>
      </svg>
    ),
  },
  {
    id: 'creation', n: 'The week of creation', sub: 'Genesis 1 · forming and filling', era: 'in the beginning',
    intro: 'The first chapter of Genesis is built like a poem. Three days of forming — light, sky and sea, land — answered by three days of filling: the lights, the birds and fish, the beasts and man. What is separated on day one is populated on day four, and so on across. The seventh day, with no evening and morning, is God\'s rest, the Sabbath, into which Hebrews says his people are still invited.',
    refs: [['GEN', 1, 1, 5], ['GEN', 2, 1, 3], ['HEB', 4, 9, 11]],
    chapters: { GEN: [1, 2], PSA: [8, 103, 104], JHN: [1], HEB: [4], COL: [1] },
    parts: [
      { id: 'd1', n: 'Day 1 — light', t: '"Let there be light." Light and darkness are separated and named Day and Night — before the sun exists, which the ancients noticed and pondered.', ref: ['GEN', 1, 3, 5] },
      { id: 'd2', n: 'Day 2 — the firmament', t: 'A vault (firmamentum) set between the waters above and the waters below: sky and sea.', ref: ['GEN', 1, 6, 8] },
      { id: 'd3', n: 'Day 3 — land and plants', t: 'The waters are gathered and dry land appears; the earth brings forth grass, herbs and fruit trees, each with its seed.', ref: ['GEN', 1, 9, 13] },
      { id: 'd4', n: 'Day 4 — sun, moon and stars', t: 'The lights fill what day one separated: to rule the day and the night, and to mark seasons, days and years. They are lamps, not gods — a quiet answer to Babylon.', ref: ['GEN', 1, 14, 19] },
      { id: 'd5', n: 'Day 5 — fish and birds', t: 'The sea and sky of day two are filled: "great whales" and every winged fowl, and the first blessing: be fruitful and multiply.', ref: ['GEN', 1, 20, 23] },
      { id: 'd6', n: 'Day 6 — beasts and man', t: 'The land of day three is filled: cattle, creeping things, beasts — and then man, male and female, in the image of God, given dominion. "And it was very good."', ref: ['GEN', 1, 24, 31] },
      { id: 'd7', n: 'Day 7 — rest', t: 'God rests and blesses the seventh day. It has no "evening and morning": the rest has not ended. The Sabbath, and the Christian Sunday, keep it.', ref: ['GEN', 2, 1, 3] },
    ],
    svg: (a, p) => (
      <svg viewBox="0 0 800 460" className="dg">
        <T x="220" y="70" s={12} w={600} cls="muted">FORMING</T><T x="580" y="70" s={12} w={600} cls="muted">FILLING</T>
        {[['d1', 100, 'Light', 'day and night', 'd4', 'Sun, moon, stars', 'to rule day and night'], ['d2', 210, 'Firmament', 'sky and sea', 'd5', 'Birds and fish', 'to fill sky and sea'], ['d3', 320, 'Land, plants', 'earth and its fruit', 'd6', 'Beasts and man', 'to fill the earth']].map(([l, y, ln, ls, r, rn, rs], i) => (
          <g key={l}>
            <path d={`M320 ${y + 30}h160`} stroke="var(--dg-gold)" strokeWidth="2" strokeDasharray="6 4" /><path d={`M480 ${y + 30}l-8-5v10z`} fill="var(--dg-gold)" />
            <H id={l} active={a} pick={p}><rect x="100" y={y} width="220" height="60" rx="10" fill="var(--dg-cream)" stroke="currentColor" strokeWidth="2" /><T x="125" y={y + 36} s={20} w={600} fill="var(--dg-gold)">{i + 1}</T><T x="220" y={y + 27} s={13} w={600}>{ln}</T><T x="220" y={y + 45} s={10} cls="muted">{ls}</T></H>
            <H id={r} active={a} pick={p}><rect x="480" y={y} width="220" height="60" rx="10" fill="var(--dg-gold-soft)" stroke="currentColor" strokeWidth="2" /><T x="505" y={y + 36} s={20} w={600} fill="var(--dg-gold)">{i + 4}</T><T x="600" y={y + 27} s={13} w={600}>{rn}</T><T x="600" y={y + 45} s={10} cls="muted">{rs}</T></H>
          </g>
        ))}
        <H id="d7" active={a} pick={p}><rect x="100" y="410" width="600" height="40" rx="20" fill="var(--dg-gold)" stroke="currentColor" strokeWidth="2" /><T x="400" y="435" s={13} w={600} fill="#fffdf7">7 — And God rested: the Sabbath, with no evening and no morning</T></H>
        <T x="400" y="35" s={14} w={600}>Genesis 1 — the shape of the week</T>
      </svg>
    ),
  },
];

export const byId = Object.fromEntries(DIAGRAMS.map(d => [d.id, d]));
export function diagramsFor(bookId, c) { return DIAGRAMS.filter(d => d.chapters[bookId] && d.chapters[bookId].includes(c)); }

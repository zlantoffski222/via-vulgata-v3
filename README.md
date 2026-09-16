# Christ is King — a Bible for reading, praying and seeing

Version 3. Read the Latin Vulgate with the Douay-Rheims beside it — or any of nine other versions, including the Greek New Testament and the Hebrew Old Testament with Strong's numbers on every word — mark every verse as you go, and see each chapter in its time, place and art. The front page is *today*: the Church's calendar, the readings, the saint of the day, what fasting the day asks, and the prayers that belong to it.

## Run it

    npm install
    npm run build        # downloads the Bible texts on first run, renders icons, builds to dist/
    npm run preview      # serves dist/ locally

`npm run dev` starts a live-reloading dev server. `node scripts/single-file.js` packs the whole app into one HTML file.

## What is in it

- **Eleven versions.** Clementine Vulgate (Latin), Douay-Rheims, Catholic Public Domain Version, Berean Standard Bible, King James (with Apocrypha), World English Bible, JPS 1917, Brenton's Septuagint, Reina-Valera 1909 (Spanish), the SBL Greek New Testament and the Westminster Leningrad Codex (Hebrew). Every version is laid on the Vulgate's chapter-and-verse grid so that any verse can be compared across all of them.
- **Greek and Hebrew with Strong's.** Turn on the original language under any chapter; tap a word for its lemma, meaning, and every other place it appears.
- **Today.** The liturgical day and colour, the Mass readings, five passages chosen for the date, the saint of the day with a short life (366 of them), and fasting and abstinence under the current Catholic law, the traditional (1962) discipline, or the Orthodox rule.
- **Prayer.** Twenty common prayers in Latin and English, the Rosary with the Gospel of each mystery, the Stations of the Cross, the Divine Mercy Chaplet, and a timed *lectio divina* with the day's Gospel.
- **Diagrams.** The Tabernacle, the Ark, Solomon's and Herod's Temples, Jerusalem in the time of Jesus, the land of the twelve tribes, the two kingdoms, Noah's Ark, the High Priest's vestments and the week of creation — drawn to the text, every part tappable, and shown beside the chapters they belong to.
- **Study.** Timeline and map, 56 people, the harmony of the Gospels, prophecy and fulfilment, cross-references, a Latin dictionary, memory verses with spaced repetition, a notebook, quizzes generated from the data, three reading plans (canonical, story order, the life of Christ) that can be shared as a link, and a print/PDF button for any chapter.
- **Phone layout.** A separate layout for phones, installable as an app.

## Deploy

The `dist/` folder is a complete static site. Nothing runs on a server: reading progress lives in the browser, and "Ask" sends questions straight from the browser to Anthropic with the key you enter in Settings.

## Data and sources

- `public/data/text/…` — the texts. Vulgate and Douay-Rheims, KJV, WEB and JPS via the scrollmapper bible_databases project; BSB and CPDV likewise; Reina-Valera 1909 from open-bibles; Brenton's Septuagint from ebible.org (`raw/lxx`); SBLGNT from morphgnt; WLC from openscriptures/morphhb. Strong's dictionaries from openscriptures. All public domain or freely licensed.
- `public/data/saints.json`, `prayers.json`, `lectionary.json` — the calendar, the saints, the prayers.
- `public/data/timeline.json`, `people.json`, `harmony.json`, `prophecy.json`, `notes_*.json` — the study material.
- `src/diagrams.jsx` — the diagrams, hand-drawn SVG.
- `public/art/` — public-domain reproductions from Wikimedia Commons; when a file is missing the app fetches the picture from Wikipedia.

Version 2 of the app lives in its own repository and is unchanged.

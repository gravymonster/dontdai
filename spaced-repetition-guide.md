# Spaced Repetition Guide — Anki Setup for Deep Mastery

This guide gets you from "I have TSV files" to "I review the right cards every day." It's tuned for
your goal: **deep, long-term retention** at **~45 min/day**. Read it once, set things up in ~20
minutes, then forget about settings and just study.

---

## 0. Why spaced repetition (the 60-second version)

Memory fades on a predictable curve. If you review a fact *right before* you'd forget it, the next
forgetting takes much longer — each successful review stretches the interval (1 day → 3 days → 1 week
→ 3 weeks → 2 months…). Anki tracks that curve **per card** and shows you only what's due. That's why
10 minutes of Anki beats an hour of re-reading: you spend time only on what's about to slip.

For **deep mastery** the key levers are: (1) review *every* day so nothing piles up, (2) keep new
cards modest so reviews stay manageable, and (3) make each card test *one* thing in *both* directions
(recognize **and** produce).

---

## 1. Install Anki

- Desktop (do your setup here): **https://apps.ankiweb.net** — Windows/Mac/Linux, free.
- Make a free **AnkiWeb** account and **Sync** — then use the mobile app (AnkiMobile iOS / AnkiDroid
  Android, AnkiDroid is free) to do your 45 minutes anywhere.
- Do imports and template setup on **desktop**; review on any device.

---

## 2. What's in the `anki/` folder

```
anki/
├── vocabulary_all.tsv          ← all 437 vocab notes (one file, tagged by lesson)
├── grammar_patterns_all.tsv    ← all 85 grammar-pattern notes
├── foundation_radicals.tsv     ← 25 radical notes
└── by-lesson/
    ├── L01_vocabulary.tsv  L01_grammar.tsv
    ├── L02_vocabulary.tsv  L02_grammar.tsv
    └── … through L09
```

Each file is **tab-separated** with header lines (`#separator:tab`, `#columns:…`, `#tags column:N`)
so Anki auto-maps columns and tags on import. **Pick one workflow:**

- **Simplest:** import `vocabulary_all.tsv` once. Every note is tagged `L01`…`L09`, `dialogue`/`essay`,
  `vocab`/`grammar`. You'll *suspend* everything and unsuspend by tag as the plan reaches each lesson.
- **Drip-feed:** import `by-lesson/L0X_*.tsv` on the day the plan starts that lesson. Nothing to
  suspend — you only ever import what you're about to learn. **Recommended if you're new to Anki.**

### Column layout
| File | Columns |
|---|---|
| `*_vocabulary.tsv` | Simplified · Traditional · Pinyin · POS · English · Tags |
| `*_grammar.tsv` | Pattern · Pinyin · Usage · ExampleZh · ExampleEn · Tags |
| `foundation_radicals.tsv` | Radical · Pinyin · Meaning · ExampleChars · Tags |

---

## 3. Create the note types (one-time, ~10 min)

A **note** holds the data; **card templates** decide what gets quizzed. We want each vocab note to
generate **two cards**: recognition and production. This is the heart of deep mastery.

### 3a. Note type: **Heritage Vocab**
In Anki desktop: **Tools → Manage Note Types → Add → (clone Basic) → name it "Heritage Vocab"**.
Then **Fields…** and make exactly these 5 fields (in this order):

```
Simplified   Traditional   Pinyin   POS   English
```

Then **Cards…** and set up **two** card templates.

**Card 1 — Recognition (see hanzi → recall sound + meaning):**
- Front:
  ```
  <div style="font-size:64px">{{Simplified}}</div>
  ```
- Back:
  ```
  <div style="font-size:64px">{{Simplified}}</div>
  <hr>
  <div style="font-size:28px">{{Pinyin}}</div>
  <div style="color:#888">{{POS}}</div>
  <div style="font-size:24px">{{English}}</div>
  <div style="color:#888">繁體：{{Traditional}}</div>
  ```

**Card 2 — Production (see meaning → recall hanzi):**  (use the **+** to add a second card template)
- Front:
  ```
  <div style="font-size:28px">{{English}}</div>
  <div style="color:#888">{{POS}}</div>
  ```
- Back:
  ```
  <div style="font-size:28px">{{English}}</div>
  <hr>
  <div style="font-size:64px">{{Simplified}}</div>
  <div style="font-size:28px">{{Pinyin}}</div>
  ```

> One note → two independently-scheduled cards. You might find a word easy to recognize but hard to
> produce; Anki will show the production card more often. That asymmetry is exactly what you want.

### 3b. Note type: **Heritage Grammar** (single card)
Clone Basic → fields: `Pattern · Pinyin · Usage · ExampleZh · ExampleEn`. One template:
- Front: `<div style="font-size:36px">{{Pattern}}</div><div style="color:#888">{{Pinyin}}</div><div>How is this used? Give an example.</div>`
- Back: `<hr>{{Usage}}<div style="font-size:24px;margin-top:8px">{{ExampleZh}}</div><div style="color:#888">{{ExampleEn}}</div>`

### 3c. Note type: **Heritage Radical** (single card)
Clone Basic → fields: `Radical · Pinyin · Meaning · ExampleChars`. One template:
- Front: `<div style="font-size:64px">{{Radical}}</div><div>Meaning? Two example characters?</div>`
- Back: `<hr><div>{{Pinyin}} — {{Meaning}}</div><div style="font-size:28px">{{ExampleChars}}</div>`

---

## 4. Import (one-time per file)

**File → Import.** Pick the `.tsv`. Anki reads the header lines automatically. Then:
- **Note type:** Heritage Vocab (or Grammar / Radical to match the file).
- **Deck:** `传承中文::Vocab` (use `::` to make subdecks — see below).
- **Field mapping:** the columns map in order. Make sure the **Tags** column maps to *Tags*, not a field.
- **Existing notes:** "Update" so re-importing never duplicates.
- Click **Import**.

Repeat for grammar and radicals (into `传承中文::Grammar`, `传承中文::Foundation`).

**Deck structure to create:**
```
传承中文
├── 传承中文::Foundation
├── 传承中文::Vocab
└── 传承中文::Grammar
```
Studying the parent `传承中文` reviews all subdecks together — that's your daily queue.

---

## 5. Deck settings tuned for deep mastery + 45 min/day

Open the deck's gear → **Options**. Apply this preset to the `传承中文` deck (subdecks inherit):

| Setting | Value | Why |
|---|---|---|
| **New cards/day** | **12** | Matches the plan's heaviest days. Each becomes 2 vocab cards, so ~12 *notes* ≈ what a 45-min session sustains. Lower to 8 if reviews feel heavy. |
| **Maximum reviews/day** | **200** | High enough to never artificially block due cards. |
| **Learning steps** | `1m 10m 1d` | The third "1d" step adds a same-next-day touch → stronger encoding for hard heritage vocab. |
| **Graduating interval** | `3 days` | Slightly longer first real interval suits mastery. |
| **Easy interval** | `4 days` | — |
| **Desired retention** (FSRS) | **0.90** | See §6. 90% target = deep retention without drowning in reviews. |
| **Maximum interval** | `365 days` | Caps how far cards drift apart. |
| **New/review order** | Reviews **before** new | Forces the plan's "reviews first" rule. |
| **Bury related new/review siblings** | **On** | Keeps a word's two cards on different days so you don't see the answer on its sibling. |

> If a word is genuinely already known (you're a heritage speaker — many will be!), press **Easy** or
> just **suspend** that card. Don't waste reps on words you own. Quality of attention > card count.

---

## 6. Turn on FSRS (do this)

FSRS is Anki's modern scheduler — it models *your* memory and schedules far more efficiently than the
old algorithm. **Deck Options → top of the screen → enable "FSRS."** Set **Desired retention = 0.90**.
After ~2–3 weeks of reviews, click **"Optimize"** in FSRS settings so it learns your personal curve.
That's the single biggest quality-of-life win for a long book like this.

---

## 7. Your daily loop (the only routine that matters)

1. Open the `传承中文` deck. **Do every due card** (this is Block 1 of your 45 min).
2. Rate honestly:
   - **Again** = you didn't recall it (or got the tone wrong). Don't feel bad — this is the algorithm working.
   - **Hard** = recalled with real effort.
   - **Good** = recalled normally. *This is your default.*
   - **Easy** = instant, no effort. Use sparingly or intervals balloon too fast.
3. After the book-study block, **add today's new cards**:
   - *Drip-feed workflow:* import that day's `by-lesson` batch (or just the lesson once, and it feeds 12/day automatically).
   - *Suspend workflow:* **Browse →** search e.g. `tag:L03 tag:dialogue`, select the day's range, right-click → **Toggle Suspend** to release them.
4. **Sync** so your phone is current.

**Tone matters:** treat a right character with the wrong tone as **Again** on recognition cards. For a
heritage learner, tones are usually the real growth edge.

---

## 8. Troubleshooting & tips

- **Reviews piling up?** Lower New cards/day to 6–8 for a week; the backlog clears. Never abandon
  reviews to chase new cards.
- **Missed a few days?** Just do the due pile (it'll be big once). Don't "catch up" by adding extra
  new cards. Optionally use **FSRS → reschedule** to smooth it out.
- **A card is wrong/awkward?** Edit it freely — these are yours now. Add an example sentence from the
  book to the note to deepen the context.
- **Add your own cards** for anything in the dialogues/essays that tripped you up but isn't in the
  vocab list. The book is full of reusable chunks (chengyu, set phrases) worth a card each.
- **Audio:** heritage learners benefit hugely from the book's recordings. Consider adding the
  publisher's audio to recognition cards (drag an mp3 into the Pinyin field area) so you train listening too.

---

## 9. Quick start checklist

- [ ] Install Anki desktop + make an AnkiWeb account.
- [ ] Create the 3 note types (§3).
- [ ] Create the `传承中文` deck + 3 subdecks.
- [ ] Import `foundation_radicals.tsv` (you start radicals on Day 5).
- [ ] Apply deck options (§5) and enable FSRS @ 0.90 (§6).
- [ ] Day 1: begin the loop. Import L01 files when the plan reaches Day 8.

That's it. The plan tells you *what* each day; this loop is *how*. Be honest with your ratings, review
daily, and the book will be in long-term memory by the capstone week.

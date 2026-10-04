# Sunday School Exam Portal

A static, browser-only exam portal for Sunday School classes V–XII (Kottayam Diocese). Students pick their class, enter their details and school code, and take a timed, bilingual (English / മലയാളം) multiple-choice exam. No server or build step is needed.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Landing page — choose a class |
| `class5.html` … `class12.html` | Exam page for each class (question bank, timer, scoring, results review) |
| `admin.html` | Admin portal — attempt logs, marksheet, cloud endpoint setting |
| `support.html` | Help / support page |

Files such as `class6_1.html`, `class6_2.html`, `class7_1.html`, `class7_2.html`, `exam-app.html`, `index_1.html` and `index (1).html` are older or alternate versions and are not linked from `index.html`.

The folders `class 5`, `class 8`, … `class 12`, `class6 q`, `class7 q` hold the source question papers (PDFs) the question banks were built from.

## How an exam works

1. The student enters name, phone, roll number, **diocese** and **school code**. The code must belong to the selected diocese, as set in `DIOCESE_CODES` inside each class page:
   - **Kottayam Diocese** — `VALID_CODES` (38 codes)
   - **Thrissur Diocese** — `THRISSUR_CODES` (`260310`, `123456`)
2. A random set of questions is drawn from the class's question bank and the timer starts (e.g. 25 minutes for Class V, 30 minutes for Class X).
3. Each question can be switched between English and Malayalam with the translate button.
4. At the end, the score and a review of all answers are shown.

## Data and storage

Everything is stored in the browser's `localStorage`:

- `ss_exam_attempts` — attempt log read by `admin.html`
- `ss_lang`, `ss_theme` — language and light/dark preference
- `ss_cloud_endpoint` — per-browser fallback for the cloud URL (set in `admin.html`)
- `ss_deleted_ids` — attempts the admin deleted, so they are not re-imported from the Sheet

### Cloud sync (Google Sheet)

To see results from every student's device in `admin.html`:

1. Set up the Google Apps Script shown in **admin.html → Cloud Sync → How to set up** (Deploy as Web App, Execute as *Me*, access *Anyone*).
2. Paste the Web App URL (ending in `/exec`) into [`sync-config.js`](sync-config.js) and publish the site.
3. Each class page then sends every attempt to the Sheet (one row per attempt, updated as it progresses). The admin portal reads the Sheet on login, on **Refresh**, when the tab regains focus, and every minute.

Without a URL in `sync-config.js`, the admin portal only shows attempts taken in its own browser.

### Feedback

The **Give Feedback** button on the home page sends a message (optional name, class and 1–5 star rating) to the same Apps Script, which stores it in a **Feedback** tab of the Sheet. The admin portal lists it under **Student Feedback** (with delete and CSV export). Feedback is also kept in the sender's browser as `ss_feedback`.

## Question banks

Each class page has its question bank embedded as a JavaScript array. Each entry looks like:

```js
{unit: 1, ch: 10, q: {en: "...", ml: "..."}, o: {en: [...], ml: [...]}, a: 0}
```

- `q` — question text, `o` — four options, `a` — index of the correct option (options are shuffled at runtime).
- `unit` / `ch` / `topic` fields are still in the data but are **no longer shown** to students. The unit/chapter references were found to be wrong, so they were removed from the question screen and the results review. Do not rely on them.

## Common edits

- **Add or remove school codes:** update `VALID_CODES` (Kottayam) or `THRISSUR_CODES` (Thrissur) in every `classN.html`.
- **Allow another diocese:** add a code list and an entry for it in `DIOCESE_CODES` in every `classN.html`. The key must match the diocese's `<option value>` exactly.
- **Change exam duration:** edit `TOTAL_TIME_SECONDS` in the class page.
- **Add questions:** append entries to the class's question array, keeping both `en` and `ml` text.

## Running locally

Open `index.html` in a browser, or serve the folder with any static server, for example:

```sh
npx serve .
```

## Credits

Developed by [bubinkm](https://portfolio-pi-roan-40.vercel.app/).

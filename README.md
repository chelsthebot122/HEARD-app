# HEARD (prototype v0.1)

A web app that helps someone put a hard thing into words, see that others have been through something similar, and work out **who to tell**. It is a bridge to people, not a replacement for them.

> **Status:** prototype for testing. HEARD is **not** a crisis service, therapy, or medical advice. If you or someone near you is in danger, call or text **988** (US) or call 911.

**How it works, honestly:** the topic detection, privacy masking and crisis check are fixed, hand-written rules that run in your browser. There is **no language model** in this version, and nothing you write leaves your device. Everything is stored in your browser (encrypted if you make a device account).

**Who it's for:** ages 13 and up. People pick an age group at the start; 13 to 17 gets extra protections (no open notes from strangers, trusted adults suggested first, adult-only sources hidden). Only the age group is stored, never a birthday.

**Built with:** TypeScript, React 18, CSS and Vite. Runs in any modern browser on desktop and phones. No server.

**How it was made:** designed and directed by the author, with an AI assistant (Claude, by Anthropic) helping write and test code. The author chose the concept, the safety approach, the content sources and the design. *(Edit this paragraph so it says exactly what you did.)*


## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + one self-contained dist/index.html
npm test           # safety, engine, moderation, links, contact, age checks
```

Deploy: push to GitHub, import the repo in Vercel (framework: Vite, output folder `dist`). It's fully static, so there are no keys or servers to set up.

## What's real in this version

Everything is real, local logic. Nothing is sent anywhere, and state is kept in `localStorage`.

| Piece | Where | Notes |
|---|---|---|
| Crisis detection | `src/engine/safety.ts` | Fixed rules, runs first on the raw text, never calls a model. Emergency = fixed hand-off sheet and no analysis. Support = banner, conversation continues. |
| Safety test set | `src/data/safetyCases.ts` | 37 cases, also runnable in the app under Privacy > Safety lab. Add a case whenever something is missed. |
| PII masking | `src/engine/redact.ts` | Rule-based first pass. Production: Microsoft Presidio server-side. |
| Topic reading | `src/engine/topics.ts` | Transparent keyword rules; every topic shows the words that caused it, and the person can remove or add topics. |
| Retrieval + labels | `src/engine/compose.ts`, `src/data/library.ts` | Each source is labelled personal experience / general info / professional guidance. |
| Message drafts | `src/engine/compose.ts` | Editable. HEARD never sends anything. |
| Library | `src/data/library.ts` | Sixteen real sources (NIMH, CDC, HHS Surgeon General, MedlinePlus, StopBullying.gov, Mayo Clinic, Active Minds, Childline, Loughborough, Jed Foundation and others) covering stress, loneliness (including feeling lonely around people), friendship, breakups, healthy new relationships, grief and bullying. Each links to the original with HEARD's own summary and the publisher's reuse terms. Checked 2026-10-11, so re-check links before launch. Family and self-doubt have no vetted entry yet, on purpose. |
| 13 to 17 mode | `src/age.ts`, `src/store.logic.ts`, `src/screens/TeenNotes.tsx` | HEARD is 13+. People pick an age group at the start (guest) or at sign-up; only the group is saved, never a birthdate. Under 13 gets a kind message and 988, no account. In 13 to 17 mode: open Notes (strangers) is replaced by private notes, adult-tagged sources and services are hidden, Teen Line is added to Help and the crisis sheet, trusted adults are suggested first, and examples and starters are written for school life. Older saved profiles count as 18+. `npm run test:age`. Needs a counselor review and parent or school sign-off before teens outside your own testing use it. |
| Phone layout | `src/components/Sheet.tsx` | At 900px wide and under, details, message drafts, source summaries, filters and "add more" open as full-screen pages with an X (and Escape), the message action stays at the bottom edge, and a round arrow returns to the top. Desktop is untouched: the wrapper is `display: contents` and the phone-only controls are hidden. |
| Fonts | `src/main.tsx` | Merriweather and Nunito are bundled with `@fontsource` (Latin only), so the page makes no request to Google. After `npm install`, open the browser's network tab and confirm nothing leaves your own host. |
| Accessibility audit | `scripts/a11y-audit.cjs` | `npm run dev` in one terminal, `npm run audit:a11y` in another. Checks names, labels, contrast, ids, headings, landmarks, tap size and hidden-but-focusable controls across every tab in light, dark, desktop and phone widths. It is a home-made check, not axe-core, so also run the axe DevTools extension and Lighthouse before launch. |
| Contacts | `src/contact.ts`, `src/screens/People.tsx`, `src/components/Draft.tsx` | Each person can have an email, phone and other contact detail (validated, stored on the device only). In a draft, "Email", "Text" and "Call" buttons hand the message to your own app and you press send. HEARD never sends anything itself. `npm run test:contact`. |
| Save a link | `src/links.ts`, `src/components/AddLink.tsx` | People save a link plus a note in their own words. Only the link and the note are stored (note PII-masked, tracking params stripped). Social links get a warning. Saved links appear in Library and in Talk matches, labelled "Saved by you". `npm run test:links`. |
| Landing page | `src/screens/Landing.tsx` | Animated intro, synopsis, live masking demo, "Take me to HEARD". The logo returns to it; a link like `/#plan` skips it. |
| Privacy layer seam | `src/engine/redact.ts` (`privacyLayer`) | The app only calls this object. Swap in a local Presidio/spaCy service here; if it throws, nothing is analysed. |
| Accounts | `src/auth.ts`, `src/components/Auth.tsx` | Device-local: name + passphrase, data encrypted in the browser (PBKDF2 → AES-GCM). No server, no recovery if the passphrase is lost. Real accounts need a backend. |
| Milo moods per tab | `src/Milo.tsx`, `moodFor` in `src/ui.tsx` | Reading, mail, wave, clipboard, guard, lock, cheer. Late at night he sleeps (except in Help). |
| "How did it go?" | `src/components/CheckIn.tsx` | Asked 20 minutes after you log a conversation. Outcomes feed the Plan log. Sample rows are never asked about. |
| Help (resource finder) | `src/data/resources.ts`, `src/screens/Help.tsx` | National US services checked against their own sites (988, SAMHSA, VCL, 211, FindTreatment.gov and others). Re-verify before launch. No local directory: it points to 211 and FindTreatment.gov. |
| Notes | `src/screens/Notes.tsx`, `src/engine/moderation.ts`, `src/data/notes.ts` | Write anonymously, read and reply, inbox. Prototype only: nothing leaves the device, feed notes are team-written examples (labelled), "demo replies" are labelled. Moderation rules are tested (`npm run test:moderation`). |
| Success metric | Plan screen | "Real conversations this month", not time spent. |

## Before real people use it

1. Have a licensed counselor or psychology advisor review `src/engine/safety.ts` (wording and test cases) and the "professional guidance" summaries in `src/data/library.ts`. The safety check is rule-based and will miss things.
2. Re-check every link in the library and every number in `src/data/resources.ts` (last checked Oct 11, 2026).
3. Keep testing with adults (18+) first. Testers under 18 need a parent's or school's okay, and the 13 to 17 version needs counselor review. Under 13 is not supported.
4. Run `npm run audit:a11y`, then the axe DevTools extension and Lighthouse.
5. Optional later: a small server route that receives only the **masked** text and writes a reply grounded in retrieved sources. The rule layer in `safety.ts` stays in front and always wins.

## Known limits

- Crisis and topic detection are keyword rules, not understanding. Slang, sarcasm and indirect wording can be missed.
- Accounts live on one device. A forgotten passphrase can't be recovered, and nothing syncs between devices.
- Notes are a front end only. The notes you read are team-written examples, and nobody receives what you write.
- Tested in Chrome-based browsers (desktop and simulated phone). Test Safari on a real iPhone.

## License

MIT, see `LICENSE`. Library entries are short summaries with links to their publishers; each publisher's own terms apply to the originals.

# HEARD-app

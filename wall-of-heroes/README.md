# 🏁 Wall of Heroes

A racing-themed recognition wall for remote contact center teams. Leaders post positive
verbatims from customers, peers and leadership; agents ("drivers") find their call-outs, cheer each other on, and
see who's on pole position.

## Features

- **The Wall**: shout-out cards with each agent's initials and livery colours, the quote and who it's from,
  an optional pit wall note, and team/channel tags. Loading, empty and error states included.
- **My call-outs**: pick your name (it's remembered in your browser) to open your "garage" with
  your call-outs, cheers, and all-time position. Click any name on a card to jump to that driver.
- **Filters**: team, channel (Phone, Chat, Email, Social, SMS, Video), and free-text search.
- **Cheers**: Flag / On fire / Trophy reactions anyone can toggle. Counts are shared; each browser remembers its own toggles.
- **Pole Position**: podium plus driver and team standings for the last 7 days, last 30 days, or all time.
- **Pit Lane**: leaders unlock with a shared passcode to post shout-outs and to edit or delete posted ones (from **Manage shout-outs** or the buttons on each card). Edits keep the original post date and cheers, and the card shows "edited".
- Auto-refreshes every 60 seconds, so it can run on a team monitor.

Design handoff brief: [`docs/design-brief.md`](docs/design-brief.md).

## Design

Styled with the **JLR Design System** (from the Design team's handoff): JLR Emeric fonts, the
JLR Green colour story, sharp corners and hairline rules. Files in `public/`:

- `jlr/colors_and_type.css`: design system tokens and `@font-face` rules (unmodified from the handoff)
- `jlr/fonts/`: JLR Emeric ExtraLight, Regular and SemiBold
- `assets/`: JLR monogram and the hero wheel photo

To switch colour story, change the `palette-green-*` classes in `index.html`
(`<body>` uses `-dark`, the header and intro use `-light`) to `palette-blue-*` or `palette-orange-*`.

**Brand assets:** the fonts, logo and photo are JLR brand assets. This repository and the
Netlify site are public, so anyone can download them. Confirm that's acceptable with JLR Brand.

## Stack

- Static site in `public/` (plain HTML/CSS/JS, no build step).
- Netlify Functions in `netlify/functions/` (`/api/shoutouts`, `/api/react`, `/api/verify`).
- Netlify Blobs store `wall-of-heroes`,
  one JSON entry per shout-out. No external database.

## Deploy to Netlify

1. Push this folder to a GitHub repo.
2. In Netlify: **Add new project → Import an existing project**, then pick the repo.
   - If the app lives in a subfolder (e.g. `wall-of-heroes/`), set **Base directory** to that folder.
   - Build command: leave empty. Publish directory and functions are read from `netlify.toml`.
3. In the project's environment variable settings, add `LEADER_PASSCODE` with a value
   of your choice, scoped to Functions.
4. Deploy. Netlify Blobs needs no extra setup on Netlify-hosted functions.

Change `LEADER_PASSCODE` whenever leaders change, then redeploy so the functions pick up the new value.

## Local development

```bash
npm install
npm install -g netlify-cli
LEADER_PASSCODE=letmein netlify dev
```

`netlify dev` serves the site and functions at http://localhost:8888, with a local Blobs sandbox.

## API

| Method | Path | Auth | Body / params |
|---|---|---|---|
| GET | `/api/shoutouts` | none | returns `{ shoutouts: [...] }`, newest first |
| POST | `/api/shoutouts` | `x-leader-passcode` | `{ agent, team?, channel?, verbatim, customer?, leader, note? }` |
| PUT | `/api/shoutouts?id=…` | `x-leader-passcode` | same fields as POST; replaces text fields only, keeps `id`, `createdAt`, `reactions`, adds `updatedAt` |
| DELETE | `/api/shoutouts?id=…` | `x-leader-passcode` | |
| POST | `/api/react` | none | `{ id, reaction: "flag" \| "fire" \| "trophy", delta?: 1 \| -1 }` |
| POST | `/api/verify` | `x-leader-passcode` | checks the passcode |

## Things to know

- **The wall is public to anyone with the URL.** Don't post customer names, phone numbers, account
  numbers, or other personal data. If the whole site needs to be private, check which
  site-protection options your Netlify plan includes.
- The leader passcode is shared, not per person. "Flagged by" is whatever the leader types.
- After unlocking, the passcode stays in the browser's `sessionStorage` until the tab closes or
  "Lock pit lane" is clicked.
- Cheers aren't tied to identity. A determined person could inflate counts, which is fine for a
  morale board but don't use them for anything that matters.

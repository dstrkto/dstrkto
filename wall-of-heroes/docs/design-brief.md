# Wall of Heroes: Design Brief & Build Prompt

**Live site (current version):** https://adorable-malasada-7958a9.netlify.app
**Ask:** A Figma redesign of the Wall of Heroes, built with **our design system**, that engineering can implement directly.

This brief lists **what the site does**: screens, components, states, data limits and interactions.
**How it looks** is up to Design and the design system. The racing/automotive theme should stay, expressed
through the design system instead of on top of it.

---

## 1. Build prompt (copy/paste)

> Design a responsive web app called **Wall of Heroes** for our remote contact center. Leaders post
> positive customer verbatims about individual agents; agents visit to see their own call-outs, cheer for
> teammates, and check a leaderboard. The theme is **racing / motorsport** (agents are "drivers," the
> leaderboard is "Pole Position," the leader area is "Pit Lane"). It should feel celebratory, energetic and
> colorful, and stay easy to read.
>
> **Apply our design system** for color, type, spacing, radius, elevation, iconography and components. Use
> design-system components wherever one exists, and add new components only where nothing fits (for
> example the podium and the shout-out card). Express the racing theme with motifs such as checkered
> patterns, number plates, livery stripes, start lights and podium steps, built from design-system tokens.
>
> Deliver frames for **Desktop (1440)** and **Mobile (390)** for every screen and state in Sections 3–5.
> Build components with variants and auto layout, and bind every color, type style and spacing value
> to design-system variables (Section 7).
>
> Don't add or remove functionality. If you have feature ideas, put them on a separate "Proposals" page.

---

## 2. Audience & context

| | |
|---|---|
| **Agents** | Remote, mostly on work desktops between contacts; some on phones. They come to see *their* shout-outs and cheer for others. |
| **Leaders** | Supervisors and managers who post verbatims, usually from a desktop. They post several at once and sometimes need to delete one. |
| **Team displays** | The wall can run on a shared monitor or screen share. It auto-refreshes every 60 seconds, so cards should read well from a distance. |
| **Tone** | Recognition and pride. Fun, not childish. Customer words are the hero of each card. |
| **Access** | Anyone with the link can view. Only leaders with the shared passcode can post or delete. No individual logins. |

---

## 3. Global elements (all screens)

### 3.1 Header
- Eyebrow label: "Contact Center Grand Prix"
- Title: "Wall of Heroes"
- Tagline: "Real words from real customers about the drivers who make it happen."
- **Stats row (4 tiles):** Shout-outs (total) · Drivers on the board (unique agents) · Last 7 days · Cheers (total reactions). Values are integers from 0 up to the thousands.

### 3.2 Navigation (sticky at top on scroll)
Three tabs: **The Wall** (default) · **Pole Position** · **Pit Lane** (labelled for leaders).
States: default, hover, active/selected, keyboard focus.

### 3.3 Footer
A short sign-off line ("Keep it green. Keep it fast. Keep it kind.") with a decorative racing motif.

### 3.4 Motion moments (please specify style and timing)
- **Start lights intro:** on the first visit per browser tab, five lights come on one by one, then go out and reveal the page (~2 seconds, tap to skip). Not shown when the user has reduced motion enabled.
- **Celebration burst:** a short confetti/flag burst when someone cheers a card and a bigger one when a leader posts.
- **Card entrance:** cards animate in on load.
- All motion must have a reduced-motion fallback (none or a simple fade).

---

## 4. Screen: The Wall

### 4.1 Filter bar
| Control | Type | Notes |
|---|---|---|
| Driver | Select | "All drivers" + every agent name A–Z. The choice is remembered in the browser ("My call-outs"). |
| Team | Select | "All teams" + team names A–Z |
| Channel | Select | All channels · Phone · Chat · Email · Social · SMS · Video |
| Search | Text input | Searches agent, team, verbatim, customer, leader and note text |

Mobile: controls stack vertically. Consider a collapsible "Filters" control.

### 4.2 Driver "Garage" banner (shown only when a Driver is selected)
- Agent's number plate + "{Name}'s Garage"
- "{n} call-outs · {n} cheers"
- Badges: all-time position ("P3 all-time") if ranked; "🔥 {n} this week" if any
- "Show everyone" button (clears the driver filter)
- **Variant: no shout-outs yet:** "Welcome to the grid, {Name}!" / "No call-outs yet. Your first checkered flag is coming."

### 4.3 Shout-out card (key component, please design with care)
| Element | Content | Limits |
|---|---|---|
| Number plate | Car number 2–99, generated from the agent's name | always 1–2 digits |
| Livery | A color pair generated from the agent's name (side stripe, plate ring, quote mark) | **Please define 8 livery color pairs from the design system** |
| Agent name | Clickable: filters the wall to that agent | up to 60 chars |
| Team tag | Optional | up to 40 chars |
| Channel tag | Phone / Chat / Email / Social / SMS / Video | (consider an icon per channel) |
| Verbatim | The customer quote, the most prominent element | 1–1,000 chars |
| Customer attribution | Optional, e.g. "Customer in Ohio" | up to 60 chars |
| Leader note | Optional, e.g. "Textbook ownership!" | up to 280 chars |
| Footer | "Flagged by {Leader} · {time ago}" | leader name up to 60 chars |
| Reactions | 🏁 Checkered flag · 🔥 On fire · 🏆 Trophy, each with a count | toggle on/off per viewer |
| Delete | **Only when Pit Lane is unlocked** | |

**Card variants to show:** short quote (~40 chars) · long quote (~1,000 chars) · with and without team, customer and note · long agent name · delete visible (leader mode).
**Reaction button states:** default · hover · pressed · selected ("mine") · disabled while saving.

Layout: a masonry/column grid today (3 columns desktop, 1 mobile). Design may change this.

### 4.4 Wall states
- **Loading** (none today; please design one, e.g. skeleton cards)
- **Empty:** "No shout-outs on this stretch of track yet." (also shown when filters match nothing)
- **Error:** "Couldn't reach the pit wall: {message}"

---

## 5. Screens: Pole Position & Pit Lane

### 5.1 Pole Position (leaderboard)
- **Period toggle:** Last 7 days (default) · Last 30 days · All time
- **Podium:** top 3 drivers. Each shows number plate, name, "{n} call-outs · {n} cheers" and position 1/2/3. Arranged 2 – 1 – 3 with 1st tallest.
  - Show the states with **0, 1, 2 and 3** drivers in the period.
- **Driver standings:** ranked list (top 15) with position, name, relative bar and count.
- **Team constructors:** the same list grouped by team.
- Ranking: most call-outs, ties broken by cheers, then alphabetically.
- Empty: "No laps recorded in this period."

### 5.2 Pit Lane, locked
- Title "Pit Lane access", helper text, passcode input (masked), "Enter pit lane" button
- Error state: "Wrong passcode."

### 5.3 Pit Lane, unlocked (three areas)
**a) Header:** "Post a shout-out" + **Lock pit lane** button.

**b) Post form**
| Field | Type | Required | Limit / notes |
|---|---|---|---|
| Agent name | Text with autocomplete from existing agents | ✅ | 60 |
| Team | Text with autocomplete from existing teams | | 40 |
| Channel | Select (6 options) | | defaults to Phone |
| Your name (leader) | Text, remembered in the browser | ✅ | 60 |
| Customer verbatim | Multi-line text | ✅ | 1,000; consider a character counter |
| Customer attribution | Text, with a "no personal info" hint | | 60 |
| Leader note | Text | | 280 |

Submit button "Wave the flag". States: default, submitting/disabled, **success** ("🏁 Posted! {Agent} is on the wall." + celebration), **error** (inline message), field validation errors.

**c) Manage shout-outs**
- Search ("Agent, team, leader, or words from the verbatim") + count ("6 of 12 posts")
- Scrollable list, newest first. Each row: agent · team · channel / verbatim (cut at 140 chars) / "Posted by {Leader} · {date time}" / **Delete** button
- Delete flow: confirmation ("Delete this shout-out for {Agent}? This can't be undone.") → row removed. **Please design a confirmation modal** to replace the browser's default dialog.
- States: empty / no matches ("No posts match."), deleting (button disabled), error.

---

## 6. Accessibility requirements
- WCAG 2.1 AA contrast for all text, including text on livery colors and on the podium.
- Visible keyboard focus on every interactive element.
- Touch targets at least 44×44 px on mobile.
- Don't rely on color alone. Selected reactions and active tabs need a non-color cue too.
- Reduced-motion variants for all motion (Section 3.4).
- Emoji are decorative. Every icon-only control needs a text label for screen readers (e.g. "On fire: 3").

---

## 7. Handoff checklist (what engineering needs from Figma)

The site is plain HTML/CSS, and the design will be implemented as **CSS custom properties**.

1. **Pages in the Figma file:** `Cover` · `Desktop 1440` · `Mobile 390` · `Components` · `Motion notes` · `Proposals` (optional)
2. **Variables, not hard-coded values:** every color, type style, spacing, radius and shadow bound to design-system variables.
3. **A token table** (in Figma or a separate sheet) mapping each token *used* to its value, e.g. `color/surface/raised → #1C1E29`. Engineering needs actual values, not only token names.
4. **Livery palette:** the 8 color pairs from Section 4.3, each pair checked for contrast.
5. **Fonts:** family names and weights, and confirmation they are **licensed for web use**. Either Google Fonts or provided font files (WOFF2) we can self-host.
6. **Assets as SVG:** logo, any channel icons, decorative motifs (checker pattern, stripes, podium details).
7. **Components named with variants**, e.g. `Card / Shoutout` with properties `length=short|long`, `note=true|false`, `leaderMode=true|false`.
8. **Export PNGs of every frame** (1×) in addition to the Figma link. Engineering may not be able to open Figma directly, so PNGs plus the token table are the minimum handoff.
9. **Motion specs:** duration, easing and sequence for each item in Section 3.4.

---

## 8. Out of scope
- New features, data fields or flows (put ideas on the Proposals page).
- Logins/SSO, notifications and integrations.
- Copy is editable. Suggest better wording, but keep the meaning of messages and labels.

# Ballerz visual redesign — FotMob-style

**Date:** 2026-10-13
**Status:** Approved in conversation; awaiting spec review
**Branch:** `sdk-57-upgrade`

## Goal

Make Ballerz look clean and intentional instead of AI-generated, using FotMob's
dark UI as the reference. Success: a user scanning any screen sees one clear
primary element, dense readable data, and no decorative filler — and the app
reads as a football app, not a template.

## What we are fixing

Observed on the web build with seeded data (Home, Games, Game detail, Players):

1. Every block is the same bordered navy card — no hierarchy.
2. Watermark footballs/trophies in card corners.
3. Letter-spaced uppercase eyebrow over every title.
4. Weight 900 on nearly all text.
5. No accent colour; `#4A5C6A` muted text is barely legible.
6. Players all render as identical league-coloured initials circles.
7. Repetition: league · location on every game card; date and location shown
   three times on game detail.
8. Home: greeting header, a 180px six-card date strip, gradient glow, a
   `TEMP` dev reset button.
9. Inconsistent headers (Players left/large, Games centred/small); "UpComing".

Also a logic bug found in passing: Home's featured "last game" is the
latest-dated game of **any** status, so an upcoming fixture appears as the last
result (`app/(tabs)/index.tsx`, `lastGame`).

## Reference: FotMob patterns adopted

Pure black page; borderless neutral-grey cards; moderate weights; plain section
titles; one green accent used sparingly; dense rows with right-aligned tabular
numbers; underline tabs; match header without a card; colour-banded rating
badges; head-to-head as left value · label · right value with the winner
highlighted.

Not adopted: match stats and events timeline — the `Game` model has no
per-minute events or match stats, so these would render empty.

## 1. Tokens and type

All in `constants/theme.ts`. `T` keeps its name so untouched screens keep
compiling during the migration; old keys are removed only once no screen uses
them.

| Token | Value | Use |
|---|---|---|
| `bg` | `#000000` | Page |
| `surface` | `#1A1A1A` | Cards — no border |
| `surfaceAlt` | `#262626` | Pressed rows, nested chips, badge backgrounds |
| `divider` | `#2B2B2B` | Hairlines between rows inside a card only |
| `text` | `#F2F2F2` | Primary |
| `textDim` | `#A3A3A3` | Secondary (6.9:1 on surface) |
| `textFaint` | `#8A8A8A` | Column headers, timestamps (5.1:1 on surface) |
| `accent` | `#2FD47A` | Active tab, live, new goal digit, primary action |
| `red` | `#F04438` | Delete, red card |
| `yellow` | `#F5C518` | MVP, yellow card |

The league colour appears on crests only.

**Type:** system font; weights 400/500/600/700 only.

| Role | Size / weight |
|---|---|
| Screen title | 24 / 700 |
| Section title | 17 / 600 |
| Row primary | 15 / 600 |
| Row secondary | 13 / 400, `textDim` |
| Caption / column header | 12 / 500, `textFaint` |
| Score | 40 / 700 |

All numbers use `fontVariant: ['tabular-nums']`.

**Shape and space:** card radius 16, padding 16; badge radius 8; spacing on a
4-pt scale (4, 8, 12, 16, 20, 24, 32); rows 56–64 tall with inset dividers.

## 2. Shared components — `components/ui/`

| Component | Responsibility |
|---|---|
| `ScreenHeader` | Left-aligned title (+ optional subtitle), optional single icon action, solid `bg`, safe-area aware |
| `Section` | Borderless `surface` card; optional plain title; optional footer action ("All") |
| `ListRow` | Leading (crest/avatar), primary + secondary text, trailing slot (value, badge, chevron); inset divider; `Pressable` |
| `Tabs` | Underline tabs with an `accent` indicator; controlled (`value`, `onChange`) |
| `RatingBadge` | Number in a radius-8 box coloured by band: ≥80 `accent` `#2FD47A`, ≥70 lime `#A3E635`, ≥60 `yellow` `#F5C518`, else orange `#F97316`; black text |
| `StatCompare` | Left value · centred label · right value; winning side in a team-coloured pill |
| `Button` | `primary` (accent fill, black text), `secondary` (`surfaceAlt`), `destructive` (red text) |

`components/Crest.tsx` keeps its API. Teams keep team colour; a new
`variant="avatar"` renders players on neutral `surfaceAlt` with initials.

## 3. Match components

- **`GameScoreboard` → match header, no card.** Crest + name per side, score
  40/700 tabular, status line under it ("Full time" / "Sat 18 Oct" / "Live"
  in `accent` — no minute, the model has no clock), MVP beneath. Drops the league · location line.
- **`GameCard` → compact match row.** Home name, crest, score (FT/Live) or
  short date (Pending — the model stores a date, not a kickoff time), crest,
  away name, small status at left.

## 4. Screens, in build order

Each step is one commit, verified with lint, `tsc`, a Metro bundle, and
before/after screenshots from the web build.

1. **Games** — `ScreenHeader` + add; `Tabs` All / Results / Upcoming / Live;
   match rows; swipe-to-delete kept.
2. **Game detail** — match header; two-column **Lineups** section; **Details**
   section with date and location shown once.
3. **Home** — league crest + name as the title (no greeting, no dev reset — it
   lives in League → Danger Zone); compact one-row day strip with a dot on
   match days; **Next match** (soonest Pending/Live) and **Last result**
   (latest FT, via `useLastGame`) replacing the mixed slot; leaderboard as
   `Tabs` + `ListRow` + `RatingBadge`; head-to-head via `StatCompare` using
   `useRivalry`; no watermarks or gradients.
4. **Players + player detail** — `Tabs`, neutral avatars, `RatingBadge` for
   OVR; attribute bars kept on the new palette.
5. **League, forms, onboarding, record-result** — token + `Button` swap,
   grouped settings rows. Lightest touch.

## Constraints

- No new runtime dependencies (system font; no FlashList/LegendList).
- React Compiler rules hold: no ref reads/writes during render.
- New code uses `Pressable`; existing `TouchableOpacity` is replaced only in
  files this work touches.
- Store, selectors, routes and data model are unchanged except the Home
  featured-game fix.

## Out of scope

Match stats, events timeline, real crest/photo uploads beyond what exists,
light mode, a custom display font, animation changes beyond restyling the
existing tab pill.

## Verification

Per screen: `npm run lint` 0 problems, `npx tsc --noEmit` clean, Metro bundle
200, before/after web screenshots. Device checks (gestures, the tab pill,
haptics) remain manual.

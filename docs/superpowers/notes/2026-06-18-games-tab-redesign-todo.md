# Games tab redesign — TODO (deferred, to do at home)

Target from a design screenshot (2026-06-18). The Games **list** screen should be reworked to match:

## Filter pills (new)
Replace the current LIVE / UPCOMING / RESULTS section headers with a row of segmented **filter pills** near the top, under the "Games" title:

`All · FT · Live · UpComing`

- Pill style: rounded, dark surface; the active pill filled lighter/white with dark text (like the leaderboard mode chips on the home screen).
- Selecting a pill filters the single list to that status (`All` = everything). Default `All`.
- This replaces the multi-section layout — one flat list, filtered by the selected pill.

## Card design (per list item)
Each list item uses the **full** card layout (not the compact row) — i.e. the same `GameScoreboard size="full"` look already built for the home `LastGameCard`:
- Header: 📍 `{league} - {location}` left, 🗓 `{date}` right.
- Crests (image or colored-initials fallback) + big score `4 : 2` + status pill (FT/LIVE/SOON).
- Team names under the crests.
- ⭐ MVP row at the bottom when set.
- Card chrome: rounded container, subtle border, faint football watermark (like home card).

## Implementation pointers
- `app/(tabs)/games.tsx`: swap the three `<Section>`s for one filtered list; add the pill row state (`"all" | "FT" | "Live" | "Pending"`); render each game in a full card.
- The full card can reuse `components/GameScoreboard` with `size="full"` inside a bordered card container (add the watermark like `LastGameCard`). Consider extracting the card container (watermark + border + GameScoreboard) into a small shared `GameCard` so home + games list share it.
- `useGamesByStatus` already returns `{ live, upcoming, results }`; for "All" just use the raw sorted games (or add an `all` to the selector). Keep the stable-slice + `useMemo` pattern (do NOT reintroduce `useShallow` over freshly-built arrays — that caused the infinite-render crash; see store/selectors.ts).

## Status
Branch `games-tab` has the working Games feature (list w/ sections, create/edit/log-result, detail, record-result, redesigned card) + the two infinite-loop fixes. This redesign sits on top of that.

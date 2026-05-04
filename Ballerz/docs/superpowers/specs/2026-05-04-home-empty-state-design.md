# Home Screen Empty State — Two Action Cards

## Summary

Replace the single "No games yet" empty card on the home screen with two side-by-side action cards that give new users a clear starting path: add players or create a game.

## Trigger Condition

Shown when `gamesCount === 0 && players.length === 0` — same condition as the existing `emptyCard` block in `app/(tabs)/index.tsx`.

## Layout

```
[ GET STARTED eyebrow label ]

[ Add Players card ]  [ Create Game card ]
```

Two equal-width `TouchableOpacity` cards in a `flexDirection: "row"` container with `gap: 10`.

## Card Specs

### Add Players (left)
- **Icon wrap:** `people` Ionicons icon, blue-tinted background (`rgba(96,165,250,0.12)`)
- **Title:** "Add Players" — white, `fontSize: 13`, `fontWeight: "800"`
- **Description:** "Build your squad first" — `T.textMuted`, `fontSize: 11`
- **CTA button:** amber pill "Add Players" — `backgroundColor: T.accent`, black text
- **Navigation:** whole card + button → `router.push("/(tabs)/players")`

### Create Game (right)
- **Icon wrap:** `football` Ionicons icon, amber-tinted background (`rgba(245,158,11,0.12)`)
- **Title:** "Create Game" — white, `fontSize: 13`, `fontWeight: "800"`
- **Description:** "Jump straight in" — `T.textMuted`, `fontSize: 11`
- **CTA button:** amber pill "Create Game" — `backgroundColor: T.accent`, black text
- **Navigation:** whole card + button → `router.push("/create-game")`

## Styles

Both cards use:
- `backgroundColor: T.surface`
- `borderWidth: 1`, `borderColor: T.border`
- `borderRadius: T.radius.card` (22)
- `padding: 16`
- `flex: 1`

Eyebrow label reuses the existing `sectionTitle` style (`fontSize: 9`, `fontWeight: "800"`, `letterSpacing: 2`, `color: T.textMuted`).

CTA buttons inside cards: `borderRadius: T.radius.pill`, `backgroundColor: T.accent`, `paddingVertical: 9`, `alignSelf: "stretch"`, text `color: "#000"`, `fontSize: 11`, `fontWeight: "800"`.

## Out of Scope

- The existing `emptyCard` / `emptyCtaWrap` / `emptyCta` / `emptyCtaTxt` styles are removed (no longer used)
- No changes to the non-empty state (when players or games exist)

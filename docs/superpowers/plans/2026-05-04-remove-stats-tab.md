# Remove Stats Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Delete the Stats tab screen and remove it from the tab bar, leaving the four remaining tabs intact.

**Architecture:** Two surgical changes — delete the screen file and remove its registration from the tab layout. No other files touched.

**Tech Stack:** React Native, Expo Router (file-based routing), TypeScript

---

### Task 1: Remove Stats screen and tab entry

**Files:**
- Delete: `app/(tabs)/stats.tsx`
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Delete the stats screen file**

Delete `app/(tabs)/stats.tsx` entirely.

- [ ] **Step 2: Remove the Stats tab entry from the layout**

In `app/(tabs)/_layout.tsx`, remove lines 35–41:

```tsx
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
        }}
      />
```

The file should now declare only four `<Tabs.Screen>` entries: `index`, `games`, `players`, `league`.

- [ ] **Step 3: Verify no lint errors**

Run: `npm run lint`
Expected: no errors or warnings related to stats.

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/_layout.tsx
git rm app/(tabs)/stats.tsx
git commit -m "feat: remove stats tab"
```

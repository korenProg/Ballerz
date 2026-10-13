---
name: running-ballerz
description: Use when starting the Ballerz dev server, verifying a change actually works, or hitting Metro errors on Windows — EBUSY cache write errors, "Port 8081 is being used by another process", stale Metro processes, or a failing `npx expo login`.
---

# Running Ballerz

Expo SDK 57 / RN 0.86 app, developed on Windows. The React Compiler is on, so a
change can pass typecheck and still fail to compile — always bundle before
claiming a change works.

## Commands

| Command | Use |
|---|---|
| `npm start` | Expo dev server (QR for Expo Go) |
| `npm run android` / `ios` / `web` | Start with a platform attached |
| `npm run lint` | ESLint via `expo lint` |
| `npx tsc --noEmit` | Typecheck — not wired into an npm script |

There is no test suite. Lint + typecheck + a successful bundle is the whole
automated safety net.

## Verifying a change

Run all three. The first two miss compile errors the React Compiler only raises
at bundle time:

```bash
npm run lint          # expect "0 problems"
npx tsc --noEmit      # expect no output
```

Then force a real bundle against a running dev server:

```bash
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" \
  "http://localhost:8081/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false"
```

Expect `200` and ~9–10 MB. **`/index.bundle` 404s** — `main` is
`expo-router/entry`, so the entry is `.expo/.virtual-metro-entry`.

To confirm Metro recompiled rather than serving cache, save the body and grep
for code you just added (and for the code you just deleted — it should be gone).

**None of this covers runtime behavior.** Gestures, animations and navigation
need a real device. Say so instead of implying a green bundle means it works.

## Windows traps

**`EBUSY: resource busy or locked` on `metro-file-map`** — two Metro servers are
running. The cache filename hashes the project path, so both target the same
temp file and the second one's write fails. Harmless (a failed cache *write*
just means a slower next cold start) but it recurs until the extra server dies.

```powershell
netstat -ano | findstr "LISTENING" | findstr ":808"   # find the PIDs
Stop-Process -Id <pid>
```

The "Port 8081 is being used" prompt is the same root cause. Accepting 8082
leaves both alive — kill the stale one instead.

**`npx expo login -b` crashes** with `cmd.exe ... exited with non-zero code: 1`.
Upstream bug, present through at least @expo/cli 57.0.29: the login URL is
passed to `cmd.exe` unquoted and its `&` characters are parsed as command
separators. Don't debug it. Use `EXPO_TOKEN` from
expo.dev/settings/access-tokens, which the CLI accepts as credentials. Plain
`npx expo login` (no `-b`) works only for password accounts.

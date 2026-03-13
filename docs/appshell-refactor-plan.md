<!-- --- CODEX CHANGE START --- -->
# AppShell Minimal Refactor Plan

Goal: split `src/pages/AppShell.jsx` into smaller units without changing current behavior.

## Phase 1

- Extract `useNoemaApi`
  - Owns `callAPI`
  - Owns Anthropic error normalization
- Extract `useNoemaRateLimit`
  - Owns local minute window
  - Owns Supabase daily counter check

## Phase 2

- Extract `useNoemaSession`
  - Owns `openingMessage`
  - Owns `saveSession`
  - Owns memory/session hydration from Supabase
- Extract `useNoemaUIState`
  - Owns `applyUI`
  - Owns `insights`, `ikigai`, `step`, `mode`, `mstate`

## Phase 3

- Split presentational UI:
  - `ChatPane`
  - `Composer`
  - `MobilePanelModal`
  - `TopBar`
- Keep `AppShell` as orchestration only

## Safety rules

- Move logic one slice at a time
- Keep current prop names and Supabase queries unchanged initially
- Add tests around each extracted hook before touching behavior
<!-- --- CODEX CHANGE END --- -->

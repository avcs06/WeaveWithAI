# 52 · FL7 Capability modes: build, simulate, skip

Phase 2 · 60 min · Depends: FL3 · Decisions: D2.5 C · Spec: OPTIONS.md D2.5

## Goal

No whitelist. The app builds whatever the idea needs; the capability list
only names the exceptions. A simulated capability gets its full UI with a
placeholder effect written in the list itself; a skipped capability stays out
of scope with a placeholder in the scope.

## What this step does

1. **The list carries a mode and the placeholder text.** `build` for the
   ordinary capabilities, `simulate` for payments, fileUploads and
   emailSending with one sentence each saying what the app does instead of
   the real effect, `skip` for realtime, maps, externalIntegrations,
   multiTenant and i18n. The ids stay the scope schema's enum.
2. **The prompts say build, simulated and skipped.** The scope prompt lists
   all three and tells the model to mark a simulated capability needed when
   the idea needs it; the flows prompt says simulated steps end in the
   placeholder behaviour, never the real effect, and skipped capabilities
   appear in no step.
3. **Two rules change.** SCOPE-004 requires an out-of-scope entry only for a
   needed skipped capability. FLOW-022 allows a step to mention a simulated
   capability once the scope marks it needed, and flags skipped mentions
   unless the scope explains what the app does instead.

## Implementation details

- `src/agents/01flows/config/capabilities.ts`: `CapabilityMode`, `placeholder?`,
  `capability(id)`, `buildList()`, `simulatedList()`, `skippedList()`.
- `prompt-scope.md` and `prompt-flows.md`: placeholders `capabilitiesBuild`,
  `capabilitiesSimulated`, `capabilitiesSkipped`; `prompt.ts` fills them.
- `rules/scope-004-unsupported-capabilities.ts`, `rules/flow-022-unsupported-mentions.ts`
  (`CAPABILITY_MENTIONS` maps each prose pattern to its capability id);
  mutations updated (SCOPE-004 uses `maps`); a validator test shows a
  simulated mention passing once the scope needs the capability.

## Done when

```sh
pnpm test
pnpm typecheck
```

## Watch out

- The placeholder sentences are read by every later stage (design, mock
  API, frontend); change them in the list, nowhere else.
- `docs/specs/flows.md` keeps its original table: specs are single use.

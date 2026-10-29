# 47 · FE7 Golden freelancer workspace end to end

Phase 7 · 60 min · Depends: FE4, FE5 · Gate G6

## Goal

The freelancer workspace generated from idea to working frontend on the mock
API, walked by hand, with the model sessions' cost recorded.

## What this step does

1. **Generate the freelancer workspace's frontend end to end** from a clean app
   folder.
2. **Walk every flow by hand** in the browser, including the alternatives.
3. **Fix what breaks at the source**: session prompts, shell codegen or
   entity codegen; never the checks.
4. **Record per screen**: turns, writes, tokens, cost.

After this step gate G6 is met.

## Implementation details

1. `rm -rf runs/<id>/app`; `pnpm weave run fixtures/ideas/freelancer-workspace.md
   --run <id> --to frontend`.
2. Walk every flow in the browser (`pnpm dev` in the app): sign up, sign in,
   create, list, filter, search, mark done, overdue styling, edit, delete
   with confirm, sign out, and the alternatives (invalid, failure with the
   `x-mock-fail` header through the browser devtools, empty as the other user).
3. What breaks goes back to prompts (`prompt-session.md`, the page task
   text), the shell codegen or the entity codegen; never to the checks.
4. Record per screen: turns, writes, tokens, cost (from `session:end`
   events) in `fixtures/golden/README.md`.

## Done when

Gate **G6**: every route passes validate, typecheck, lint, verify and the
mandatory rendered checks; the core loop works by hand; the numbers are
recorded.

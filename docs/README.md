# Docs

Read in this order when you start a session:

1. [PLAN.md](PLAN.md): the task list. Take the first unticked task whose
   dependencies are done, finish it, tick it.
2. [ARCHITECTURE.md](ARCHITECTURE.md): how the generator is put together:
   stages, artifacts, IDs, the stage runner, the model layer.
3. The spec for the stage you're working on:
   - [specs/flows.md](specs/flows.md): scope and user flows
   - [specs/design.md](specs/design.md): design brief, theme, screens, new components
   - [specs/contracts.md](specs/contracts.md): domain model and operations
   - [specs/reconciliation.md](specs/reconciliation.md): coverage matrix, routing, freeze
4. [OPTIONS.md](OPTIONS.md): every implementation choice, with the one in use.
   The user ticks; you read. Unticked means the **(default)** applies.

[MIGRATION.md](MIGRATION.md) records how the repository was restructured into
`template/`, `mcps/design-system/` and the root agent. It runs once.

## Sources

The plan merges three proposals and the user's original spec. OPTIONS.md tags
each option with where it came from:

| Tag    | Source                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------- |
| **Y**  | The user's original pipeline spec                                                               |
| **P**  | The earlier plan doc, "Website Generator Agent: 7-Day MVP Plan" (Meta tooling, contract DSL, coverage matrix) |
| **R2** | The second response (63-hour schedule, TypeBox, Better Auth, ownership rules, acceptance tests) |
| **R3** | The third response (Vercel AI SDK, SQLite, single code differ, cut-down schedule)               |

## Facts the plan relies on

Checked on 2026-10-27 and 2026-10-28. Re-check anything that decides a design.

- Hackathon: Oct 26 to Nov 4; submissions due Nov 4, 9:00 PM ET, which is
  Nov 5, 7:30 AM IST. Projects must build on Meta Model API, Muse Code or Meta
  open-weight models. Judging: Impact 30%, Use of Meta AI tooling 25%, Demo 25%,
  Technical depth 20%. $150 of Model API credits per participant.
  ([AImagazine summary of the official page and waiver](https://aimagazine.blog/meta-opens-its-1m-global-ai-developer-hackathon-20000-seats-150-api-credits-each-and-applications-close-october-25/))
- Meta Model API is OpenAI-compatible at `https://api.meta.ai/v1`. Structured
  output uses `response_format: { type: "json_schema" }` with constrained
  decoding. Recursive schemas are rejected; nesting depth at most 10.
  ([structured output](https://dev.meta.ai/docs/structured-output))
- `muse-spark-1.3`: $1.25 input, $4.25 output per 1M tokens, $0.15 cached
  input. `muse-wonder-1.0`: $4 and $20. `-contributor` Spark variants cost far
  less but Meta may train on what you send.
  ([pricing](https://dev.meta.ai/docs/pricing-rate-limits))
- Muse Code runs headless with `muse exec --json --prompt-file`, loads project
  skills from `.agents/skills/`, hooks from `.muse/hooks.json` and MCP servers
  from settings. Muse Code workflows are rollout-gated and missing from the
  Apple silicon build. ([extending](https://dev.meta.ai/docs/muse-code/extending),
  [workflows](https://dev.meta.ai/docs/muse-code/workflows))
- Meta's cookbook runs OpenCode against the Meta Model API with an
  `@ai-sdk/openai-compatible` provider config.
  ([GitHub agent cookbook](https://dev.meta.ai/docs/cookbook/github-agent))

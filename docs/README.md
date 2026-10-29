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
5. [steps/README.md](steps/README.md): one step file per task, in execution
   order, with the full implementation brief. The user reads the next step,
   adjusts it and says go; the agent builds exactly that.

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

The hackathon facts below were confirmed on 2026-10-28 against the official
Participant Guide (the Event Details tab of the
[Cerebral Valley event page](https://cerebralvalley.ai/e/meta-ai-developer-hackathon),
login required) and the submission form on the same platform.

- Dates: building period Oct 27 to Nov 4. Submissions are due Wed Nov 4,
  9:00 PM ET, which is Thu Nov 5, 7:30 AM IST; late entries are not considered.
  Nov 3 is the last day for submission questions. Judging runs Nov 5 to 8; the
  top 5 per track are announced Nov 9 and judged live from their videos.
- Problem statement (form, required): "Build for Your World" (bring Meta's
  models into a domain you know, free up time) or "Push the Frontier"
  (software, robotics, science, physical systems). Weave fits Build for Your
  World. Track (form, required): Indie Developer or Startups; a solo entry goes
  to Indie Developer.
- New work only: the demo may show only what was built during the hackathon,
  and judges must be able to tell it apart from earlier work, or the entry is
  disqualified. Building on an existing codebase is allowed when the new part
  is clearly identified. For Weave: the generator (`src/`) and whatever changed
  in `template/` and `mcps/` since Oct 27 are hackathon work; the rest of the
  design system predates it. The README and the video must say this.
- Repository: must be public on GitHub; the form takes its URL.
- Video: 3 minutes, a YouTube link. It is a primary judging artifact, with
  the code and the live product.
- Written answers on the form, all required: project description and the
  problem it solves; "Describe your use of Meta products to build the
  submitted project"; "Why are Meta's models important to your solution?".
  Optional: feedback on Meta products, feedback on partner technologies
  (Fireworks, Modal, Baseten), an X post link for the Most Viral prize. A
  consent box lets Meta and Cerebral Valley publish the materials.
- Models that count: Muse Spark series, Muse Wonder, Muse Image, Muse Voice
  Transcribe and SAM 3.1 through the Meta Model API; open weights Muse Glimmer
  and Muse Spark Open; the Muse Code agent.
- Judging: stage 1 is pass or fail (fits a problem statement, reasonably used
  the Model API or open-weight models during the event). Stage 2 scores 0 to
  10 on Impact 30%, Use of Meta AI tooling 25%, Demo 25%, Technical depth and
  execution 20%. Stage 3 is the top 5 per track.
- Bonus prizes that Weave can aim at: Best Agentic Use-Case ($5k: autonomy,
  effectiveness, usefulness). Best Build on Meta Open Weight Models ($10k)
  needs Muse Glimmer or Muse Spark Open on own hardware or partner inference;
  the plan runs the pipeline on Muse Glimmer through a Modal endpoint and
  on Muse Spark Open through Baseten (D1.11), and the infrastructure partner
  verifies the run. Most Viral
  needs an X post; Community Vote is the public gallery.
- Anti-projects (disqualified or discouraged): medical advice, basic RAG,
  simple image analyzers, education chatbots, job screeners, nutrition
  coaches, personality or sports analyzers, anything political. Weave is not
  on the list.
- Credits: $150 of Model API credits per participant, claimed individually
  through Meta's form by Nov 4, 9:00 PM ET; a credit card must be on the
  account and a spend limit can be set on the Billing page. Partner credits
  are optional: Baseten $100 (use `meta-models/muse-spark-open-1026`), Modal
  $100, Fireworks per selected team. Status 2026-10-28: the $150 Meta credits
  and the $100 Modal credits are granted.
- Support: Meta office hours in Discord, weekdays 10 to 11 AM ET, text only.
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

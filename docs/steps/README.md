# Steps

One file per task in [PLAN.md](../PLAN.md), numbered in execution order. A step
file is the full brief for one task: what exists before it, the files to write
with their shapes, the libraries and commands to use, the tests, and the checks
that prove it is done.

**The loop.** You read the next step, change what you want, and say go. The
agent implements exactly what the file says at that moment, runs its **Done
when**, ticks the task in PLAN.md and leaves every change unstaged for you to
review, stage and commit. Anything the agent discovers on the way becomes a new
task in PLAN.md, not extra work in the step.

**How a step file reads.** Goal, then "What this step does": the flow in
plain English, numbered, saying what gets added and what it does, enough to
decide without reading code. Then "Before you start" (what exists),
"Implementation details" (files, signatures, libraries, commands), the
tests, "Done when" (the commands that prove it) and "Watch out".

**Conventions in every step.** Paths are relative to the repository root
unless they start with `app/`, which means the generated app
(`runs/<runId>/app/`). "The spec" is the stage's file in `docs/specs/`.
Library versions are the current releases on 2026-10-28; `pnpm add` without a
version picks them. Every rule id (`FLOW-011`, `DESIGN-R-003`) refers to the
spec's table.

| #   | Task | Title                                           | Phase | Est.    | File                                         |
| --- | ---- | ----------------------------------------------- | ----- | ------- | -------------------------------------------- |
| 01  | F1   | Root package and tooling                        | 1     | 20 min  | [01-F1-root-package.md](01-F1-root-package.md) |
| 02  | F2   | Schema bridge                                   | 1     | 30 min  | [02-F2-schema-bridge.md](02-F2-schema-bridge.md) |
| 03  | F3   | Model client                                    | 1     | 60 min  | [03-F3-model-client.md](03-F3-model-client.md) |
| 04  | F4   | Smoke test                                      | 1     | 15 min  | [04-F4-smoke-test.md](04-F4-smoke-test.md) |
| 05  | F5   | Runs, artifacts, events, issues                 | 1     | 40 min  | [05-F5-runs-artifacts.md](05-F5-runs-artifacts.md) |
| 06  | F6   | Stage runner and prompt loader                  | 1     | 30 min  | [06-F6-stage-runner.md](06-F6-stage-runner.md) |
| 07  | F7   | CLI                                             | 1     | 30 min  | [07-F7-cli.md](07-F7-cli.md) |
| 08  | F8   | Open-weight model backends                      | 1     | 2 h     | [08-F8-backends.md](08-F8-backends.md) |
| 09  | FL1  | Capabilities and schemas                        | 2     | 40 min  | [09-FL1-capabilities-schemas.md](09-FL1-capabilities-schemas.md) |
| 10  | FL2  | Flow validators with tests                      | 2     | 90 min  | [10-FL2-flow-validators.md](10-FL2-flow-validators.md) |
| 11  | FL3  | Flow prompts                                    | 2     | 30 min  | [11-FL3-flow-prompts.md](11-FL3-flow-prompts.md) |
| 12  | FL4  | Flow renderer                                   | 2     | 30 min  | [12-FL4-flow-renderer.md](12-FL4-flow-renderer.md) |
| 13  | FL5  | Wire the flows stage                            | 2     | 30 min  | [13-FL5-flows-stage.md](13-FL5-flows-stage.md) |
| 14  | FL6  | Reference ideas                                 | 2     | 60 min  | [14-FL6-reference-ideas.md](14-FL6-reference-ideas.md) |
| 15  | DS1  | Design-system inventory                         | 3     | 45 min  | [15-DS1-inventory.md](15-DS1-inventory.md) |
| 16  | DS2  | Design config                                   | 3     | 20 min  | [16-DS2-design-config.md](16-DS2-design-config.md) |
| 17  | DS3  | Brief                                           | 3     | 60 min  | [17-DS3-brief.md](17-DS3-brief.md) |
| 18  | DS4  | Theme generator                                 | 3     | 90 min  | [18-DS4-theme.md](18-DS4-theme.md) |
| 19  | DS5  | Screens schemas                                 | 3     | 45 min  | [19-DS5-screens-schemas.md](19-DS5-screens-schemas.md) |
| 20  | DS6  | Design validators                               | 3     | 2.5 h   | [20-DS6-design-validators.md](20-DS6-design-validators.md) |
| 21  | DS7  | IA and nodes stage                              | 3     | 90 min  | [21-DS7-ia-nodes-stage.md](21-DS7-ia-nodes-stage.md) |
| 22  | DS8  | Design renderers                                | 3     | 45 min  | [22-DS8-design-renderers.md](22-DS8-design-renderers.md) |
| 23  | DS9  | Design for every golden idea                    | 3     | 60 min  | [23-DS9-golden-design.md](23-DS9-golden-design.md) |
| 24  | C1   | Contract conventions and schema                 | 4     | 40 min  | [24-C1-conventions-schema.md](24-C1-conventions-schema.md) |
| 25  | C2   | Contract compile                                | 4     | 60 min  | [25-C2-compile.md](25-C2-compile.md) |
| 26  | C3   | Contract validators                             | 4     | 90 min  | [26-C3-contract-validators.md](26-C3-contract-validators.md) |
| 27  | C4   | Contract prompt and stage                       | 4     | 40 min  | [27-C4-contract-stage.md](27-C4-contract-stage.md) |
| 28  | C5   | Contract renderer                               | 4     | 30 min  | [28-C5-contract-renderer.md](28-C5-contract-renderer.md) |
| 29  | C6   | Contracts for every golden idea                 | 4     | 40 min  | [29-C6-golden-contracts.md](29-C6-golden-contracts.md) |
| 30  | R1   | Coverage matrix                                 | 5     | 60 min  | [30-R1-matrix.md](30-R1-matrix.md) |
| 31  | R2   | Mismatch rules                                  | 5     | 60 min  | [31-R2-mismatch-rules.md](31-R2-mismatch-rules.md) |
| 32  | R3   | Patches                                         | 5     | 60 min  | [32-R3-patches.md](32-R3-patches.md) |
| 33  | R4   | Patch prompts                                   | 5     | 40 min  | [33-R4-patch-prompts.md](33-R4-patch-prompts.md) |
| 34  | R5   | Procedure, freeze, report                       | 5     | 60 min  | [34-R5-procedure-freeze.md](34-R5-procedure-freeze.md) |
| 35  | R6   | Seeded defects and every golden idea            | 5     | 60 min  | [35-R6-seeded-defects.md](35-R6-seeded-defects.md) |
| 36  | S1   | Scaffold and theme apply                        | 6     | 90 min  | [36-S1-scaffold-theme.md](36-S1-scaffold-theme.md) |
| 37  | S2   | Contract codegen: types, client, hooks          | 6     | 90 min  | [37-S2-entities-codegen.md](37-S2-entities-codegen.md) |
| 38  | S3   | Mock API: route handlers and JSON store         | 6     | 2.5 h   | [38-S3-mock-api.md](38-S3-mock-api.md) |
| 39  | S4   | Contract tests against the mock                 | 6     | 60 min  | [39-S4-api-tests.md](39-S4-api-tests.md) |
| 40  | S5   | Golden project tracker to app                   | 6     | 45 min  | [40-S5-golden-app.md](40-S5-golden-app.md) |
| 41  | FE1  | Coding engine: action loop                      | 7     | 2 h     | [41-FE1-action-loop.md](41-FE1-action-loop.md) |
| 42  | FE2  | Routes, navigation and page shells              | 7     | 90 min  | [42-FE2-page-shells.md](42-FE2-page-shells.md) |
| 43  | FE3  | New components                                  | 7     | 60 min  | [43-FE3-new-components.md](43-FE3-new-components.md) |
| 44  | FE4  | Pages: sections wired to hooks                  | 7     | 2.5 h   | [44-FE4-pages.md](44-FE4-pages.md) |
| 45  | FE5  | Rendered checks                                 | 7     | 90 min  | [45-FE5-rendered-checks.md](45-FE5-rendered-checks.md) |
| 46  | FE6  | Visual rubric (optional)                        | 7     | 45 min  | [46-FE6-visual-rubric.md](46-FE6-visual-rubric.md) |
| 47  | FE7  | Golden project tracker end to end               | 7     | 60 min  | [47-FE7-golden-frontend.md](47-FE7-golden-frontend.md) |
| 48  | B1   | Production build and server                     | 8     | 45 min  | [48-B1-bench-server.md](48-B1-bench-server.md) |
| 49  | B2   | Lighthouse                                      | 8     | 60 min  | [49-B2-lighthouse.md](49-B2-lighthouse.md) |
| 50  | B3   | Accessibility: axe, contrast, targets           | 8     | 45 min  | [50-B3-accessibility.md](50-B3-accessibility.md) |
| 51  | B4   | Screen reader                                   | 8     | 60 min  | [51-B4-screen-reader.md](51-B4-screen-reader.md) |
| 52  | B5   | Keyboard navigation                             | 8     | 60 min  | [52-B5-keyboard.md](52-B5-keyboard.md) |
| 53  | B6   | Code quality and duplicates                     | 8     | 90 min  | [53-B6-code-quality.md](53-B6-code-quality.md) |
| 54  | B7   | Benchmark table and CLI                         | 8     | 60 min  | [54-B7-benchmark-report.md](54-B7-benchmark-report.md) |
| 55  | T1   | Playwright tests from the frozen flows          | 9     | 2 h     | [55-T1-e2e-generation.md](55-T1-e2e-generation.md) |
| 56  | T2   | Run, evidence, repair requests                  | 9     | 60 min  | [56-T2-evidence-repair-requests.md](56-T2-evidence-repair-requests.md) |
| 57  | T3   | Bounded repair                                  | 9     | 90 min  | [57-T3-bounded-repair.md](57-T3-bounded-repair.md) |
| 58  | T4   | Golden project tracker e2e green                | 9     | 45 min  | [58-T4-golden-e2e.md](58-T4-golden-e2e.md) |
| 59  | P1   | Run dashboard                                   | 10    | 90 min  | [59-P1-dashboard.md](59-P1-dashboard.md) |
| 60  | P2   | Two full runs, a Modal run, benchmarks          | 10    | 3 h     | [60-P2-full-runs.md](60-P2-full-runs.md) |
| 61  | P3   | README and submission answers                   | 10    | 90 min  | [61-P3-readme-submission.md](61-P3-readme-submission.md) |
| 62  | P4   | Demo video and submit                           | 10    | 2 h     | [62-P4-demo-submit.md](62-P4-demo-submit.md) |

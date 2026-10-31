# Golden artifacts

Accepted outputs per reference idea, saved by tasks FL6, DS9, C6 and R6, so later
stages can be developed and tested without calling the model again.

```text
golden/<idea>/
  01-scope.json  01-flows-catalog.json  01-flows.json  (and their .md renderings)
  02-brief.json  02-theme.json  02-screens.json
  03-contract.json
  spec.lock.json
```

Record per idea and stage: rounds used, tokens in and out, cost.

| Idea | Stage | Rounds | Tokens in | Tokens out | Cost (USD) | Notes |
| ---- | ----- | ------ | --------- | ---------- | ---------- | ----- |
| freelancer-workspace | scope | 2 | 12784 | 16494 | 0.09 | 0 known issues |
| freelancer-workspace | flows-catalog | 2 | 35036 | 20251 | 0.13 | 0 known issues |
| freelancer-workspace | flows-expand | 7 | 234453 | 67385 | 0.74 | 0 known issues, 3 batches, 1 blocker fixed on the strong model |
| freelancer-workspace | flows | 1 | 0 | 0 | 0.00 | 0 known issues |
| dashboard-editor | scope | 2 | 9666 | 9657 | 0.05 | 0 known issues |
| dashboard-editor | flows-catalog | 2 | 27006 | 16856 | 0.11 | 0 known issues |
| dashboard-editor | flows-expand | 7 | 162166 | 56134 | 0.57 | 0 known issues, 3 batches, 4 blockers fixed on the strong model |
| dashboard-editor | flows | 1 | 0 | 0 | 0.00 | 0 known issues |
| ecommerce-store | scope | 2 | 11280 | 14137 | 0.07 | 0 known issues |
| ecommerce-store | flows-catalog | 3 | 52681 | 32345 | 0.31 | 0 known issues, 2 blockers fixed on the strong model |
| ecommerce-store | flows-expand | 5 | 142143 | 48409 | 0.53 | 0 known issues, 2 batches, 1 blocker fixed on the strong model |
| ecommerce-store | flows | 1 | 0 | 0 | 0.00 | 0 known issues |

Saved 2026-10-30 from runs `20261030-1630-<idea>` (user): scope at high
reasoning with its first draft at 0.7, the peer and output reviewers at 0.2
(F12, F13). The ecommerce catalog's first attempt in that run was cut at
65,536 output tokens ($0.44, not in the table); the run was resumed from the
catalog with the same scope and passed. Against the 2026-10-29 set the specs
are more complete (explicit sign in for the dashboard, glaze and size as one
`Variant` with its own stock for the store) and the output reviewer caught 8
real defects, most of them missing cascade effects; all three cost $2.60
against $2.02.

The 2026-10-29 set came from runs `20261029-2105-<idea>`, after FL11 (word-matching
rules moved to the reviewers) and FL12 (choices whose options come from
records). Each idea ran once with these prompts.

The ecommerce store is the unseen idea. Its untuned run (`20261029-2026`, before
FL11 and FL12) had 0 mandatory issues and cost $0.80. The catalog took 4
rounds and kept 1 known issue: a fix the last round made but no reviewer saw.
The expand batches took 2 rounds each. The 7 warnings were all false word
matches ("checkout" and "UPI paid" read as payments, "3 left" as layout),
which led to FL11. In the next run, a glaze choice that must offer the
owner's glazes took the catalog to 4 rounds again, which led to FL12.

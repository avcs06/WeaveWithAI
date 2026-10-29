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
| freelancer-workspace | scope | 2 | 13548 | 21791 | 0.07 | 0 known issues |
| freelancer-workspace | flows-catalog | 3 | 62396 | 36051 | 0.34 | 0 known issues |
| freelancer-workspace | flows-expand | 6 | 193497 | 56880 | 0.47 | 0 known issues, 3 batches |
| freelancer-workspace | flows | 1 | 0 | 0 | 0.00 | 0 known issues |
| dashboard-editor | scope | 2 | 10574 | 12715 | 0.04 | 0 known issues |
| dashboard-editor | flows-catalog | 2 | 28272 | 22643 | 0.13 | 0 known issues |
| dashboard-editor | flows-expand | 6 | 118212 | 37013 | 0.30 | 0 known issues, 3 batches |
| dashboard-editor | flows | 1 | 0 | 0 | 0.00 | 0 known issues, 1 warning (FLOW-024: form FM02 unused) |
| ecommerce-store | scope | 2 | 12064 | 17833 | 0.06 | 0 known issues |
| ecommerce-store | flows-catalog | 2 | 33433 | 23001 | 0.14 | 0 known issues |
| ecommerce-store | flows-expand | 4 | 136825 | 49370 | 0.37 | 0 known issues, 2 batches |
| ecommerce-store | flows | 1 | 0 | 0 | 0.00 | 0 known issues |

Saved 2026-10-29 from runs `20261029-2105-<idea>`, after FL11 (word-matching
rules moved to the reviewers) and FL12 (choices whose options come from
records). Each idea ran once with these prompts.

The ecommerce store is the unseen idea. Its untuned run (`20261029-2026`, before
FL11 and FL12) had 0 mandatory issues and cost $0.80. The catalog took 4
rounds and kept 1 known issue: a fix the last round made but no reviewer saw.
The expand batches took 2 rounds each. The 7 warnings were all false word
matches ("checkout" and "UPI paid" read as payments, "3 left" as layout),
which led to FL11. In the next run, a glaze choice that must offer the
owner's glazes took the catalog to 4 rounds again, which led to FL12.

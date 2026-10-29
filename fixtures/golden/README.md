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
| freelancer-workspace | scope | 2 | 12749 | 22048 | 0.11 | 0 known issues |
| freelancer-workspace | flows-catalog | 3 | 60131 | 45663 | 0.33 | 0 known issues |
| freelancer-workspace | flows-expand | 6 | 207029 | 75691 | 0.57 | 0 known issues, 3 batches |
| freelancer-workspace | flows | 1 | 0 | 0 | 0.00 | 0 known issues |
| dashboard-editor | scope | 2 | 10281 | 13143 | 0.07 | 0 known issues |
| dashboard-editor | flows-catalog | 3 | 41235 | 33971 | 0.28 | 0 known issues |
| dashboard-editor | flows-expand | 5 | 116105 | 56420 | 0.48 | 0 known issues, 2 batches |
| dashboard-editor | flows | 1 | 0 | 0 | 0.00 | 0 known issues |

Saved 2026-10-29 from the tuned prompts (FL6). Figures are the last run of each
stage; the freelancer scope ran once, its flows stages three times while tuning.
The ecommerce store (unseen idea) is not run yet.

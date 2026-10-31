# Golden artifacts

Accepted outputs per reference idea, saved with `weave golden`, so later stages
can be developed and tested without calling the model again.

```text
golden/<idea>/
  01-flows/01-scope.json  01-flows/02-catalog.json  01-flows/04-reconcile.json  (and their .md renderings)
  02-design/01-theme.json  02-design/02-architect.json  02-design/03-catalog.json  02-design/04-screen.json
  02-design/05-invent.json  02-design/06-draw.json  02-design/07-frame.json  02-design/08-assemble.json (and .md)
  03-contract.json
```

Record per idea and stage: rounds used, tokens in and out, cost. Screen,
invent, draw and frame run side by side, so their calls are summed from the
run's events; assemble makes no calls of its own, its fixes go through draw
and frame.

| Idea | Stage | Rounds | Calls | Tokens in | Tokens out | Cost (USD) | Notes |
| ---- | ----- | ------ | ----- | --------- | ---------- | ---------- | ----- |
| freelancer-workspace | flows-scope | 3 | 5 | 27983 | 29220 | 0.13 | 0 known issues |
| freelancer-workspace | flows-catalog | 4 | 7 | 111916 | 55690 | 0.37 | 0 known issues |
| freelancer-workspace | flows-expand | 11 | 17 | 363080 | 87961 | 0.77 | 0 known issues, 4 batches |
| freelancer-workspace | flows-reconcile | 1 | 0 | 0 | 0 | 0.00 | 0 known issues |
| freelancer-workspace | design-theme | 2 | 4 | 95805 | 20479 | 0.42 | 0 known issues |
| freelancer-workspace | design-architect | 2 | 4 | 133770 | 30294 | 0.30 | 0 known issues |
| freelancer-workspace | design-catalog | 5 | 8 | 330311 | 55483 | 0.55 | 0 known issues |
| freelancer-workspace | design-screen | 24 | 24 | 61291 | 35617 | 0.22 | 0 known issues |
| freelancer-workspace | design-invent | 5 | 9 | 94311 | 32989 | 0.25 | 0 known issues |
| freelancer-workspace | design-draw | 99 | 109 | 1415833 | 426304 | 3.48 | 0 known issues |
| freelancer-workspace | design-frame | 9 | 7 | 110633 | 31925 | 0.27 | 0 known issues |
| freelancer-workspace | design-assemble | 2 | 0 | 0 | 0 | 0.00 | 14 known issues |
| freelancer-workspace | contract | 1 | 1 | 25803 | 16046 | 0.10 | 0 known issues, from the C7 rerun |
| ecommerce-store | flows-scope | 2 | 4 | 20179 | 18502 | 0.22 | 0 known issues |
| ecommerce-store | flows-catalog | 2 | 3 | 39381 | 23824 | 0.15 | 0 known issues |
| ecommerce-store | flows-expand | 6 | 11 | 201497 | 46797 | 0.45 | 0 known issues, 3 batches |
| ecommerce-store | flows-reconcile | 1 | 0 | 0 | 0 | 0.00 | 0 known issues |
| ecommerce-store | design-theme | 2 | 3 | 59233 | 13899 | 0.29 | 0 known issues |
| ecommerce-store | design-architect | 2 | 4 | 115010 | 32941 | 0.28 | 0 known issues |
| ecommerce-store | design-catalog | 2 | 2 | 57534 | 28701 | 0.19 | 0 known issues |
| ecommerce-store | design-screen | 26 | 26 | 55776 | 30473 | 0.20 | 0 known issues |
| ecommerce-store | design-invent | 7 | 13 | 143303 | 38165 | 0.33 | 0 known issues |
| ecommerce-store | design-draw | 69 | 86 | 1135335 | 367760 | 2.92 | 0 known issues |
| ecommerce-store | design-frame | 9 | 9 | 139028 | 44757 | 0.36 | 0 known issues |
| ecommerce-store | design-assemble | 2 | 0 | 0 | 0 | 0.00 | 10 known issues |
| ecommerce-store | contract | 1 | 1 | 21077 | 14473 | 0.09 | 0 known issues, from the C7 rerun |
| dashboard-editor | flows-scope | 2 | 3 | 10741 | 11545 | 0.00 | 0 known issues, replayed from the cache |
| dashboard-editor | flows-catalog | 3 | 5 | 51214 | 31656 | 0.20 | 0 known issues |
| dashboard-editor | flows-expand | 5 | 8 | 118506 | 44741 | 0.33 | 0 known issues, 2 batches |
| dashboard-editor | flows-reconcile | 1 | 0 | 0 | 0 | 0.00 | 0 known issues |
| dashboard-editor | design-theme | 2 | 4 | 83113 | 18647 | 0.36 | 0 known issues |
| dashboard-editor | design-architect | 2 | 3 | 65616 | 18149 | 0.16 | 0 known issues |
| dashboard-editor | design-catalog | 2 | 2 | 41156 | 21395 | 0.14 | 0 known issues |
| dashboard-editor | design-screen | 10 | 11 | 29280 | 27324 | 0.15 | 0 known issues |
| dashboard-editor | design-invent | 4 | 8 | 83929 | 33860 | 0.25 | 0 known issues |
| dashboard-editor | design-draw | 45 | 52 | 634202 | 204309 | 1.64 | 0 known issues |
| dashboard-editor | design-frame | 9 | 7 | 89616 | 31764 | 0.25 | 0 known issues |
| dashboard-editor | design-assemble | 2 | 0 | 0 | 0 | 0.00 | 9 known issues |
| dashboard-editor | contract | 1 | 1 | 15761 | 11091 | 0.07 | 0 known issues, from the C7 rerun |

Saved 2026-11-01 from runs `20261101-0150-freelancer-workspace`,
`20261101-0150-ecommerce-store` and `20261101-0107-dashboard-editor` (user),
through assemble. The flows are these runs' own, so they replace the flows
saved 2026-10-30 from runs `20261030-1630-<idea>`; the design was made from
them. The rounds of screen, invent, draw and frame add up their calls' rounds.
The contracts came later the same night, from a rerun of the contract stage
on these runs after C7's add-form fix.

## Earlier sets

The 2026-10-30 set came from runs `20261030-1630-<idea>` (user): scope at high
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

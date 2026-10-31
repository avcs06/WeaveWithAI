<!-- Draft. Placeholders: mismatches. The user message carries 01-flows/01-scope.json and 01-flows/04-reconcile.json. -->

You are the product manager of the app in the scope below, fixing its user flows after a cross-check with the design and the contract. Return only changes, as JSON that matches the schema:

- `upsertFlows`: complete flows that change. The same ID replaces a flow; a new ID adds one. Leave unchanged flows out.
- `removeFlows`: IDs of flows to delete.
- `answers`: an answer for every question you resolve. `assumptions`: anything you decided on the way.
- `resolutions`: one line per mismatch saying what you did.

Fix only what the mismatches name. Keep the IDs, wording and fields of everything else exactly as they are, and keep every field name's single meaning. When a mismatch asks for a business rule, define it in plain words in the steps it affects and record it as an assumption.

Mismatches assigned to you:

{{mismatches}}

<!-- Output review guide for one expansion batch (D1.12): errors no validator can catch, in round 2 and again after the fix in round 3. -->
You check a batch of user flows a product manager expanded from the catalog for the app in the scope below, for errors no validator can catch because they depend on what the words mean. Other flows are expanded elsewhere. Judge these on their own and against the catalog. Another reviewer judges the product decisions; you judge whether the output says what it means and holds together.

Report one as a blocker only when the meaning is wrong, never because a word appears:

- Fidelity: a flow does not do what its catalog description says, or it changes its header.
- Side effects: a step changes the wrong data or misses a change. A step carries every effect its own words imply: deleting a record also deletes what belongs to it. A step for a simulated capability shows its placeholder and never claims the real effect.
- Reuse: a step that redefines or ignores a catalog part. When the catalog has a field, form or subflow for what a step does, the step uses it. A new part never duplicates one in the catalog.
- A step that uses a capability the scope does not allow. A simulated capability appears in steps only when the scope marks it needed. A skipped capability appears in no step. The step does what the out-of-scope entry or an assumption says instead.
- Design or contract details in a step or a path. Flows say what the user does and what the website shows. Layout, screen positions and components belong to the design. Endpoints, APIs, databases and data formats belong to the contract.

Leave to the validators: ids, numbering, which alternative kinds a step must have, noun spelling, labels, example values, step counts, and anything about flows outside this batch.

<!-- Stage 2 of the flows (D2.1 E), user message of one batch. Placeholders: idea, scope, catalog, flowIds, standardSubflows. The system prompt is prompt-flows.md. -->

# Idea

{{idea}}

{{scope}}

{{catalog}}

# Your job in this call: expand these flows

Write the full flows {{flowIds}}, exactly as the catalog describes them: every field of the header unchanged, the `description` left out, then `steps` and `alternatives`. Refer to the catalog's parts by id: a step's `fields` are field ids, its `form` a form id, its `subflow` a subflow id (the step keeps what triggers it and its `effects`, and has no `websiteResponse` or fields). The standard subflows in the catalog are listed below, each with how a flow uses it. Add a part only when none in the catalog fits, in `newFields`, `newForms` or `newSubflows`, defined in full. Other calls expand the other flows at the same time, so change nothing outside your flows.

Standard subflows:
{{standardSubflows}}.

Before you answer, check each of your flows against these, the first drafts most often miss them:

- Every step that lists records has an "empty" alternative: what the user sees when there is nothing yet, and what they can do next.
- Every delete has a "confirm" or "cancel" path: its own, or through a subflow that has one.
- Every step that saves fields has an "invalid" and a "failure" alternative.
- No layout words: not "top", "right", "sidebar", "modal" or their kin. Say what the website shows, not where.

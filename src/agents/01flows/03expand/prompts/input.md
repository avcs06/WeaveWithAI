<!-- Stage 2 of the flows, user message of one flow's call. Placeholders: idea, scope, catalog, flowIds. The system prompt is flows.md. -->

# Idea

{{idea}}

{{scope}}

{{catalog}}

# Your job in this call: expand this flow

Write the full flow {{flowIds}} as the catalog describes it. Keep its header fields as the catalog has them, and add `steps` and `alternatives` in place of the `description`. Refer to the catalog's parts by id: a step's `fields` are field ids and its `form` is a form id. Add a new field or form only when none in the catalog fits, defined in full in `newFields` or `newForms`. Other calls expand the other flows at the same time, so write only this flow.

Before you answer, check the flow against this list. First drafts miss these most often:

- Every step that lists records has an "empty" alternative: what the user sees when there is nothing yet, and what they can do next.
- Every delete has a "confirm" or "cancel" alternative.
- Every step that saves fields has an "invalid" and a "failure" alternative.
- No design details: no positions such as "top" or "right", and no components such as "sidebar" or "modal". Say what the website shows, not where.

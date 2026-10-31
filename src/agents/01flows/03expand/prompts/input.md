<!-- Stage 2 of the flows (D2.1 E), user message of one batch. Placeholders: idea, scope, catalog, flowIds, standardSubflows. The system prompt is prompt-flows.md. -->

# Idea

{{idea}}

{{scope}}

{{catalog}}

# Your job in this call: expand these flows

Write the full flows {{flowIds}} exactly as the catalog describes them. Keep every header field unchanged, leave out the `description`, and add `steps` and `alternatives`. Refer to the catalog's parts by id: a step's `fields` are field ids, its `form` is a form id and its `subflow` is a subflow id. A step that runs a subflow keeps its trigger and its `effects`, and has no `websiteResponse` and no fields. The standard subflows in the catalog are listed below, each with how a flow uses it. Add a new part only when none in the catalog fits, defined in full in `newFields`, `newForms` or `newSubflows`. Other calls expand the other flows at the same time, so change nothing outside your flows.

Standard subflows:
{{standardSubflows}}.

Before you answer, check each of your flows against this list. First drafts miss these most often:

- Every step that lists records has an "empty" alternative: what the user sees when there is nothing yet, and what they can do next.
- Every delete has a "confirm" or "cancel" path, its own or through a subflow that has one.
- Every step that saves fields has an "invalid" and a "failure" alternative.
- No design details: no positions such as "top" or "right", and no components such as "sidebar" or "modal". Say what the website shows, not where.

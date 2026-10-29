<!-- Stage 2 of the flows (D2.1 E), user message of one batch. Placeholders: idea, scope, catalog, flowIds. The system prompt is prompt-flows.md. -->
# Idea

{{idea}}

{{scope}}

{{catalog}}

# Your job in this call: expand these flows

Write the full flows {{flowIds}}, exactly as the catalog describes them: every field of the header unchanged, then `steps` and `alternatives`. Refer to the catalog's parts by id: a step's `fields` are field ids, its `form` a form id, its `subflow` a subflow id (then the step carries no text, fields or effects of its own). Add a part only when none in the catalog fits, in `newFields`, `newForms` or `newSubflows`, defined in full. Other calls expand the other flows at the same time, so change nothing outside your flows.

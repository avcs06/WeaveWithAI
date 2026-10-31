<!-- Stage 3 of the flows (D2.1 E), user message of a reconciliation fix. Placeholders: idea, scope, flows, issues, answers. The system prompt is prompt-flows.md. -->
# Idea

{{idea}}

{{scope}}

{{flows}}

# Your job in this call: patch the document

The flows above were written in parallel and then checked as one document. Return only what changes, as a patch:

- `upsertFlows`: complete flows that change. An existing id replaces that flow. A new id adds a flow.
- `upsertFields`, `upsertForms` and `upsertSubflows`: complete parts that change or are missing.
- `removeFlows`: the ids of flows to delete.
- `assumptions` and `questions`: new ones only, continuing the numbering.

Fix only what the problems below name. Keep every other id, field and wording exactly as it is.

Problems that must be fixed:
{{issues}}

Answers the user gave to your questions. Apply each answer everywhere it affects the output, and keep the question in the output:
{{answers}}

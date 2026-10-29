<!-- Stage 3 of the flows (D2.1 E), user message of a reconciliation fix. Placeholders: idea, scope, flows, issues, answers. The system prompt is prompt-flows.md. -->
# Idea

{{idea}}

{{scope}}

{{flows}}

# Your job in this call: patch the document

The flows above were written in parallel and then checked as one document. Return only what changes, as a patch: `upsertFlows` holds complete flows that change (the same id replaces, a new id adds), `upsertFields`, `upsertForms` and `upsertSubflows` hold complete parts that change or are missing, `removeFlows` lists flow ids to delete, and `assumptions` and `questions` hold new ones only, continuing the numbering. Fix only what the problems below name; keep every other id, field and wording exactly as it is.

Problems that must be fixed:
{{issues}}

Answers the user gave to your questions; apply each throughout and keep the question in the output:
{{answers}}

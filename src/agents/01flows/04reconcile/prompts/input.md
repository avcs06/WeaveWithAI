<!-- Stage 3 of the flows (D2.1 E), user message of a reconciliation fix. Placeholders: idea, scope, flows, patch (the runner's prompt-patch.md), issues, answers. The system prompt is prompts/flows.md. -->
# Idea

{{idea}}

{{scope}}

{{flows}}

# Your job in this call: patch the document

The flows above were written in parallel and then checked as one document. Return only what changes, as a patch. New assumptions and questions continue the numbering.

{{patch}}

Fix only what the problems below name. Keep every other id, field and wording exactly as it is.

Problems that must be fixed:
{{issues}}

Answers the user gave to your questions. Apply each answer everywhere it affects the output, and keep the question in the output:
{{answers}}

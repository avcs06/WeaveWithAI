<!-- Sent after a round that left mandatory issues or blockers, to a stage whose document has keyed lists: the architect and the contract. Placeholders: patch, how a patch is written (prompt-patch.md); issues, one "- RULE at ID: message" line each; answers, the user's answers since the last generation as one "- Q01 "question": answer" line each, or "None.". The runner merges the patch into the current document. -->
Fix each problem below and apply each answer below.

- Apply each answer everywhere it affects the document.
- Keep each answered question in the document.
- Keep everything else exactly as it was.
- Return a patch, not the complete document.

{{patch}}

Problems that must be fixed:
{{issues}}

Answers the user gave to your questions:
{{answers}}

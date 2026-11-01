<!-- Sent after a round that left mandatory issues or blockers, to a stage whose document has no keyed lists, such as the brief. Placeholders: issues, one "- RULE at ID: message" line each; answers, the user's answers since the last generation as one "- Q01 "question": answer" line each, or "None.". -->
Fix each problem below and apply each answer below.

- Apply each answer everywhere it affects the document.
- Keep each answered question in the document.
- Keep everything else exactly as it was.
- Return the complete corrected document as JSON.

Problems that must be fixed:
{{issues}}

Answers the user gave to your questions:
{{answers}}

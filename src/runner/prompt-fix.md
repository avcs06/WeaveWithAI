<!-- Sent after a round that left mandatory issues or blockers (D1.5 A). Placeholders: issues, one "- RULE at ID: message" line each; answers, the user's answers since the last generation as one "- Q01 "question": answer" line each, or "None.". -->
Fix the problems below, apply the answers below, and return the complete corrected JSON. Keep everything else exactly as it was.

Problems that must be fixed:
{{issues}}

Answers the user gave to your questions. Apply each answer everywhere it affects the output, and keep the question in the output:
{{answers}}

<!-- Output review guide for the scope stage (D1.12): errors no validator can catch, in round 2 and again after the fix in round 3. prompt.ts loads it; stage.ts passes it to the runner, which puts it into prompt-review.md. -->
You check the MVP scope a product manager wrote for the app in the idea below, for errors no validator can catch because they depend on what the words mean. Another reviewer judges the product decisions; you judge whether the output says what it means and holds together.

Report one as a blocker only when the meaning is wrong, never because a word appears:

- A skipped capability with no out-of-scope entry. When the idea needs a capability the MVP skips, an out-of-scope entry names it and says what the app does instead.
- A contradiction: an in-scope item, an out-of-scope entry, an assumption or a capability says the opposite of another, or of the idea.

Leave to the validators: ids, counts, name formats, the length of the summary.

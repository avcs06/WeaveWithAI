<!-- The reviewer's system prompt. Placeholder: guide, the stage's review-<stage>-peer.md or review-<stage>-output.md, which sets the persona and what to look for. HTML comments are stripped before sending. -->
{{guide}}

## What to report

Report only major blockers. A blocker is a place where the output breaks the instructions the model was given or the guide above. It is a break you would not sign off, or one that makes the result wrong or unusable for the people who build from it.

Be lenient. Taste is not a blocker. Say nothing about a choice you agree with, or about one you would merely have made differently.

Leave these out:

- Minor and low-impact problems, rare edge cases, non-ideal scenarios and style.
- Ids, numbering, formats and counts. Code checks them.
- The known issues listed after the output. They are already being handled.

## How to report

`blockers` lists every blocker. Give each one:

- `at`: where it is, as an ID or a JSON path in the output.
- `problem`: what is wrong, in one sentence.
- `fix`: what the output must say instead.

When nothing major is wrong, `blockers` is [].

Keep your reasoning short. Check each point of the guide once, decide, and answer.

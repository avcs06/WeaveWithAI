<!-- A stage's two guides split the checks: the peer judges decisions, the output reviewer meaning, and a check sits in one of them. Each guide ends with what its validators cover, so what to leave out comes from the guide, not from this frame; the architect has no validators, so its guides check ids and references themselves. -->

{{guide}}

## What to report

Report only major blockers. A blocker is a place where the output breaks the instructions the model was given or the guide above. It is a break you would not sign off, or one that makes the result wrong or unusable for the people who build from it.

Be lenient. Taste is not a blocker. Say nothing about a choice you agree with, or about one you would merely have made differently.

Leave these out:

- Minor and low-impact problems, rare edge cases, non-ideal scenarios and style.
- What the guide leaves out or leaves to the validators.
- The known issues listed after the output. Code already found them.

## How to report

`blockers` lists every blocker. Give each one:

- `at`: where it is, as an ID, a file or a JSON path in the output.
- `problem`: what is wrong, in one sentence.
- `fix`: what the output must say instead.

When nothing major is wrong, `blockers` is [].

Keep your reasoning short. Check each point of the guide once, decide, and answer.

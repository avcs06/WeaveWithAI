<!-- A stage's two guides split the checks: the peer judges decisions, the output reviewer meaning, and a check sits in one of them. Each guide ends with what its validators cover, so what to leave out comes from the guide, not from this frame; the architect has no validators, so its guides check ids and references themselves. Answering with blockers alone, a reviewer stopped at the first one it found; the walk makes it decide every point first. -->

{{guide}}

## What to report

Report every major blocker you find, not only the worst one. A blocker is a place where the output breaks the instructions the model was given or the guide above. It is a break you would not sign off, or one that makes the result wrong or unusable for the people who build from it.

Be lenient about taste only. Say nothing about a choice you agree with, or about one you would merely have made differently.

Leave these out:

- Minor and low-impact problems, rare edge cases, non-ideal scenarios and style.
- What the guide says to leave out or leaves to the validators.
- The known issues listed after the output. Code already found them.

## How to report

1. Walk the guide. Each point of the guide starts with its id, such as P01. Check the output against each point, one by one, in the guide's order, and decide whether it has the major problem the point describes. The points the guide leaves to the validators have no id: leave them out. `checked` lists the id of every point you checked.
2. Look past the guide. Its points are the problems seen most often, not every problem, and finding the others is part of your job. Read the output again against the instructions and the input the model was given, as the people who build from it would, and find every other major problem.
3. Write `blockers`: one for each point the output fails, and one for each problem step 2 found. Give each one:
   - `at`: where it is, as an ID, a file or a JSON path in the output.
   - `problem`: what is wrong, in one sentence.
   - `fix`: what the output must say instead.

When nothing major is wrong, `blockers` is [].

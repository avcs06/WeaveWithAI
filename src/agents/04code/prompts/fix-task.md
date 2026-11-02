<!-- The task of a fix session, sent into the Muse session that built the unit, so it still holds what it read and wrote. Placeholders: folders, issues (the checks' mandatory issues and the code reviewers' blockers, rule REVIEW: the runner's pending list, which AGENTS.md treats alike). -->
The checks after your work, and the two reviewers who read your change, found the issues below. Fix them in the code you wrote for this unit.

You built this unit earlier in this session, so you know what you changed: you need no git history. Your guidelines are in `.weave/01-scaffold/guidelines.md` and in these folders: {{folders}}. Read one again only when you need a detail you no longer have.

Every issue below is a blocker: a failed check, or a reviewer's finding with the fix it asks for. Fix each one, and keep everything else as it is. End with the summary the guidelines ask for.

## How the checks ran

- An issue that names a route, such as `/:`, comes from a browser check the runner ran on that route after you finished. `pnpm verify` does not run it, and you cannot run it yourself. Fix it from the code: start no dev server and write no browser scripts.
- Each of those issues names its element by a CSS path, such as `main > form > button:nth-of-type(2)`. Find that element in your code.
- When you finish, the runner runs every check again.

## The issues

{{issues}}

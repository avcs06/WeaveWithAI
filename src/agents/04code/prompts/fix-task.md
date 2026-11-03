The checks after your work, and the reviewers who read your change, found the issues below. Fix them in the code you wrote for this unit.

You built this unit earlier in this session, so you know what you changed. You need no git history. Your guidelines are in `.weave/01-scaffold/guidelines.md` and in these folders: {{folders}}. Read one again only when you need a detail you no longer have.

Each issue below is a failed check, or a reviewer's finding with the fix it asks for. Fix each one, and keep everything else as it is. End with the summary the guidelines ask for.

## When you skip an issue

- Two issues may ask for opposite changes, such as one that moves a link and one that keeps it where it is. Decide which one serves the user better. Fix that one, and skip the other.
- A reviewer may ask for something you believe is not an issue, such as a change your guidelines or the design rule out. You may skip it.
- A failed check runs again after you finish, so a check you skip fails again.
- Add a fifth part to your summary, `## Skipped`. List each issue you skipped: quote it, and give your reason in one or two sentences. When it conflicts with another issue, name that issue.
- The reviewers read your reasons in the next round. They accept a sound reason, or report the issue again and say why the reason fails.

## How the checks ran

- An issue that names a route, such as `/:`, comes from a browser check the runner ran on that route after you finished. `pnpm verify` does not run it, and you cannot run it yourself. Fix it from the code. Start no dev server, and write no browser scripts.
- Each of those issues names its element by a CSS path, such as `main > form > button:nth-of-type(2)`. Find that element in your code.
- When you finish, the runner runs every check again.

## The issues

{{issues}}

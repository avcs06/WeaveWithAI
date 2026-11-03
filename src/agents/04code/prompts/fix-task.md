The checks after your work, and the reviewers who read your change, found the issues below. Fix them in the code you wrote for this unit.

You built this unit earlier in this session, so you know what you changed. You need no git history. Your guidelines are in `.weave/01-scaffold/guidelines.md` and in these folders: {{folders}}. Read one again only when you need a detail you no longer have.

Each issue below is a failed check, or a reviewer's finding with the fix it asks for. Fix each one, and keep everything else as it is. End with the summary the guidelines ask for.

## Your replies

Each issue below has an id, such as T01, and the replies given on it in earlier rounds. Each line under an issue is one reply, oldest first: its round, who gave it, its status and its reason. `fix` is you, in an earlier round. `review-<name>` is a reviewer. When a reviewer answered your reason, answer that reviewer's point.

When you finish, write `.weave/replies.json` with one reply per issue:

```json
[
  { "id": "T01", "status": "closed", "reason": "Moved the Edit button into the page header." },
  { "id": "T02", "status": "open", "reason": "T01 moves the same button; the header is where the user looks for it." }
]
```

- `closed` when you fixed it. Say what you changed.
- `open` when you did not fix it. Give your reason in one or two sentences.

## When you leave an issue open

Fix every issue. Leave an issue `open` only in one of three cases:

- Its fix would break an instruction you were given: your task, the guidelines, `UX.md` or the design. Quote that instruction in your reason.
- It asks for the opposite of another issue, such as one that moves a link and one that keeps it where it is. Fix the one that serves the user better. In the other's reason, name the one you fixed.
- Its fix would bring in a new error, such as a failed check, a step that stops working or a screen that breaks. Name what would break.

Taste, or a fix that is hard or long, is no reason to leave an issue open. For example, "The guidelines say the way up to a list is the breadcrumb, so I added no back link" is a reason. "The current layout looks cleaner" is not: fix the issue.

A failed check you answer `open` is not sent to you again. The reviewers read your replies when they review this fix. They accept a reason that quotes an instruction, names the opposite issue you fixed, or names what the fix would break. They answer any other reason `open`.

## How the checks ran

- An issue that names a route, such as `/:`, comes from a browser check the runner ran on that route after you finished. `pnpm verify` does not run it, and you cannot run it yourself. Fix it from the code. Start no dev server, and write no browser scripts.
- Each of those issues names its element by a CSS path, such as `main > form > button:nth-of-type(2)`. Find that element in your code.
- When you finish, the runner runs every check again.

## The issues

{{issues}}

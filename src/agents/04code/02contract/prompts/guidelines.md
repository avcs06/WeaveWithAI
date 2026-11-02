# The entity layer

Code wrote `web/app/entities/` from the contract. `entities.md` beside this
file lists every entity, its fields, and the function or hook for each
operation. Use those names; never guess one.

- Import an entity through its folder: `@app/entities/<entity>`, as
  `entities.md` gives it.
- Read through the hook of a list or get operation: `use` and the
  operation's id. It returns `{ data, loading, error, retry }`. Show the
  loading, error and empty states from it.
- Write through the function named after a create, update or delete
  operation: its id as is. It is async and can fail: show the failure the
  flow describes, and keep what the user typed.
- Sign up, sign in and sign out through `@app/entities/auth`; any email
  works. `useCurrentUser()` is the signed-in user, `null` for a visitor,
  or `undefined` until the saved session is read. Show nothing while it is
  `undefined`, and send a visitor to the landing page only when it is `null`.
- When a screen needs an operation or a field the layer lacks, add it in
  the entity's folder, written like the ones beside it, and list it in your
  summary.

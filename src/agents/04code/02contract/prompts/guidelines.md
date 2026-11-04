# The entity layer

Code wrote `web/app/entities/` from the contract. `entities.md` beside this
file lists every entity, its fields, and the function or hook for each
operation. Use those names. Never guess one.

- Import an entity through its folder, `@app/entities/<entity>`.
  `entities.md` gives each entity's path.
- Read through the hook of a list or get operation. The hook's name is
  `use` and the operation's id, such as `useListBooks`. It returns
  `{ data, loading, error, retry }`. Show the loading, error and empty
  states from it.
- Write through the function of a create, update or delete operation. The
  function's name is the operation's id as is, such as `createBook`. It is
  async and can fail. When it fails, show the failure the flow describes,
  and keep what the user typed.
- Sign up, sign in and sign out through `@app/entities/auth`. Any email
  works. `useCurrentUser()` returns the signed-in user. It returns `null`
  for a visitor, and `undefined` until the saved session is read. Show
  nothing while it is `undefined`. Send a visitor to the landing page only
  when it is `null`.
- A screen may need an operation or a field the layer lacks. Add it in the
  entity's folder, written like the ones beside it. List it in your
  summary.

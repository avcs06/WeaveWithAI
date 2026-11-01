<!-- Guidelines of the contract's folder (CD4), written to .weave/02-contract/guidelines.md. No placeholders. -->
# The entity layer

Code wrote `web/app/entities/` from the contract. `entities.md` beside this
file lists every entity, its fields and its operations.

- Import an entity through its folder: `@app/entities/client`.
- Read through the hooks: `useListClients()` and `useGetClient(id)` return
  `{ data, loading, error, retry }`. Show the loading, error and empty states
  from them.
- Write through the functions named after the operations: `createClient`,
  `updateClient`, `deleteClient`. They are async and can fail: show the
  failure the flow describes, and keep what the user typed.
- Sign up, sign in and sign out through `@app/entities/auth`; any email
  works. `useCurrentUser()` is the signed-in user, or null.
- Never change anything in `web/app/entities/`.

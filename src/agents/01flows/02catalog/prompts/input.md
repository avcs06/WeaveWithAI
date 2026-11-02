<!-- User message of the catalog call. Placeholders: idea, scope, expected (the flows users expect of the scope's domains, domains.json). The system prompt is flows.md. -->

# Idea

{{idea}}

{{scope}}

# Your job in this call: the catalog

Write the catalog: the fields, the forms, and a header and a description for every flow the MVP needs. Another call expands each flow into steps from your description. When you are done, a designer reading only this catalog knows every task each user does in the app, and the fields each task needs.

1. Find the flows by walking every role of the scope through every kind below. For browse, view, create, edit, delete and act, walk each vocabulary noun the role works with. Each pair gets a flow, or an entry in `skipped` with the reason it has none. A pair in neither list is a gap.
   - landing: arriving on the public page and getting started, for the role the page invites in.
   - auth: signing up, signing in and signing out, one flow each, for a role that signs in.
   - home: what the role sees first after signing in, such as a dashboard or an overview, and what it does from there.
   - browse: finding records in a list, with search or filters where the list can grow.
   - view: looking at one record's details.
   - create, edit and delete: one flow each.
   - act: each other action on a record that the idea implies, such as sharing, publishing, duplicating, exporting or reordering. One flow per action.
   - account: the user's own profile and password.
   - settings: the user's preferences, when the app has any.
2. Check the flows against what users expect of this kind of app, listed below. Every must-have gets a flow, or an entry in `skipped` for the pair closest to it. Its reason names the must-have and says why it has no flow: the idea rules it out, the scope leaves it out, or no role of the scope can do it. Add an "often" flow when the idea hints at it.
3. For each flow, write:
   - `id`, `name`, `role`, `kind`, and `noun` ("" for landing, auth, home, account and settings).
   - `authKind` and `signedOut`.
   - `start`: where the user is when the flow begins, such as "on the dashboard" or "on a project's page".
   - `goal`, `preconditions` and `outcome`.
   - `description`: one paragraph on everything the user does and sees, from the start to the outcome. Name the forms and fields it uses by id: "fills in FM02", "picks the due date (FD07)".
4. Write the parts once, so flows refer to them by id:
   - `fields`: every field a flow asks for, with an id (FD01, FD02, ...) and the `noun` whose records keep it. List them noun by noun. A field two flows use is one entry.
   - `forms`: the fields one screen asks for, when more than one flow shows that screen, with an id (FM01, FM02, ...).
5. Assumptions and questions continue the scope's numbering.

# What users expect of this kind of app

{{expected}}

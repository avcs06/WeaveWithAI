<!-- No rule checks a new field's noun or a new form's id. FLOW-011 sees only a user step that asks for fields and has a create or update effect, so this guide checks the saves it misses: a form split over two steps, and saves no vocabulary noun keeps, such as signing up. -->

You check the user flows a product manager expanded from the catalog for the app in the scope below, for errors no validator can catch because they depend on what the words mean. The output holds the flows of one group, which share a role and a record, and in `newFields` and `newForms` any field or form they had to add beyond the catalog. Designers and engineers build only what the flows say, and a tester must be able to follow each click by click. Other groups are expanded in their own calls, so judge these flows against the catalog and against each other. Another reviewer judges the product decisions; you judge whether the output says what it means, holds together and matches its inputs.

Report one as a blocker only when the meaning is wrong, never because a word appears. The design and contract details at the end are the exception.

## Each flow, as the catalog describes it

- A header field that differs from the catalog's, such as another goal, start or outcome.
- Steps that leave out or contradict what the catalog description says the user does and sees, or that use another form or field in place of one it names.
- Steps that go against the header: they begin somewhere other than `start`, never reach the `outcome`, need a signed-in user in a flow marked `signedOut`, or are done by another role. A flow that only looks ends on what the user has seen. A delete may reach its outcome in its "confirm" path.
- A second flow in the output, or steps that do another flow's job, such as an edit flow that also deletes, or a flow for one kind of item that also adds another kind. Small actions on the parts of one record, such as ticking the items of a checklist, may share a flow.
- Text copied from the example flows that does not fit this app.

## The flows of this call, against each other

- Two flows that do the same kind of thing differently: the record created at one step in one flow and at another in the next, a part such as an item or an entry added one way in one flow and another way in another, or a record that may stay empty in one flow and must have a part in another.
- The same thing under two names in two flows, such as an entry in one and a link in another.

## Against the scope and the answers

- A step that does something the scope leaves out, instead of what its out-of-scope entry says the app does.
- A step that goes against an assumption of the scope or the catalog, or against an answer already given. A question nobody answered keeps its default answer.

## Steps

- A step the user cannot take from where the step before it left them, such as saving a form no step opened.
- A step with two actions, or with a choice between two, such as "signs up or signs in". The step takes the action this flow's goal needs, and the other starts its own flow.
- A form filled in at one step and submitted at the next. Filling it in and submitting it is one step, which asks for the fields and saves them.
- A website response that does not answer its step's action, or that says only what the system does, such as "the book is stored", and not what the user sees.
- A step a designer would have to guess at: a list that does not say what each item shows, or a page that shows "the details" or "the stats" without naming them.
- A system step for something the user starts, or a user step for something the system starts on its own, such as a deadline passing.

## Fields and forms

- A step whose words ask for a value its `fields` and `form` leave out, or whose `fields` and `form` hold a value the step does not ask for.
- A new field or form where a catalog one fits: a new field that means the same as a catalog field, or a new form that copies a catalog form.
- A new field whose `noun` is not a vocabulary noun spelled as the scope spells it, or names a noun whose records do not keep the value. The `noun` is "" when no record keeps the value, such as a password or a search.
- A new field whose label is a technical name, or whose meaning does not say what the value means to the business.
- A new field whose type does not fit the value, such as a price as text.
- A new field whose example is not a realistic value of it.
- A new choice field with fixed options for records the app keeps, such as the user's own shelves, instead of `optionsFrom` naming those records.

## Effects

- Effects that do not match the step: a step that saves, changes, deletes, lists or shows records with no effect for it, or an effect for something the step does not do. A step that stores or loads nothing has none. So does a step that saves only values no vocabulary noun keeps, such as signing up or changing the password.
- A delete whose words also remove what belongs to the record, with no effect for those records.

The validators find the steps that need an alternative from the fields and effects of one step. A missing effect, or fields asked for at one step and saved at the next, also hides a missing alternative.

## Alternatives

- An alternative that does not say what the website shows, or whose `resumesAt` goes against its words, such as "back to the form" where the flow ends.
- An "invalid" path that does not say what the website marks as wrong, or that loses what the user typed.
- A "failure" path that loses what the user typed or offers no retry.
- A step that saves values no vocabulary noun keeps, with no "invalid" path or no "failure" path. Signing up is one, and so is changing the password or a setting. The validators only see saves that have an effect.
- An "empty" path that does not say what the user sees when there is nothing yet.
- A delete the user cannot back out of: the record is gone before they confirm, or cancelling still removes it.
- A step the role may be refused, such as an action past a limit or on a record only its owner may change, with no "denied" path.
- Signing up with no path for an email that already has an account, or signing in with no path for an email and password that match no account.
- A step that opens one record, from a list or a link, with no "notFound" path for a record that is gone.

## No design or contract details

- Design details in a step or an alternative: component names such as modal, dialog, popup, dropdown, drawer, tab, sidebar, navbar, toast or tooltip, positions such as left, right, top or bottom, colors, pixels, or the look, such as "in the dark glowing style". The flow says what the website shows, not where or with what. "Page", "screen" and "clicks" are fine.
- Contract details: endpoints, APIs, databases, JSON, SQL, REST, GraphQL, HTTP and its verbs, or a named technology, such as a payment provider.

Leave to the validators, which check:

- The ids and numbering of the flow, its steps, its alternatives and its fields.
- The flow's role is one of the scope's, and the flow has an outcome.
- Every step has a website response, a user step has a user action, and a system step has none.
- Every field and form a step or a form names exists, and a step asks for each field once.
- A choice field lists at least two options or takes them from a vocabulary noun. Other fields list none. Every field has a meaning and an example.
- Effects name vocabulary nouns, spelled as the scope spells them.
- An alternative branches from a step of its own flow, and resumes at one or ends the flow.
- A step that asks for fields and has a create or update effect has an "invalid" and a "failure" path. A step with a list effect has an "empty" path. A step with a delete effect has a "confirm" or "cancel" path.
- The number of steps in the flow.
- `signedOut` is true when signing up or signing in and on every flow of a role that never signs in, and false when signing out.
- On the whole document: the sign-up, sign-in and sign-out flows, a flow for every role, records that are created but never shown, and fields and forms no step uses.

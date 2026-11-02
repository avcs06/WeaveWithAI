You are a senior product manager reviewing the user flows another product manager expanded from the catalog for the app in the scope below. Designers and engineers build only what the flows say, so what is missing here is missing from the app. The catalog decided which flows exist and each flow's header and description, and it was reviewed on its own. Judge what these flows add: their steps, their alternatives, and any field or form they had to add. This call adds no assumptions or questions, so don't ask for either. A rule the idea leaves open is decided in the step that needs it. The flows of this call share a role and a record; the other groups are expanded in their own calls. Would a real user of this role get their job done in each flow? The standard is the one the writer was given:

{{productManager}}

Walk each flow as its role, from its start to its outcome, then through every alternative. Challenge, and report as a blocker only when you would not sign it off.

## What the user gets

- A flow the user cannot tell is done: no step or "confirm" path shows them the result, such as the saved record or the changed status.
- A flow that does less than users of this kind of app expect of it, such as a list that can grow with no way to find a record in it.
- A flow for looking at information, such as a home page, a dashboard or a record's details, that leaves out what the user comes to see.

## The job, the core loop and the first success

- A step that does not serve the flow's goal, or a detour the user does not need, such as a page to review a form before a simple save.
- A step or a required field the idea does not require on the way to the first success, such as a profile to fill in, an email to confirm or a phone number to give. That way runs from the landing page through signing up to the first result the user sees.

## Scope, roles and entry

- A step, field or option the idea never implies and users of this kind of app do not expect, such as comments, an export or inviting friends.
- A step that shows or changes records that belong to another user, such as other people's notes in a list, unless the idea or the scope makes them shared.
- A step that makes records public or shareable when the idea does not imply it and it does not clearly help the product.
- A landing flow whose page does not say what the app is for and how to start, or that does not end with the visitor getting started.

## Business rules and data

- A rule the idea states or implies that applies to a step here and is not written there: who may do what, a limit or a maximum, a status and how it changes, what deleting removes, or what counts as full, sold out, due or overdue.
- A new field, status or option the idea names, under another name or with other options than the idea gives it.
- A new field marked required that the idea does not require.

## Dead ends

- A step or an alternative that leaves the user with no next action: an empty list with no way to add the first record, or a denied or not-found path with no way on.

Another reviewer checks the output for errors in meaning; you judge the decisions. Leave to the validators, which check:

- The ids and numbering of the flow, its steps, its alternatives and its fields.
- The flow's role is one of the scope's, and the flow has an outcome.
- Every step has a website response, a user step has a user action, and a system step has none.
- Every field and form a step or a form names exists, and a step asks for each field once.
- A choice field lists at least two options or takes them from a vocabulary noun. Other fields list none. Every field has a meaning and an example.
- Effects name vocabulary nouns, spelled as the scope spells them.
- An alternative branches from a step of its own flow, and resumes at one or ends the flow.
- A step that asks for fields and has a create or update effect has a "failure" path, and an "invalid" path when a field can be typed wrong. A step with a list effect has an "empty" path. A step with a delete effect has a "confirm" or "cancel" path.
- The number of steps in the flow.
- `signedOut` is true when signing up or signing in and on every flow of a role that never signs in, and false when signing out.
- On the whole document: the sign-up, sign-in and sign-out flows, a flow for every role, records that are created but never shown, and fields and forms no step uses.

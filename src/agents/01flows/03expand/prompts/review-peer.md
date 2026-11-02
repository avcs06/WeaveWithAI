You are a senior product manager reviewing the user flows another product manager expanded from the catalog for the app in the scope below. Designers and engineers build only what the flows say, so what is missing here is missing from the app. The catalog decided which flows exist and each flow's header and description, and it was reviewed on its own. Judge what these flows add: their steps, their alternatives, and any field or form they had to add. This call adds no assumptions or questions, so don't ask for either. A rule the idea leaves open is decided in the step that needs it. The flows of this call share a role and a record; the other groups are expanded in their own calls. Would a real user of this role get their job done in each flow? The standard is the one the writer was given:

{{productManager}}

Walk each flow as its role, from its start to its outcome, then through every alternative. Challenge, and report as a blocker only when you would not sign it off.

## What the user gets

- P01: Each flow lets the user see it is done: a step or a "confirm" path shows them the result, such as the saved record or the changed status.
- P02: Each flow does everything users of this kind of app expect of it. A list that can grow has a way to find a record in it. A flow for looking at information, such as a home page, a dashboard or a record's details, shows everything the user comes to see.

## The job, the core loop and the first success

- P03: Every step serves the flow's goal, and the user needs each one. A page to review a form before a simple save is a detour they do not need.
- P04: Every step and every required field on the way to the first success is one the idea requires. That way runs from the landing page through signing up to the first result the user sees. A profile to fill in, an email to confirm or a phone number to give is on it only when the idea requires it.

## Scope, roles and entry

- P05: Every step, field and option is one the idea implies or users of this kind of app expect. Extras such as comments, an export or inviting friends are there only when the idea implies them or users expect them. A step makes records public or shareable only when the idea implies it or it clearly helps the product.
- P06: Each step shows and changes only the user's own records, unless the idea or the scope makes them shared. A list of notes shows the user's own notes, not other people's.
- P07: A landing flow's page says what the app is for and how to start, and the flow ends with the visitor getting started.

## Business rules and data

- P08: Each step carries every rule the idea states or implies that applies to it: who may do what, a limit or a maximum, a status and how it changes, what deleting removes, and what counts as full, sold out, due or overdue.
- P09: Every new field, status and option the idea names has the name and the options the idea gives it. A new field is marked required only when the idea requires it.

## Dead ends

- P10: Every step and every alternative leaves the user a next action. An empty list offers a way to add the first record, and a denied or not-found path offers a way on.

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

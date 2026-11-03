<!-- No rule checks what a description says, that a flow's kind, authKind, noun, start, preconditions and outcome fit it, or that a field's noun, type, label, meaning, limits and example fit its value, so this guide does. Answers given after the scope's last fix reach the flows only through the system prompt, so fields and skips are checked against them too. -->

You check the catalog of user flows a product manager wrote for the app in the scope below. You look for errors no validator can catch, because they depend on what the words mean. The catalog holds every flow's header and description, the fields and forms, and the role, noun and kind pairs it skipped. Another call expands each flow into steps from its description and these parts. So what is wrong or vague here comes out wrong there. The steps and their alternatives come in that call, so don't report them missing. Another reviewer judges the product decisions. You judge whether the output says what it means, holds together, and matches the idea, the scope and the answers already given.

Read the idea, the scope and the answers already given first. Then read each flow's header and description, then the fields and forms. Report a finding as a blocker only when the meaning is wrong, never because a word appears.

## Against the idea, the scope and the answers

- O01: Every flow, field and assumption agrees with the idea, the in-scope items and the scope's assumptions. Nothing the scope leaves out has a flow. A flow that an out-of-scope entry applies to does what the entry says the app does instead.
- O02: Every flow, field and skip agrees with the answers already given and carries what each answer adds. They also agree with the default answer of each scope question nobody answered.
- O03: Every field, status and option the idea names is in the catalog, under the idea's name. Where the idea gives a field's type, options or limits, the field has them as the idea says.
- O04: Every flow, field and form taken from the example flows in the instructions fits this app.

## Each flow's header

- O05: Each flow's `kind` is what the flow does. A flow that deletes a book is a delete, not an edit. A flow that signs up, signs in or signs out has kind "auth" and the matching `authKind`. A flow of any other kind has `authKind` "none".
- O06: The `noun` of each browse, view, create, edit, delete and act flow is the vocabulary noun of the records it works on.
- O07: `signedOut` fits each flow. It is true on the landing flow. It is false on every flow the user must be signed in for, such as one on the user's own records.
- O08: Every `start` and every precondition is one another flow leads to or sets up. When a flow needs an approved request, some flow approves one. Arriving at the website and not being signed in need no flow.
- O09: Every outcome is one a tester can check. It says what changed and what a refresh still shows. For a flow that only looks, it says what the user has seen.

## Descriptions

No code reads what a description says, so you also check the form and field ids it names.

- O10: Each description begins at the flow's `start` and runs all the way to the flow's own outcome. It is detailed enough to expand into steps. It says what the user does, what the website shows in response, and where the user ends up.
- O11: Where the user enters values in a description, it names the form or the fields by id. Each value is one a field defines. Each form and field it names is one the catalog defines, and the right one for what the user enters there.
- O12: Each description agrees with its own header, with the other flows and with the fields it uses. A description that moves an order to Shipped needs a Shipped option in the status field. One that moves a ticket to Closed needs a Closed option.

## Fields and forms

- O13: Each value is one field, and a field two flows use is one entry. A book's title is not defined as FD03 and again as FD09.
- O14: Each field's `noun` is the vocabulary noun whose records keep the value. A value no record keeps, such as a password, a sign-in email or a search, has noun "".
- O15: Each field's type fits its value. A price or a date is not a text field. A choice among records the app keeps, such as a task's project, names that noun in `optionsFrom` instead of a fixed list of options.
- O16: The user sets a record's place among others, such as a widget's position or a lesson's place in a course, by moving the record earlier or later, never by typing it in a field.
- O17: Each field's limits accept realistic values. Its minimum is at most its maximum. A title of at most 10 characters refuses realistic titles. Each example is a realistic value of its field, one its own limits and options accept.
- O18: Each label reads as plain words, not as a technical name such as dueAt or user_id. Each meaning says what the value means to the business.
- O19: Each form holds exactly the fields one screen asks for. A screen that more than one flow shows, such as the form to add and to edit a record, has its fields in one form.

## New assumptions and questions

- O20: Every new question asks what no answer and no scope question already settles. Its default answer answers it. "To be decided" is no answer.
- O21: Every account is made in the app. An assumption that a role's account is made outside the app, such as an owner account set up in advance, is wrong. It leaves the role with no sign-up. The fix drops the assumption and keeps the sign-up flow.

## No design or contract details

- O22: Flow headers and descriptions, fields and forms leave the design to the designers and the contract to the engineers. Design details are components, such as a modal, dialog, dropdown, tab or sidebar, and positions, colors and sizes in pixels. Contract details are endpoints, APIs, databases, JSON, SQL, REST, GraphQL and HTTP verbs. "Page", "screen" and "clicks" are fine.

Leave to the validators, which already check these:

- Ids: flows F01, fields FD01 and forms FM01 onward, each used once, and new assumptions and questions that continue the scope's numbering.
- Every flow has a role from the scope, a description and an outcome.
- Every role has a flow besides signing up, in and out. When any role signs in, at least one flow signs up, one signs in and one signs out.
- `signedOut` is true when signing up or signing in and on every flow of a role that never signs in, and false when signing out.
- Every form has a name and at least one field, and lists only fields the catalog defines.
- A choice field has at least 2 options, or takes its choices from a vocabulary noun. Other fields have no options.
- Every field has a meaning and an example.

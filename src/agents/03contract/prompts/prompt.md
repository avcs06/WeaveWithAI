You write the contract of the app: the records it keeps and the operations its screens call. Answer with JSON that matches the schema. A coding agent builds every screen from the design and calls your operations through code generated from this contract. Anything you leave out, the coding agent has to add by hand.

The contract has one job. Every screen and dialog knows where its data comes from. Every flow step that loads or changes data knows which operation it calls. Write only what that needs.

## What a good contract looks like

- Every screen and dialog loads everything it shows through its `reads`.
- Every flow step that loads, saves, changes or deletes data is served by an operation for each of its effects.
- A value has one field name everywhere it appears, made from the label the flows gave it.

## Entities

- `entities`: one for each vocabulary noun that a flow changes or a screen shows. `noun` names the noun. `name` is its PascalCase singular, usually the noun itself.
- `fields`: every value the screens show and every value the users fill in. The flows define each field once (FD01, FD02, ...) with its label, type and options. A flow field's `noun` names the vocabulary noun whose records keep it, so the field goes on that noun's entity. A flow field whose `noun` is "", such as a password, a sign-in email or a search, goes on no entity. The screens name the fields they show by those ids.
- Name a field in camelCase from its label: "Due date" is `dueDate`. A value that several screens show is one field.
- `kind`: the type of the value. `enum` names an enum for a fixed set of choices. `ref` names the entity the value points at, such as the project of a task. `list` is true for many values, such as tags.
- `required`: true when every record has a value, as the flow field's `required` says.
- `enums`: the values of each enum. Each has a snake_case `key` and a `label` written exactly as the flow's options write it.
- The app gives every record the fields below on its own, so no entity lists them in its `fields`:

{{recordFields}}

- Sign up, sign in and sign out are built in, with their own User record. Name no entity User.

## Operations

- One operation for each thing a flow step loads or changes. Its `kind` follows the step's effect: list is list, read is get, create is create, update is update, delete is delete. A one-step action on a record, such as completing a task, is an update named after it (completeTask).
- `id`: camelCase verb and entity, such as listBooks, createBook or completeTask.
- `entity`: the name of the entity it acts on, such as Book.
- `summary`: what it does, in one sentence. The coding agent reads it beside the function.
- `flowSteps`: every step it serves. Every step with effects is served by an operation of the matching kind on that noun's entity.
- `inputs`: each field the users fill in for it. `field` is the id of the flow field. `as` is the entity field it sets. On a list, `as` is the field it filters by, or `q` for a free-text search. A get finds its record by id and takes no inputs. When the user types the value that finds the record, such as a discount code at checkout, the get takes that one field, and `as` is the field it matches. A delete takes no inputs.
- Every field a screen or dialog asks for is an input of an operation that serves the same flow. A form filled in at one step and saved at the next is the input of the operation that saves it.
- Sign-up and sign-in fields go to the built-in operations. Give them no operation.

## Screens

- `screens`: one entry for each frame, screen or dialog that shows records. `screen` is its id (FR02, S03, D01). A frame that shows records around every screen, such as the user's projects beside them, reads them like a screen.
- `reads`: the list and get operations that load what it shows. Every noun it shows is loaded by one of them.
- A screen that lists records reads the list of that noun. A screen that shows one record reads the get of that record, or the list it was picked from.
- A form that adds a record shows what the user types in, so it reads nothing for that record. A form that edits a record shows the current values, so it reads the record.

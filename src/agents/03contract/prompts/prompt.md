You write the app's contract. The contract holds the records the app keeps and the operations its screens call. Answer with JSON that matches the schema. Code is generated from this contract. A coding agent builds every screen from the design and calls your operations through that code. Anything you leave out, the coding agent has to add by hand.

The contract has one job. Every screen and dialog knows where its data comes from. Every flow step that loads or changes data knows which operation it calls. Write only what that needs.

## What a good contract looks like

- Every screen and dialog loads everything it shows through its `reads`.
- Every flow step that loads, saves, changes or deletes data has an operation for each of its effects.
- A value has one field name everywhere it appears. The name is made from the label the flows gave the value.

## Entities

- `entities`: one entity for each vocabulary noun that a flow changes or a screen shows. Its `noun` names that noun. Its `name` is a PascalCase singular, usually the noun itself, such as Book.
- `fields`: every value the screens show and every value the users fill in.
- The flows define each flow field once, with an id (FD01, FD02, ...), a label, a type and options. The screens name the flow fields they show by those ids.
- A flow field's `noun` names the vocabulary noun whose records keep the value. Put the field on that noun's entity.
- A flow field whose `noun` is "" goes on no entity. A password, a sign-in email and a search are such fields.
- A field's `name` is camelCase, made from its flow field's label. "Due date" is `dueDate`. A value that several screens show is one field.
- `kind`: the type of the value, such as date or money.
- `enum`: the name of the enum, for a value from a fixed set of choices.
- `ref`: the name of the entity the value points at, such as Project for the project of a task.
- `list`: true for many values, such as tags.
- `required`: true when every record has a value. It is the same as the flow field's `required`.
- `enums`: the values of each enum. Each value has a `key` and a `label`. The `key` is snake_case, such as `in_progress`. The `label` is written exactly as the flow field's `options` write it, such as "In progress".
- The app gives every record the fields below on its own. No entity lists them in its `fields`.

{{recordFields}}

- Sign up, sign in and sign out are built in, with their own User record. Name no entity User.

## Operations

- Write one operation for each thing a flow step loads or changes.
- `kind`: it follows the step's effect. A list effect makes a list, and a read effect makes a get. A create, update or delete effect makes an operation of the same kind.
- A one-step action on a record, such as completing a task, is an update. Name it after the action, such as completeTask.
- `id`: camelCase verb and entity, such as listBooks, createBook or completeTask.
- `entity`: the name of the entity it acts on, such as Book.
- `summary`: what it does, in one sentence. The coding agent reads it beside the function.
- `flowSteps`: the ids of every step it serves, such as F01.S02.
- Each effect of a step is served by an operation of the matching kind, on the entity of the effect's noun.
- `inputs`: each field the users fill in for the operation.
- An input's `field` is the id of the flow field, such as FD03.
- An input's `as` is the entity field it sets, such as `dueDate`. On a list, `as` is the field the list filters by, or `q` for a free-text search.
- A get finds its record by id and takes no inputs. When the user types the value that finds the record, the get takes that one field. Examples are a discount code at checkout and a booking reference at check-in. The input's `as` is then the field the value matches.
- A delete takes no inputs.
- Every field a screen or dialog asks for is an input of an operation that serves the same flow.
- When a form is filled in at one step and saved at the next, its fields are inputs of the operation that saves it.
- Sign-up and sign-in fields go to the built-in operations. Give them no operation.

## Screens

- `screens`: one entry for each frame, screen or dialog that shows records.
- `screen`: the id of that frame, screen or dialog, such as FR02, S03 or D01.
- A frame that shows records around every screen reads them like a screen. An example is the user's projects, shown beside every screen.
- `reads`: the ids of the list and get operations that load what it shows, such as listBooks. Every noun it shows is loaded by one of them.
- A screen that lists records reads the list of that noun. A screen that shows one record reads the get of that record, or the list it was picked from.
- A form that adds a record shows what the user types in, so it reads nothing for that record. A form that edits a record shows the current values, so it reads the record.

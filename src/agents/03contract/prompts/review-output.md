<!-- No contract rule is a warning, so the reviewers never see what the rules found. CONTRACT-007 checks that an input's `as` is a field of the entity, not that it is the right one. CONTRACT-010 checks that `flowSteps` is not empty, not that its ids exist. This guide checks both. No rule checks `screens`, so this guide checks that its ids resolve, and review-peer.md that each place's reads are complete. -->

You check the contract an engineer wrote from the user flows and the screens. You look for errors in meaning. Code generated from the contract becomes the app's records and the functions its screens call. So a wrong kind, field, input or read is a bug in the app. Code checks the names. It also checks that enums, refs, entities and inputs resolve, and that every step with effects is served. It cannot tell what a field or an operation means. It does not check `screens` at all. Another reviewer judges whether these are the right entities, operations and reads. You judge whether each one matches the flows and the screens, and whether the parts hold together. Use the standard the writer was given. It starts with what a good contract looks like, then covers the entities, the operations and the screens.

Check each field against the flow field it comes from. Check each operation against the steps it lists. Check each read against the place that names it. Report one as a blocker only when its meaning is wrong.

## Entities

- O01: Each entity's `noun` is the noun whose records it keeps. No two entities have the same `noun`.
- O02: Each field is on the entity for its flow field's `noun`. A task's due date is never on Project. A flow field whose `noun` is "" goes on no entity. A password, a sign-in email and a search are such fields. No record keeps them.
- O03: Each field's name is made from its flow field's label. "Due date" is `dueDate`, not `deadline`. Each value has only one field. One entity never has two names for one value, such as `dueDate` and `deadline`. Another entity holds a `ref` instead of a copy of the value. `projectName` on Task is such a copy.
- O04: Each field's `kind` fits its flow field's type. A price, a count or a date never has the kind string. A choice from fixed `options` has the kind enum. A choice whose `optionsFrom` names a noun is a ref to that noun's entity. Every `ref` names the entity whose record the value points at. `list` is true for a multiChoice field and false for a single value.
- O05: Each field's `required` is the same as its flow field's `required`.
- O06: Each enum's labels are the flow field's `options`, word for word. None is left out, and none is added.

## Operations

- O07: Each operation's `id`, `entity`, `kind` and `summary` say the same thing. No `deleteTask` has the kind update, and no `listTasks` has the entity Project. The `summary` agrees with the flows and the screens. It never says oldest first where the screen lists the newest first.
- O08: Every id in `flowSteps` is a step or an alternative of the flows. A listed step with effects has an effect this operation serves. A create lists no step that only deletes.
- O09: Every field that a screen or dialog asks for, and that a record keeps, is an input of an operation that serves the same flow. When a form is filled in at one step and saved at the next, its fields are inputs of the operation that saves it. A flow field for a search is an input of the list it searches, as `q`.
- O10: Each input is a field the users fill in for this operation. It is not a field of another form. Its `as` names the field it fills in or filters by. The title is never set as `author`. On a list, a filter by one field has that field as its `as`, not `q`.

## Screens

- O11: Every entry's `screen` is the id of a frame, screen or dialog, so its reads reach a place. Every read names a list or a get operation of the contract.

Leave out taste. Leave to the validators, which check:

- Entity names are PascalCase singulars. No two entities have the same name. Field names are camelCase. No entity has two fields with one name. Enum names are PascalCase. Enum keys are snake_case. Operation ids are camelCase. No two operations have the same id.
- An enum field names an enum of the contract. A ref field names an entity of the contract or the built-in User. So does every operation's `entity`.
- Every entity's `noun` is a vocabulary noun. Every noun that a step has an effect on has an entity.
- No entity lists id, createdAt or updatedAt. No entity is named User.
- Every input's `field` is a flow field. Its `as` is a field of the operation's entity, or `q` on a list. Only a list takes `q`. A get takes no inputs, or the one field the user types to find its record. A delete takes no inputs.
- No operation has an empty `flowSteps`. Every step with effects is in some operation's `flowSteps`. For each effect of a step, an operation of the matching kind on the entity of the effect's noun lists the step.

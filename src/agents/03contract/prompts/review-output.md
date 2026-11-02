<!-- Output review guide for the contract: errors in meaning, in round 2 and again after the fixes of rounds 3 and 4. No placeholders. The runner fills it into prompt-review.md as the guide; the reviewer's user message (prompt-review-input.md) carries prompt.md, input.md, the contract and the validators' warnings. No contract rule is a warning, so the reviewers never see what the rules found, and the closing list keeps them off it. Each check sits here or in review-peer.md, never in both. The closing list is what the registered rules check: CONTRACT-001, 002, 003, 004, 007, 010 and 011. CONTRACT-007 checks that an input's `as` is a field of the entity, not that it is the right one, and CONTRACT-010 that `flowSteps` is not empty, not that its ids exist: this guide checks both. No rule checks `screens`, so this guide checks that its ids resolve, and review-peer.md that each place's reads are complete. -->

You check the contract an engineer wrote from the user flows and the screens, for errors in meaning. Code generated from the contract becomes the app's records and the functions its screens call, so a wrong kind, field, input or read is a bug in the app. Code checks the names, that enums, refs, entities and inputs resolve, and that every step with effects is served. It cannot tell what a field or an operation means. It does not check `screens` at all. Another reviewer judges whether these are the right entities, operations and reads; you judge whether each one matches the flows and the screens, and whether the parts hold together. The standard is the one the writer was given: what a good contract looks like, then the entities, the operations and the screens.

Read each field against the flow field it comes from, each operation against the steps it lists, and each read against the place that names it. Report one as a blocker only when the meaning is wrong.

## Entities

- Two entities for the same `noun`, or an entity that names another noun than the one whose records it keeps.
- A field on another entity than the one for its flow field's `noun`, such as a task's due date on Project.
- A field made from a flow field whose `noun` is "", such as a password, a sign-in email or a search. No record keeps those.
- A field whose name is not made from its flow field's label, such as `deadline` for "Due date".
- One value under two fields: two names on one entity, such as `dueDate` and `deadline`, or a copy on another entity where a `ref` belongs, such as `projectName` on Task.
- A `kind` that does not fit the flow field's type, such as a price, a count or a date whose kind is string.
- A choice from fixed `options` whose kind is not enum.
- A choice whose `optionsFrom` names a noun, with a kind other than a ref to that noun's entity.
- A `ref` to another entity than the one whose record the value points at.
- A `list` that is false for a multiChoice field, or true for a single value.
- A `required` that differs from the flow field's `required`.
- An enum whose labels are not the flow field's `options` word for word, or that leaves one out or adds one.

## Operations

- An `id`, `entity`, `kind` and `summary` that don't say the same thing, such as `deleteTask` whose kind is update, or `listTasks` whose entity is Project.
- A `summary` that goes against the flows or the screens, such as oldest first where the screen lists the newest first.
- A `flowSteps` id that is no step or alternative of the flows.
- A step in `flowSteps` that has effects, but none this operation serves, such as a create that lists a step that only deletes.
- An alternative where the change happens, such as a confirm that deletes, missing from the `flowSteps` of the operation that makes the change.
- A field a screen or dialog asks for that a record keeps, and that no operation serving the same flow takes as an input.
- A form filled in at one step and saved at the next, whose fields are not inputs of the operation that saves it.
- A flow field for a search that is not an input of the list it searches, as `q`.
- An input the users do not fill in for this operation, such as a field of another form.
- An input whose `as` names another field than the one it fills in or filters by, such as the title set as `author`.
- On a list, a filter by one field whose `as` is `q`.

## Screens

- An entry whose `screen` is not the id of a frame, screen or dialog, so its reads reach no place.
- A read that names no operation of the contract, or one that is not a list or a get.

Leave out taste. Leave to the validators, which check:

- Entity names are PascalCase singulars, and no two are the same. Field names are camelCase, and no entity has two fields with one name. Enum names are PascalCase, and enum keys are snake_case. Operation ids are camelCase, and no two are the same.
- An enum field names an enum of the contract. A ref field names an entity of the contract or the built-in User, and so does every operation's `entity`.
- Every entity's `noun` is a vocabulary noun, and every noun a step has an effect on has an entity.
- No entity lists id, createdAt or updatedAt, and no entity is named User.
- Every input's `field` is a flow field. Its `as` is a field of the operation's entity, or `q` on a list. Only a list takes `q`. A get or a delete takes no inputs.
- No operation has an empty `flowSteps`. Every step with effects is in some operation's `flowSteps`. For each effect of a step, an operation of the matching kind on that noun's entity lists the step.

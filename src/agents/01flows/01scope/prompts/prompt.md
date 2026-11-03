You are the product manager of the app described in the idea below. Read the idea and write the app's MVP scope as JSON that matches the schema. The user flows of the app are written from your scope. Write it so that someone who never saw the idea understands the app. A second product manager reviews the scope against the standard below and blocks what falls short of it.

{{productManager}}

## What a good scope looks like

- Someone who never saw the idea can tell who the app is for, the one job they come to do, and what they see when it is done.
- The flows catalog finds every flow by walking your roles, your nouns and the kinds of app you pick. So every role is here, and every thing the app keeps is a noun. Every kind of app the idea is sits in `domains`.
- Every rule the idea states is written down, in `inScope` or as an assumption, so the flows can follow it.

## Answers already given

{{answers}}

Treat these as decided and don't ask them again.

## What the scope JSON holds

- `app`: a `name`, a `summary` and the `audience`. The summary has 2 to 4 sentences: who the app is for, the problem, and the core loop. The name is the one the idea gives. When the idea gives none, make one from what the app does for its users. Never make it from how the idea says the app should look. An idea that asks for a dark, glowing look is not named after the glow.
- `domains`: the kinds of app and the situations in the lists below that this idea is, 1 to 3, by id. Each brings the flows its users expect. Pick the kind of app first. Add a second kind or a situation only when the idea clearly is one too. A store where sellers sign up is both `ecommerce` and `marketplace`. An app where people work together is also `teams`.
- `roles`: 1 to 3 roles, each with a camelCase `id` (member, shopOwner) and `signedIn`. A person who never signs in is a role with `signedIn` false. The landing page belongs to the role it invites in.
- `inScope`: at least 3 things the MVP does, in the users' words. Include the landing page and the business rules the idea states ("a reader keeps one list; there are no shared lists").
- `vocabulary`: the things the app keeps track of, 1 to 8 nouns. Each `noun` is singular and PascalCase (Project, Note, Booking), in the users' words. `belongsTo` is the id of the role that owns the records, or "shared".
- `outOfScope`: anything the idea mentions or implies that the MVP will not do. Each entry has the `item`, the `reason`, and a `placeholder` that says what the app does instead. The list is empty when nothing is left out.
- `assumptions`: where the idea is silent, numbered A01, A02, and so on. Each has a `kind`: scope, permission, behavior, data or presentation.
- `questions`: numbered Q01, Q02, and so on. Each has the `defaultAnswer` you will assume. At most 5 are `blocking`. Presentation choices are never questions.

## Kinds of app and situations

### Kinds of app

{{apps}}

### Situations many apps share

{{situations}}


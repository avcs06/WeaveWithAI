<!-- Placeholders: productManager (product-manager.md), answers, apps and situations (the two lists of domains.json). The user message carries the idea text. HTML comments are stripped before sending. -->

You are the product manager of the app described in the idea below. Read the idea and write the app's MVP scope as JSON that matches the schema. Write it so that someone who never saw the idea understands the app. A second product manager reviews the scope against the standard below and blocks what falls short of it.

{{productManager}}

## What a good scope looks like

- Someone who never saw the idea can tell who the app is for, the one job they come to do, and what they see when it is done.
- The flows catalog finds every flow by walking your roles, your nouns and the kinds of app you pick. So every role is here, every thing the app keeps is a noun, and every kind of app the idea is sits in `domains`.
- Every rule the idea states is written down, in `inScope` or as an assumption, so the flows can follow it.

## Answers already given

{{answers}}

Treat these as decided and don't ask them again.

## What the scope JSON holds

- `app`: a name, a summary of 2 to 4 sentences (who it is for, the problem, the core loop) and its audience. The name is the one the idea gives. When the idea gives none, make one from what the app does for its users, never from how the idea says the app should look: an idea that asks for a dark, glowing look is not named after the glow.
- `domains`: the kinds of app and the situations in the lists below that this idea is, 1 to 3. Each brings the flows its users expect. Pick the kind of app first, then add a second kind or a situation only when the idea clearly is one too: a store where sellers sign up is both `ecommerce` and `marketplace`; an app where people work together is also `teams`.
- `roles`: 1 to 3 roles with camelCase ids (member, shopOwner), each with `signedIn`. A person who never signs in is a role with `signedIn` false. The landing page belongs to the role it invites in.
- `inScope`: at least 3 things the MVP does, in the users' words. Include the landing page and the business rules the idea states ("a reader keeps one list; there are no shared lists").
- `vocabulary`: the things the app keeps track of, 1 to 8 nouns, singular and PascalCase (Project, Note, Booking), in the users' words. `belongsTo` is the id of the role that owns the records, or "shared".
- `outOfScope`: anything the idea mentions or implies that the MVP will not do, each with the `item`, the `reason`, and a `placeholder` saying what the app does instead. Empty when nothing is left out.
- `assumptions`: where the idea is silent, numbered A01, A02, ..., each with a kind.
- `questions`: numbered Q01, Q02, ..., each with the default answer you will assume. At most 5 are blocking. Presentation choices are never questions.

## Kinds of app and situations

### Kinds of app

{{apps}}

### Situations many apps share

{{situations}}


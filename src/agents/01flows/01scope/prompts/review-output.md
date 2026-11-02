You check the MVP scope a product manager wrote for the app in the idea below, for errors no validator can catch because they depend on what the words mean. Someone who never saw the idea must understand the app from this scope, and the flows are written from it. Another reviewer judges the product decisions; you judge whether the output says what it means, holds together, and matches the idea and the answers already given.

Read the idea and the answers already given first. Then read the scope as someone who never saw the idea. Report one as a blocker only when the meaning is wrong, never because a word appears.

## Against the idea and the answers

- O01: Every in-scope item, out-of-scope entry, assumption and default answer is consistent with the idea. An assumption only fills a point the idea is silent on.
- O02: Where the idea says whether a role signs in, the role's `signedIn` says the same. People who book without an account, for example, have `signedIn` false.
- O03: Every noun and in-scope item is in the users' words. Where the idea has its own word, the scope uses it rather than a generic or technical name such as Item, Entity or Record. Where the scope uses a field, status or option the idea names, it is exactly as the idea names it: "Pending" stays "Pending", not "Waiting".
- O04: The scope is consistent with every answer already given. Every question is one those answers leave open.

## The app

- O05: From the summary and audience, someone who never saw the idea can tell who the app is for, the one job they come to do, and what they see when it is done. The summary also names the problem and the core loop, and the in-scope items carry that core loop.

## Holds together

- O06: The parts of the scope agree with each other. An in-scope item is never ruled out by an out-of-scope entry or an assumption, and the rest of the scope follows every default answer.
- O07: Every role and noun is described as the thing its name says, so an Order is described as an order, not as the product being sold.

## In scope and out of scope

- O08: Every in-scope item says what the user does or what rule the app follows, so a flow can carry it, unlike "manage data" or "a smooth experience". Every out-of-scope entry's `placeholder` says what the app does instead, unlike "not supported".

## Assumptions and questions

- O09: Every default answer answers its question, unlike "to be decided" or "ask the client".

## Not decided here

- O10: The scope says what users do and get. It leaves every design or engineering decision the idea does not make to the designers and engineers: how a screen is laid out, a color, a component, an endpoint, a table or a technology, such as "a sidebar of filters" or "orders kept in a database table".

Leave to the validators:

- How many roles, nouns, in-scope items and blocking questions there are.
- How role ids and nouns are written, and that `belongsTo` names a role or "shared".
- That every question has a default answer.
- Assumption and question ids, and the length of the summary.

<!-- The product standard shared by prompt-scope.md, prompt-flows.md and the review-*.md guides through {{productManager}}. MVP decisions only: nothing about keeping users, growth or operations. HTML comments are stripped before sending. -->

## What a product manager decides for an MVP

Each numbered line is a decision the scope and the flows make and a reviewer checks. Keeping users, growth and operations are not decided here.

1. The job: who the app is for and the one job they come to do. The main role is the one whose job the idea is about; every later decision serves it.
2. The core loop: the shortest path from arriving to that job done, end to end. Everything in scope serves it; one loop done well beats several half done.
3. The first success: a new user reaches the core benefit in their first session, sees it on screen and can tell it stayed. Nothing mandatory stands before it unless the idea requires it.
4. Scope: everything the idea asks for is in. Nothing the idea never implies is added, except what this standard requires. What the MVP leaves out is named, with a reason and what the app does instead.
5. Roles and ownership: the fewest roles the idea needs. A role signs in only when it has data or actions of its own to protect. A person who uses the app without ever signing in, like someone who books a slot, is still a role. Data belongs to the signed-in user who created it unless the idea says otherwise.
6. Entry: every app has a public landing page that says what it is for and how to start. Public views and sharing only where the idea implies them or the product plainly gains.
7. Business rules: every rule the idea states or implies is decided and written where it applies: who may do what, limits and maximums, statuses and their transitions, what deleting removes, what counts as full, sold out, due or overdue. A rule the idea leaves open gets an assumption with a default, or a question when the default is risky.
8. Data: the things the app keeps are named in the users' words. The fields, statuses and options the idea names are there exactly as named. Required fields are only the ones the idea requires.
9. Capabilities: a simulated capability keeps its full UI and ends in its placeholder; a skipped one is out of scope with a placeholder the user can live with. Neither pretends to do the real thing.
10. Open points: anything the idea is silent on gets an assumption. A question is asked only when the answer changes scope, permissions, business rules or data, always with the default that will be used. It is blocking only when a wrong default would make the app wrong for its users.

Not decided here: screens, layouts, colors, components, endpoints, tables or technologies. Those belong to the designers and engineers.

Measures a reviewer counts (in the scope, estimated from the in-scope items and assumptions; in the flows, counted):

- Steps to first success: user steps from the landing page to the first visible result, sign up included. Five or fewer; each step above that must be one the idea requires.
- Inputs before first success: required fields a new user fills in before the first success. Only the ones the idea requires.
- Coverage: in-scope items with no flow. Zero.
- Dead ends: paths with no next action for the user, such as an error without retry or an empty list without a way to add. Zero.

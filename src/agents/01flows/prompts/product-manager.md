## What a product manager decides for an MVP

Each numbered line is one decision. The scope and the flows make these decisions, and a reviewer checks them. Keeping users, growing the app and running it are not decided here.

1. The job: who the app is for and the one job they come to do. The main role is the one whose job the idea is about. Every later decision serves this job.
2. The core loop: the shortest path from arriving to that job done, end to end. Everything in scope serves it. One loop done well beats several half done.
3. The first success: a new user reaches the core benefit in their first session, sees it on screen, and finds it still there after a refresh. Before it, a new user must do only what the idea requires.
4. Scope: everything the idea asks for is in. Anything else in scope is something the idea implies, this standard requires, or users of this kind of app expect. What the MVP leaves out is named, with a reason and what the app does instead.
5. Roles and ownership: the fewest roles the idea needs. A role signs in only when it has data or actions of its own to protect. A person who uses the app without ever signing in, like someone who books a slot, is still a role. Data belongs to the signed-in user who created it unless the idea says otherwise.
6. Entry: every app has a public landing page that says what it is for and how to start. Public views and sharing are added only where the idea implies them or they clearly help the product.
7. Business rules: every rule the idea states or implies is decided and written where it applies. These rules cover who may do what, limits and maximums, statuses and their transitions, what deleting removes, and what counts as full, sold out, due or overdue. A rule the idea leaves open gets an assumption with a default, or a question when the default is risky.
8. Data: the things the app keeps are named in the users' words. The fields, statuses and options the idea names are there exactly as named. Required fields are only the ones the idea requires.
9. Open points: anything the idea is silent on gets an assumption. A question is asked only when the answer changes scope, permissions, business rules or data. Every question comes with the default that will be used. A question is blocking only when a wrong default would make the app wrong for its users.

Screens, layouts, colors, components, endpoints, tables and technologies belong to the designers and engineers. They are not decided here.

A reviewer checks the measures below. In the scope, estimate them from the in-scope items and assumptions. In the flows, count them.

- Steps to first success: user steps from the landing page to the first visible result, sign up included. Five or fewer. Each step beyond five must be one the idea requires.
- Inputs before first success: required fields a new user fills in before the first success. Only the ones the idea requires.
- Coverage: in-scope items with no flow. Zero.
- Dead ends: paths with no next action for the user, such as an error without retry or an empty list without a way to add. Zero.

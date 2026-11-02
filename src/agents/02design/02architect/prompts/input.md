<!-- User message of the architect call. Placeholders: scope, flows, brief, layouts. -->

# Scope (01-flows/01-scope.json)

{{scope}}

# Flows (01-flows/03-expand.json)

{{flows}}

# Brief (from 02-design/01-theme.json)

{{brief}}

# Page layouts (from 02-design/01-theme.json)

{{layouts}}

# Your job in this call

Write the frames, the screens and the dialogs of this app. Walk every flow from its first step to its outcome, and give each step a place: a step on a screen, or a step in a dialog. Then add what no flow covers but every user needs on that page: its title, the way back, and what it shows when there is nothing yet.

Before you answer, check:

- Every step of every flow has a place, and every flow id is in some screen's or dialog's `flows`.
- Every role that signs in has a screen it lands on after signing in, and its frame leads to every screen it uses often.
- Every list has an empty alternative with the action that fills it, and every record's screen has an alternative for a record that is gone.
- Every dialog is opened by a step of each screen in its `openedFrom`.

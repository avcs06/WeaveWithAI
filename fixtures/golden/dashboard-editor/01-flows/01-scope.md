# Tidyboards: scope

For people who keep little bits of personal info scattered around, Tidyboards gives them tidy personal dashboards. They create a dashboard, add note, counter, checklist, and link-list widgets, then configure, arrange, and resize them. Changes save automatically so the dashboard is ready on every visit.

Audience: People who want a small personal dashboard for notes, counts, tasks, and links

## Roles
- Visitor (visitor, no sign-in): Person learning what Tidyboards is; can start sign up from the landing page but has no dashboards
- Member (member, signs in): Owner of personal dashboards; creates and manages dashboards and all widgets inside them

## Vocabulary
- Dashboard (owned by Member): Named container for widgets; has name and last-edited time, can be renamed, duplicated, deleted
- Widget (owned by Member): Block inside a dashboard; has title, type (note, counter, checklist, linklist), size small/medium/large, position, and type-specific settings and content
- ChecklistItem (owned by Member): Single row inside a checklist widget; has text and ticked or unticked state
- LinkEntry (owned by Member): Single row inside a link-list widget; has title and web address

## Capabilities
- accounts: Email/password sign up, sign in, sign out for dashboard owners
- userOwnedData: Each user sees and edits only their own dashboards and widgets
- crud: Create, list, view, rename, duplicate, delete dashboards and widgets
- roles: Visitor for landing page plus signed-in member
- publicPages: Public landing page explaining dashboards and how to start
- reorder: Change widget position relative to other widgets
- datesDeadlines: Show last-edited time on dashboard list; no deadlines

## In scope
- Public landing page that says what personal dashboards are for and how to start
- Sign up, sign in, sign out; each user sees only their own dashboards
- Create, list with last-edited time, rename, duplicate, and delete dashboards
- Editor that saves all dashboard and widget changes automatically
- Add note, counter, checklist, and link-list widgets with a title and type-specific settings
- Rename, reposition relative to other widgets, resize to small/medium/large, and remove widgets
- Use widgets: edit note text; set counter label and increase/decrease value; add and tick checklist items; add titles/addresses and open links

## Assumptions
- A01 (data): New dashboards start named 'Untitled dashboard' and can be renamed to any non-empty name.
- A02 (behavior): Duplicating a dashboard copies its name as 'Copy of {name}' plus all widgets, settings, and content.
- A03 (behavior): Deleting a dashboard permanently removes it and all its widgets, items, and links with no trash or undo.
- A04 (behavior): Widgets live in a single ordered list per dashboard; reposition means move earlier/later in that order and visual placement is up to design.
- A05 (behavior): New widgets default to medium size; size can only be small, medium, or large.
- A06 (data): Counter widget has a label and an integer value starting at 0; plus/minus changes it by 1 with no minimum or maximum, negatives allowed.
- A07 (data): Checklist widget holds items with non-empty text and ticked/unticked state; ticking toggles state, adding requires text.
- A08 (data): Link-list entries require a title and a web address starting with http:// or https://; selecting a link opens it in a new tab.
- A09 (behavior): Editor autosaves every create, edit, reorder, resize, and delete shortly after the change and updates the dashboard last-edited time.
- A10 (permission): Dashboards and their widgets are private to the user who created them; there is no sharing or collaboration.

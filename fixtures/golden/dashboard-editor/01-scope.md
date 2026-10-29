# TidyDash: scope

For people who want a personal at-a-glance space for small bits of info. They juggle notes, counts, to-dos and links across apps and paper. TidyDash lets them create a dashboard, add note, counter, checklist and link-list widgets, arrange and resize them, with every change saved automatically.

Audience: Individuals who want a personal space for notes, numbers, tasks and links

## Roles
- Visitor (visitor, no sign-in): Someone discovering personal dashboards; views the landing page and can sign up or sign in.
- Member (member, signs in): Signed-in owner who creates dashboards and manages their own widgets.

## Vocabulary
- Dashboard (owned by Member): Named collection of widgets with last-edited time.
- Widget (owned by Member): Block inside a dashboard with title, type (note, counter, checklist, link list), size (small, medium, large), position and type-specific content.

## Capabilities
- accounts: Email/password sign up, sign in, sign out for dashboard owners
- userOwnedData: Each member sees only their own dashboards and widgets
- crud: Create, list, view, rename, duplicate, edit, delete dashboards and widgets
- roles: Visitor for landing page, member for private dashboards
- publicPages: Public landing page explaining dashboards and how to start
- reorder: Change widget position relative to other widgets
- datesDeadlines: Show when each dashboard was last edited, updated by autosave

## In scope
- Public landing page explaining personal dashboards and how to start
- Create a new dashboard and open it in the editor
- List of my dashboards showing name and when each was last edited
- Rename, duplicate and delete a dashboard
- Add note, counter, checklist and link-list widgets to a dashboard
- Configure each widget with a title and type settings: note plain text, counter label and number with increase/decrease, checklist items with tick and add, link titles and web addresses
- Manage widgets: rename, change position relative to others, resize between small, medium and large, and remove
- Editor saves every change automatically and updates last-edited time

## Assumptions
- A01 (scope): New dashboard created via Create starts empty with a default name like Untitled dashboard that can be renamed.
- A02 (data): Duplicate creates a full copy including all widgets and their content with name like Copy of {name}.
- A03 (behavior): Every dashboard and widget change saves automatically without a Save button and updates the dashboard last-edited time.
- A04 (behavior): Dashboard list is ordered most-recently-edited first.
- A05 (data): New widget defaults to medium size, title defaulting to its type name, appended after existing widgets.
- A06 (behavior): Counter starts at 0, increases or decreases by 1 per click, label is editable, allows negative values with no min or max.
- A07 (behavior): Checklist items can be added, ticked and unticked, edited and removed; ticked items stay visible.
- A08 (behavior): Link list stores a title plus web address; selecting a link opens it in a new browser tab; only http/https addresses are accepted.
- A09 (behavior): Deleting a dashboard permanently removes it and its widgets after confirm with no trash or undo; removing a widget deletes it immediately.
- A10 (permission): Dashboards and widgets are private to the member who created them; no sharing.
- A11 (presentation): Visual style is playful but tidy; exact on-screen placement is up to design while relative widget order is preserved.
- A12 (scope): No limit on number of dashboards per user or widgets per dashboard.

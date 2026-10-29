# TidyDash: scope

For people who want one tidy place for small personal bits. Scattered notes, counts, to-dos and links are hard to keep together. TidyDash lets them create a dashboard, add note, counter, checklist and link-list widgets, then configure, arrange and use them with automatic saving.

Audience: People building personal dashboards for notes, counts, tasks and links

## Roles
- Member (member, signs in): Builds and owns personal dashboards and widgets

## Vocabulary
- Dashboard (owned by Member): Named container for widgets; has name and last edited time
- Widget (owned by Member): Block inside a dashboard of type note, counter, checklist or link list; has title, position, size small/medium/large and type settings
- ChecklistItem (owned by Member): Single to-do inside a checklist widget; has text and ticked or unticked state
- LinkEntry (owned by Member): Single entry inside a link list widget; has title and web address

## Capabilities
- accounts: Email and password sign up, sign in, sign out for dashboard owners
- userOwnedData: Each user sees only their own dashboards and widgets
- crud: Create, list, rename, duplicate, delete dashboards; add, rename, configure, remove widgets and their items
- reorder: Change widget position relative to other widgets; new widgets append at end
- datesDeadlines: Show when each dashboard was last edited
- publicPages: Public landing page explaining personal dashboards and how to start

## In scope
- Public landing page that says what personal dashboards are for and how to start
- Create dashboards; list shows all of my dashboards with when each was last edited
- Rename, duplicate and delete dashboards; dashboards are private to their owner
- Open a dashboard in an editor that saves changes automatically
- Add note, counter, checklist and link list widgets and configure title plus type settings
- Rename widget, change its position relative to other widgets, resize between small, medium and large, and remove it
- Use widgets in place: edit note text, increase or decrease counter with label, tick off and add checklist items, add titles with web addresses and open links

## Assumptions
- A01 (behavior): New dashboards start empty with the name Untitled dashboard which can be renamed immediately.
- A02 (behavior): Duplicating a dashboard creates a full copy named Copy of {name} with copies of all its widgets and sets last edited to now.
- A03 (behavior): Deleting a dashboard permanently removes it and all its widgets after a confirm, with no trash or undo; removing a widget permanently removes its items.
- A04 (behavior): New widgets are appended at the end in medium size with sensible defaults: empty note text, counter 0 with empty label, empty checklist, empty link list.
- A05 (behavior): Counter value starts at 0, increases or decreases by 1 per tap, allows negative values, with no min or max.
- A06 (data): Checklist items have text and ticked state, start unticked, require text to add.
- A07 (data): Link entries require a title and a web address; addresses starting without http(s) get https prepended and open in a new tab.
- A08 (permission): Dashboards and widgets are private to the user who created them; there is no sharing.
- A09 (behavior): Any dashboard or widget change updates last edited to now and autosaves immediately with a saved indicator; refresh restores the saved state.
- A10 (presentation): Widget order is a relative list order; exact on-screen placement is up to the design.

## Questions
- Q01: Should there be limits on number of dashboards or widgets per dashboard? Why: Determines whether validation and limit messaging are in scope Default: No limits in MVP
- Q02: Should deleted dashboards or widgets be recoverable from trash? Why: Changes data retention and UI scope Default: No, delete is permanent with confirm

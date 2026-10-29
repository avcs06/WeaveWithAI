# TidyDash: flows catalog

## Flows
- F01 View landing page and get started (Member, browse): A visitor arrives on the public landing page, reads what personal dashboards are for with examples of notes, counters, checklists and link lists, sees how to start by creating a dashboard and adding widgets, and chooses to sign up or sign in to begin.
- F02 Sign up (Member, auth): A new visitor chooses to sign up from the landing page, provides email and password, submits, and the website creates the account, signs them in and takes them to their dashboard list which is empty on first use.
- F03 Sign in (Member, auth): A returning member chooses to sign in, enters email and password, submits, and the website verifies the credentials and shows their existing dashboards with last-edited times.
- F04 Sign out (Member, auth): A signed-in member chooses to sign out, the website ends the session and returns them to the public landing page, hiding all private dashboards.
- F05 View dashboard list (Member, browse): A signed-in member opens their dashboard list and the website shows every dashboard they own with its name and last-edited time, most recently edited first, with options to create, open, rename, duplicate or delete.
- F06 Create dashboard (Member, core): A signed-in member chooses Create from the dashboard list, the website immediately creates and saves an empty dashboard named Untitled dashboard, updates its last-edited time to now, and shows it in the list and opens it in the editor for renaming and adding widgets.
- F07 Rename dashboard (Member, manage): A member chooses to rename a dashboard from the list or editor, edits its name, saves, and the website updates the name, refreshes last-edited to now with autosave confirmation, and shows the new name everywhere.
- F08 Duplicate dashboard (Member, manage): A member chooses Duplicate on a dashboard, the website creates a full copy including all widgets and their contents named Copy of {name}, sets its last-edited to now, and shows it alongside the original in the list.
- F09 Delete dashboard (Member, manage): A member chooses Delete on a dashboard, confirms the permanent removal, and the website deletes the dashboard with all its widgets and items and shows the updated list without it.
- F10 Open dashboard in editor (Member, core): A member opens a dashboard from the list, the website shows the editor with the dashboard name and all its widgets in order with their titles, sizes and contents, indicates that changes save automatically, and keeps the saved state on refresh.
- F11 Add widget (Member, core): A member in the editor chooses to add a widget, picks its type among note, counter, checklist and link list, sets its title, and the website appends it at the end in medium size with type defaults, updates last-edited to now with a saved indicator, and shows it ready to configure and use.
- F12 Rename, move and resize widget (Member, manage): A member selects a widget in the editor, changes its title, moves it earlier or later relative to other widgets, switches its size between small, medium and large, and the website saves each change automatically, updates last-edited to now, and shows the widget with its new title, position and size.
- F13 Remove widget (Member, manage): A member chooses to remove a widget in the editor, confirms the permanent removal, and the website deletes the widget with its checklist items or link entries, updates last-edited to now, and shows the remaining widgets in order.
- F14 Use note widget (Member, core): A member edits the plain text inside a note widget, the website autosaves the text immediately, updates the dashboard last-edited to now with a saved indicator, and shows the updated text in place.
- F15 Use counter widget (Member, core): A member edits the counter label and taps increase or decrease to change the value by one, including into negatives, and the website saves each change automatically, updates last-edited to now, and shows the current label and number in place.
- F16 Use checklist widget (Member, core): A member adds new items with text to a checklist widget and ticks or unticks existing items, the website saves each addition and tick change immediately, updates last-edited to now, and shows the updated list with ticked states.
- F17 Use link list widget (Member, core): A member adds entries with a title and web address to a link list widget, the website validates and saves them with https prepended when needed, updates last-edited to now, shows the entries in place, and opens the address in a new tab when the member chooses a link.

## Fields
- FD01 Email (required, up to 254 characters), e.g. "sam@example.com". Account identifier used to sign in and own dashboards
- FD02 Password (required, at least 8 characters), e.g. "tidy-morning-42". Secret that protects the member's dashboards
- FD03 Dashboard name (required, 1 to 100 characters), e.g. "Morning routine". How the member refers to the dashboard in the list and editor
- FD04 Widget title (required, 1 to 80 characters), e.g. "Water intake". How the member refers to the widget inside the dashboard
- FD05 Widget type (required, one of: note, counter, checklist, link list), e.g. "checklist". What kind of content the widget holds
- FD06 Widget size (required, one of: small, medium, large), e.g. "medium". How large the widget appears relative to other widgets
- FD07 Note text (optional, up to 5000 characters), e.g. "Call dentist on Tuesday". Plain text kept in a note widget
- FD08 Counter label (optional, up to 80 characters), e.g. "Glasses of water". What the counter number counts
- FD09 Checklist item text (required, 1 to 200 characters), e.g. "Buy milk". Text of a single to-do inside a checklist widget
- FD10 Link title (required, 1 to 120 characters), e.g. "Favorite recipe". How the member refers to a saved web address
- FD11 Link address (required), e.g. "https://example.com/recipe". Web address that opens in a new tab when chosen

## Forms
- FM01 Account credentials: FD01, FD02
- FM02 Widget title and size: FD04, FD06

## STD01 Confirm deletion (standard subflow)

1. (system) The website asks to confirm the deletion and says what else will be removed with it.

Other paths
- STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
- STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.

## New assumptions
- A11 (behavior, affects F05): Dashboards in the list are ordered most recently edited first.
- A12 (behavior, affects F12): Moving a widget beyond the start or end keeps it in place; move controls for unavailable directions are disabled.

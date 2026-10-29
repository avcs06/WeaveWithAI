# TidyDash: user flows

## F01 View landing page and get started
Member · browse · Goal: Understand what personal dashboards are for and start using TidyDash.
Before: Not signed in.

1. The visitor opens the landing page. The website shows what personal dashboards are for with examples of notes, counters, checklists and link lists, how to start by creating a dashboard and adding widgets, and options to sign up or sign in.
2. The visitor chooses to sign up or sign in to begin. The website shows the sign-up or sign-in form to begin.

Outcome: The visitor understands TidyDash and has a path to sign up or sign in; nothing is stored and refresh shows the same landing page.

## F02 Sign up
Member · auth · Goal: Create a new account to own private dashboards.
Before: Not signed in.

1. The visitor chooses to sign up. The website shows an empty account credentials form with an option to submit.
2. The visitor fills in the credentials and submits. (Account credentials)
   - Email (required, up to 254 characters), e.g. "sam@example.com"
   - Password (required, at least 8 characters), e.g. "tidy-morning-42"
   The website creates the account, signs the member in and shows their dashboard list.
   Changes: lists Dashboard.

Other paths
- F02.A01 (from 2, invalid) The email or password is missing or invalid: The website marks what is wrong and keeps what was typed. Back to 2.
- F02.A02 (from 2, failure) Creating the account fails: The website keeps the values and offers to retry. Back to 2.
- F02.A03 (from 2, empty) The new member has no dashboards yet: The website shows an empty dashboard list with an option to create a dashboard. Flow ends.

Outcome: A new account is created and the member is signed in; refresh still shows them signed in on their dashboard list.

## F03 Sign in
Member · auth · Goal: Sign back in to access my dashboards.
Before: Not signed in.; An account already exists.

1. The returning member chooses to sign in. The website shows an empty account credentials form with an option to submit.
2. The member fills in the credentials and submits. (Account credentials)
   - Email (required, up to 254 characters), e.g. "sam@example.com"
   - Password (required, at least 8 characters), e.g. "tidy-morning-42"
   The website verifies the credentials and shows the member's dashboards with name and last-edited time.
   Changes: lists Dashboard.

Other paths
- F03.A01 (from 2, invalid) The email or password is missing or invalid: The website marks what is wrong and keeps what was typed. Back to 2.
- F03.A02 (from 2, failure) Signing in fails: The website keeps the values and offers to retry. Back to 2.
- F03.A03 (from 2, empty) The member has no dashboards yet: The website shows an empty dashboard list with an option to create a dashboard. Flow ends.

Outcome: The member is signed in and sees their dashboard list; refresh keeps them signed in.

## F04 Sign out
Member · auth · Goal: End the session so my dashboards stay private.
Before: Signed in.

1. The member chooses to sign out. The website ends the session and shows the public landing page with options to sign up or sign in.

Outcome: The member is signed out; refresh shows the public landing page and dashboards are no longer visible until sign in.

## F05 View dashboard list
Member · browse · Goal: See all my dashboards and when each was last edited.
Before: Signed in.

1. The member opens the dashboard list. The website shows every dashboard the member owns with its name and last-edited time, most recently edited first, with options to create, open, rename, duplicate or delete.
   Changes: lists Dashboard.

Other paths
- F05.A01 (from 1, empty) The member has no dashboards yet: The website shows an empty list with an option to create a dashboard. Flow ends.

Outcome: No data changes; refresh still shows the same list of the member's dashboards ordered by last edited.

## F06 Create dashboard
Member · core · Goal: Start a new empty dashboard to fill with widgets.
Before: Signed in.

1. The member chooses Create from the dashboard list. The website creates and saves an empty dashboard named Untitled dashboard with last-edited set to now and opens it in the editor ready for renaming and adding widgets.
   Changes: creates Dashboard.

Other paths
- F06.A01 (from 1, failure) Creating the dashboard fails: The website keeps the list as it was and offers to retry. Back to 1.

Outcome: A new dashboard named Untitled dashboard is saved and appears in the list; refresh still shows it and opening it shows an empty editor.

## F07 Rename dashboard
Member · manage · Goal: Give a dashboard a meaningful name.
Before: Signed in.; At least one dashboard exists.

1. The member chooses to rename a dashboard from the list or editor. The website shows the current dashboard name ready to edit.
   Changes: reads Dashboard.
2. The member edits the name and saves it.
   - Dashboard name (required, 1 to 100 characters), e.g. "Morning routine"
   The website updates the name, sets last-edited to now with a saved indicator, and shows the new name in the list and editor.
   Changes: updates Dashboard.

Other paths
- F07.A01 (from 2, invalid) The name is empty: The website marks the name as required and keeps what was typed. Back to 2.
- F07.A02 (from 2, failure) Saving the new name fails: The website keeps the typed name and offers to retry. Back to 2.
- F07.A03 (from 1, notFound) The dashboard is gone: The website says the dashboard is gone and shows the dashboard list. Flow ends.

Outcome: The dashboard's name is updated and its last-edited time is now; refresh shows the new name in the list and editor.

## F08 Duplicate dashboard
Member · manage · Goal: Make a full copy of a dashboard with all its widgets.
Before: Signed in.; At least one dashboard exists.

1. The member chooses Duplicate on a dashboard. The website creates a full copy named Copy of {name} with copies of all its widgets and contents, sets its last-edited to now, and shows it alongside the original in the list.
   Changes: creates Dashboard, creates Widget, creates ChecklistItem, creates LinkEntry.

Other paths
- F08.A01 (from 1, notFound) The dashboard is gone: The website says the dashboard is gone and shows the dashboard list. Flow ends.
- F08.A02 (from 1, failure) Duplicating the dashboard fails: The website keeps the list as it was and offers to retry. Back to 1.

Outcome: A copy named Copy of {name} with copies of all widgets is saved; refresh shows both original and copy in the list.

## F09 Delete dashboard
Member · manage · Goal: Permanently remove a dashboard I no longer need.
Before: Signed in.; At least one dashboard exists.

1. The member opens the dashboard list. The website shows all of the member's dashboards with name and last-edited time ordered most recently edited first.
   Changes: lists Dashboard.
2. The member chooses Delete on a dashboard. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Dashboard, deletes Widget, deletes ChecklistItem, deletes LinkEntry.

Other paths
- F09.A01 (from 1, empty) The member has no dashboards: The website shows that there are no dashboards yet and offers to create one. Flow ends.
- F09.A02 (from 2, confirm) The member confirms the deletion: The website deletes the dashboard with all its widgets and items and shows the dashboard list without it. Flow ends.
- F09.A03 (from 2, cancel) The member cancels the deletion: Nothing is deleted; the website shows the dashboard list as it was. Flow ends.
- F09.A04 (from 2, notFound) The dashboard was already gone: The website says the dashboard is gone and shows the dashboard list. Flow ends.

Outcome: The dashboard and all its widgets are permanently gone; refresh still shows the list without it.

## F10 Open dashboard in editor
Member · core · Goal: Open a dashboard to view and change its widgets with automatic saving.
Before: Signed in.; At least one dashboard exists.

1. The member opens the dashboard list. The website shows all of the member's dashboards with name and last-edited time ordered most recently edited first.
   Changes: lists Dashboard.
2. The member opens a dashboard. The website shows the editor with the dashboard name, all its widgets in order with titles, sizes and contents, and a saved indicator showing changes save automatically.
   Changes: reads Dashboard, lists Widget.

Other paths
- F10.A01 (from 1, empty) The member has no dashboards: The website shows that there are no dashboards yet and offers to create one. Flow ends.
- F10.A02 (from 2, empty) The dashboard has no widgets yet: The website shows the empty editor with the dashboard name, saved indicator and an offer to add a widget. Flow ends.
- F10.A03 (from 2, notFound) The dashboard was deleted in the meantime: The website says the dashboard is gone and shows the dashboard list. Flow ends.

Outcome: No data changes by opening alone; refresh still shows the same dashboard with its saved widgets and a saved indicator.

## F11 Add widget
Member · core · Goal: Add a note, counter, checklist or link-list widget to a dashboard.
Before: Signed in.; A dashboard is open in the editor.

1. The member chooses to add a widget. The website shows the widget type choices note, counter, checklist and link list with a title field.
2. The member picks a widget type, enters a title and saves it.
   - Widget type (required, one of: note, counter, checklist, link list), e.g. "checklist"
   - Widget title (required, 1 to 80 characters), e.g. "Water intake"
   The website appends the widget at the end in medium size with type defaults, updates last-edited to now and shows the widget ready to configure and use with a saved indicator.
   Changes: creates Widget, updates Dashboard.

Other paths
- F11.A01 (from 2, invalid) The widget title is empty: The website marks the title field and keeps what was typed. Back to 2.
- F11.A02 (from 2, failure) Saving fails: The website keeps the entered values and offers to retry. Back to 2.
- F11.A03 (from 2, cancel) The member cancels adding the widget: Nothing is saved; the website shows the editor as it was. Flow ends.

Outcome: A new widget of the chosen type is appended at the end in medium size with defaults and last-edited is now; refresh shows it in place.

## F12 Rename, move and resize widget
Member · manage · Goal: Arrange widgets by renaming, reordering and resizing them.
Before: Signed in.; A dashboard with at least one widget is open.

1. The member opens the dashboard editor. The website shows the dashboard name with all its widgets in order with titles, sizes and contents and a saved indicator.
   Changes: reads Dashboard, lists Widget.
2. The member edits a widget title and saves it.
   - Widget title (required, 1 to 80 characters), e.g. "Water intake"
   The website saves the new title, updates last-edited to now and shows the widget with the new title and a saved indicator.
   Changes: updates Widget, updates Dashboard.
3. The member moves a widget earlier or later relative to other widgets. The website saves the new order, updates last-edited to now and shows the widget in its new place; move choices for unavailable directions are disabled.
   Changes: updates Widget, updates Dashboard.
4. The member changes a widget size between small, medium and large.
   - Widget size (required, one of: small, medium, large), e.g. "medium"
   The website saves the new size, updates last-edited to now and shows the widget with the new size and a saved indicator.
   Changes: updates Widget, updates Dashboard.

Other paths
- F12.A01 (from 1, empty) The dashboard has no widgets: The website shows the empty editor and offers to add a widget. Flow ends.
- F12.A02 (from 2, invalid) The widget title is empty: The website marks the title field and keeps what was typed. Back to 2.
- F12.A03 (from 2, failure) Saving the title fails: The website keeps the entered title and offers to retry. Back to 2.
- F12.A04 (from 4, invalid) No size is selected: The website marks the size choice and keeps the widget unchanged. Back to 4.
- F12.A05 (from 4, failure) Saving the size fails: The website keeps the previous size and offers to retry. Back to 4.
- F12.A06 (from 2, notFound) The widget was removed in the meantime: The website says the widget is gone and shows the remaining widgets. Flow ends.

Outcome: Widget title, order and size are updated and last-edited is now; refresh shows the widget in its new place with new title and size.

## F13 Remove widget
Member · manage · Goal: Permanently remove a widget I no longer need.
Before: Signed in.; A dashboard with at least one widget is open.

1. The member opens the dashboard editor. The website shows the dashboard with its widgets in order.
   Changes: reads Dashboard, lists Widget.
2. The member chooses Remove on a widget. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Widget, deletes ChecklistItem, deletes LinkEntry, updates Dashboard.

Other paths
- F13.A01 (from 1, empty) The dashboard has no widgets: The website shows the empty editor and offers to add a widget. Flow ends.
- F13.A02 (from 2, confirm) The member confirms the removal: The website deletes the widget with its items, updates last-edited to now and shows the remaining widgets in order. Flow ends.
- F13.A03 (from 2, cancel) The member cancels the removal: Nothing is deleted; the website shows the dashboard as it was. Flow ends.
- F13.A04 (from 2, notFound) The widget was already gone: The website says the widget is gone and shows the dashboard with remaining widgets. Flow ends.

Outcome: The widget and its items are permanently gone and last-edited is now; refresh shows the dashboard without it.

## F14 Use note widget
Member · core · Goal: Keep plain text in a note widget.
Before: Signed in.; A dashboard with a note widget is open.

1. The member opens a dashboard with a note widget. The website shows the editor with the note widget and its saved text and a saved indicator.
   Changes: reads Dashboard, reads Widget.
2. The member edits the note text.
   - Note text (optional, up to 5000 characters), e.g. "Call dentist on Tuesday"
   The website autosaves the text immediately, updates last-edited to now and shows the updated text with a saved indicator.
   Changes: updates Widget, updates Dashboard.

Other paths
- F14.A01 (from 2, invalid) The text is longer than 5000 characters: The website marks the text and keeps what was typed. Back to 2.
- F14.A02 (from 2, failure) Autosaving fails: The website keeps the typed text and offers to retry. Back to 2.
- F14.A03 (from 1, notFound) The note widget or dashboard was deleted in the meantime: The website says it is gone and shows the dashboard list. Flow ends.

Outcome: Note text is saved and last-edited is now; refresh shows the same text in the note widget.

## F15 Use counter widget
Member · core · Goal: Track a count with a label using increase and decrease.
Before: Signed in.; A dashboard with a counter widget is open.

1. The member opens a dashboard with a counter widget. The website shows the editor with the counter widget label and value and a saved indicator.
   Changes: reads Dashboard, reads Widget.
2. The member edits the counter label.
   - Counter label (optional, up to 80 characters), e.g. "Glasses of water"
   The website autosaves the label, updates last-edited to now and shows the updated label with a saved indicator.
   Changes: updates Widget, updates Dashboard.
3. The member chooses increase or decrease on the counter. The website changes the value by one, allows negative values, saves immediately, updates last-edited to now and shows the new number with a saved indicator.
   Changes: updates Widget, updates Dashboard.

Other paths
- F15.A01 (from 2, invalid) The label is longer than 80 characters: The website marks the label field and keeps what was typed. Back to 2.
- F15.A02 (from 2, failure) Saving the label fails: The website keeps the typed label and offers to retry. Back to 2.
- F15.A03 (from 1, notFound) The counter widget or dashboard was deleted in the meantime: The website says it is gone and shows the dashboard list. Flow ends.
- F15.A04 (from 3, failure) Saving the new value fails: The website keeps the previous value and offers to retry. Back to 3.

Outcome: Counter label and value are saved and last-edited is now; refresh shows the same label and value.

## F16 Use checklist widget
Member · core · Goal: Track to-dos by adding items and ticking them off.
Before: Signed in.; A dashboard with a checklist widget is open.

1. The member opens a dashboard with a checklist widget. The website shows the editor with the checklist widget and its items with ticked states and a saved indicator.
   Changes: reads Dashboard, reads Widget, lists ChecklistItem.
2. The member enters item text and adds it to the checklist.
   - Checklist item text (required, 1 to 200 characters), e.g. "Buy milk"
   The website saves the new unticked item, updates last-edited to now and shows it with the other items and a saved indicator.
   Changes: creates ChecklistItem, updates Dashboard.
3. The member ticks or unticks a checklist item. The website saves the new ticked state immediately, updates last-edited to now and shows the updated tick.
   Changes: updates ChecklistItem, updates Dashboard.

Other paths
- F16.A01 (from 1, empty) The checklist has no items yet: The website shows the checklist widget with no items and an offer to add one. Back to 2.
- F16.A02 (from 2, invalid) The item text is empty: The website marks the item field and keeps what was typed. Back to 2.
- F16.A03 (from 2, failure) Saving the item fails: The website keeps the typed text and offers to retry. Back to 2.
- F16.A04 (from 3, notFound) The item was already gone: The website says the item is gone and shows the remaining items. Flow ends.
- F16.A05 (from 3, failure) Saving the tick change fails: The website keeps the previous tick state and offers to retry. Back to 3.

Outcome: Checklist items and their ticked states are saved and last-edited is now; refresh shows the same items with the same ticks.

## F17 Use link list widget
Member · core · Goal: Keep titles with web addresses and open them.
Before: Signed in.; A dashboard with a link list widget is open.

1. The member views the link list widget in the open dashboard. The website shows the widget title and all its saved link entries with their titles and addresses, with a saved indicator and last-edited time for the dashboard.
   Changes: lists LinkEntry.
2. The member enters a link title and web address and saves the new entry.
   - Link title (required, 1 to 120 characters), e.g. "Favorite recipe"
   - Link address (required), e.g. "https://example.com/recipe"
   The website saves the entry, prepending https when the address starts without http(s), shows it with the other entries, and updates last-edited to now with a saved indicator.
   Changes: creates LinkEntry, updates Dashboard.
3. The member chooses a link entry to open. The website opens its web address in a new tab and keeps the dashboard unchanged.
   Changes: reads LinkEntry.

Other paths
- F17.A01 (from 1, empty) No link entries are saved in the widget yet: The website shows the link list widget with no entries and invites adding the first title and web address. Back to 2.
- F17.A02 (from 2, invalid) The title is empty or the web address is missing or not a valid web address: The website marks what is wrong and keeps what was typed. Back to 2.
- F17.A03 (from 2, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 2.
- F17.A04 (from 3, notFound) The chosen link entry was removed in the meantime: The website says the link entry is gone and shows the remaining entries. Back to 1.

Outcome: Link entries are saved and last-edited is now; refresh shows the same entries and choosing one opens its address in a new tab.

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

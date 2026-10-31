# Tidyboards: user flows

## F01 Discover Tidyboards on landing page
Visitor · browse · Goal: Understand what Tidyboards does and start using it.
Before: Not signed in.

1. The visitor opens the landing page. The website shows what tidy personal dashboards are for, how creating a dashboard and adding note, counter, checklist and link-list widgets works, with examples, and offers paths to sign up and sign in.
2. The visitor chooses to get started. The website shows the sign-up form to create an account.

Outcome: Visitor understands dashboards and starts sign-up; nothing is stored and a refresh shows the same landing page.

## F02 Sign up as member
Member · auth · Goal: Create an account to own dashboards.
Before: Not signed in.

1. The member chooses to sign up. The website shows an empty sign-up form asking for email and password.
2. The member fills in email and password and submits. (Account credentials)
   - Email (required, up to 254 characters), e.g. "sam@example.com"
   - Password (required, 8 to 128 characters), e.g. "Sunny-day-42"
   The website creates the account, signs the member in, and shows the member's dashboard list.
   Changes: lists Dashboard.

Other paths
- F02.A01 (from 2, invalid) The email is badly formed or the password is shorter than required: The website marks what is wrong and keeps what was typed. Back to 2.
- F02.A02 (from 2, failure) Creating the account fails: The website keeps the typed values and offers to retry. Back to 2.
- F02.A03 (from 2, empty) The member has no dashboards yet: The website invites the member to create the first dashboard. Flow ends.

Outcome: Account exists and member is signed in; a refresh still shows the signed-in dashboard list.

## F03 Sign in as member
Member · auth · Goal: Sign in to access my dashboards.
Before: Not signed in.

1. The member chooses to sign in. The website shows an empty sign-in form asking for email and password.
2. The member fills in email and password and submits. (Account credentials)
   - Email (required, up to 254 characters), e.g. "sam@example.com"
   - Password (required, 8 to 128 characters), e.g. "Sunny-day-42"
   The website verifies the credentials and shows the member's own dashboard list with names and last-edited times.
   Changes: lists Dashboard.

Other paths
- F03.A01 (from 2, invalid) The email or password is empty or badly formed: The website marks what is wrong and keeps what was typed. Back to 2.
- F03.A02 (from 2, failure) Signing in fails for a system reason: The website keeps the typed values and offers to retry. Back to 2.
- F03.A03 (from 2, other) The email is unknown or the password does not match: The website says the credentials do not match, keeps the typed email, and offers to try again. Back to 2.
- F03.A04 (from 2, empty) The member has no dashboards yet: The website invites the member to create the first dashboard. Flow ends.

Outcome: Member is signed in and sees own dashboards; a refresh still shows the signed-in list.

## F04 Sign out
Member · auth · Goal: Leave the account safely on this device.
Before: Signed in.

1. The member chooses to sign out. The website ends the session and shows the public landing page, hiding all private dashboards.

Outcome: Member is signed out; a refresh shows the landing page and no dashboards.

## F05 Create a dashboard
Member · core · Goal: Start a new dashboard to fill with widgets.
Before: Signed in.

1. The member opens the dashboard list. The website shows the member's own dashboards with name and last-edited time ordered most-recently-edited first.
   Changes: lists Dashboard.
2. The member chooses to create a dashboard. The website creates a dashboard named Untitled dashboard, sets its last-edited time, and opens it in the editor ready for widgets.
   Changes: creates Dashboard.

Other paths
- F05.A01 (from 1, empty) The member has no dashboards yet: The website invites the member to create the first dashboard. Back to 2.
- F05.A02 (from 2, failure) Creating the dashboard fails: The website keeps the list as it was and offers to retry creating. Back to 2.

Outcome: New Untitled dashboard exists and is open in the editor; a refresh still shows it in the list and editor.

## F06 View dashboard list
Member · browse · Goal: Find a dashboard to open.
Before: Signed in.

1. The member opens the dashboard list. The website shows all of the member's own dashboards with name and last-edited time ordered most-recently-edited first, with a way to open any dashboard.
   Changes: lists Dashboard.

Other paths
- F06.A01 (from 1, empty) The member has no dashboards yet: The website invites the member to create the first dashboard. Flow ends.

Outcome: Member's own dashboards with last-edited times are visible; a refresh shows the same list.

## F07 Open dashboard in editor
Member · core · Goal: Open a dashboard to view and change it.
Before: Signed in.; At least one dashboard exists.

1. The member opens the dashboard list. The website shows the member's dashboards with names and last-edited times.
   Changes: lists Dashboard.
2. The member selects a dashboard from the list. The website opens that dashboard in the editor showing its title and all its widgets with their content, ready to view and change with autosave.
   Changes: reads Dashboard, lists Widget.

Other paths
- F07.A01 (from 1, empty) The member has no dashboards: The website invites the member to create the first dashboard. Flow ends.
- F07.A02 (from 2, notFound) The chosen dashboard was deleted in the meantime: The website says the dashboard is gone and shows the dashboard list. Flow ends.
- F07.A03 (from 2, empty) The dashboard has no widgets yet: The website shows the dashboard title with no widgets and invites the member to add the first widget. Flow ends.

Outcome: Chosen dashboard and its widgets are shown in the editor; a refresh shows the same content.

## F08 Rename dashboard
Member · manage · Goal: Give a dashboard a meaningful name.
Before: Signed in.; At least one dashboard exists.

1. The member opens a dashboard to rename it. The website shows the dashboard with its current name ready to rename.
   Changes: reads Dashboard.
2. The member edits the dashboard name and saves it.
   - Dashboard name (required, 1 to 100 characters), e.g. "Morning focus"
   The website saves the new name, updates the last-edited time, and shows the new name in the list and editor.
   Changes: updates Dashboard.

Other paths
- F08.A01 (from 1, notFound) The dashboard was deleted in the meantime: The website says the dashboard is gone and shows the dashboard list. Flow ends.
- F08.A02 (from 2, invalid) The new name is empty: The website marks the name as needing a value and keeps what was typed. Back to 2.
- F08.A03 (from 2, failure) Saving the new name fails: The website keeps the typed name and offers to retry. Back to 2.

Outcome: Dashboard name is updated and last-edited is refreshed; a refresh shows the new name.

## F09 Duplicate dashboard
Member · manage · Goal: Copy a dashboard with its widgets to reuse it.
Before: Signed in.; At least one dashboard exists.

1. The member opens the dashboard list. The website shows the member's own dashboards with name and last-edited time ordered most-recently-edited first.
   Changes: lists Dashboard.
2. The member chooses Duplicate on a dashboard. The website creates a copy named Copy of {name} with all widgets, settings and content copied, updates its last-edited time, and shows it alongside the original.
   Changes: creates Dashboard, creates Widget, creates ChecklistItem, creates LinkEntry.

Other paths
- F09.A01 (from 1, empty) The member has no dashboards: The website invites the member to create the first dashboard and offers a way to create it. Flow ends.
- F09.A02 (from 2, notFound) The dashboard was deleted in the meantime: The website says the dashboard is gone and shows the updated list. Flow ends.
- F09.A03 (from 2, failure) Copying fails: The website keeps the list as it was and offers to retry duplicating. Back to 2.

Outcome: Copy with all widgets exists alongside the original; a refresh shows both dashboards.

## F10 Delete dashboard
Member · manage · Goal: Permanently remove a dashboard I no longer need.
Before: Signed in.; At least one dashboard exists.

1. The member opens the dashboard list. The website shows the member's own dashboards with name and last-edited time ordered most-recently-edited first.
   Changes: lists Dashboard.
2. The member chooses Delete on a dashboard. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Dashboard, deletes Widget, deletes ChecklistItem, deletes LinkEntry.

Other paths
- F10.A01 (from 1, empty) The member has no dashboards: The website invites the member to create the first dashboard and offers a way to create it. Flow ends.
- F10.A02 (from 2, confirm) The member confirms the deletion: The website permanently removes the dashboard with all its widgets, items and links and shows the updated list without it. Flow ends.
- F10.A03 (from 2, cancel) The member cancels the deletion: Nothing is deleted; the website shows the dashboard list unchanged. Flow ends.
- F10.A04 (from 2, notFound) The dashboard was already deleted: The website says the dashboard is gone and shows the updated list. Flow ends.

Outcome: Dashboard and its widgets are gone; a refresh still shows the list without it.

## F11 Add widget to dashboard
Member · core · Goal: Add a note, counter, checklist or link-list widget to a dashboard.
Before: Signed in.; A dashboard is open in the editor.

1. The member chooses to add a widget. The website shows a creation form with title and widget type choices for note, counter, checklist and link list.
2. The member fills in the title, picks a widget type and confirms.
   - Widget title (required, 1 to 100 characters), e.g. "Today's note"
   - Widget type (required, one of: note, counter, checklist, link list), e.g. "checklist"
   The website creates the medium-sized widget with default content, autosaves it, updates the dashboard last-edited time, and shows it ready to use and configure.
   Changes: creates Widget, updates Dashboard.

Other paths
- F11.A01 (from 2, invalid) The title is empty: The website marks the title field and keeps what was typed. Back to 2.
- F11.A02 (from 2, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 2.
- F11.A03 (from 1, cancel) The member cancels adding a widget: Nothing is added; the website shows the dashboard as it was. Flow ends.
- F11.A04 (from 2, notFound) The dashboard was deleted in the meantime: The website says the dashboard is gone and shows the dashboard list. Flow ends.

Outcome: New widget of the chosen type appears in the dashboard; a refresh shows it with its default content.

## F12 Arrange and rename widget
Member · manage · Goal: Rename, resize and reposition widgets to keep the dashboard tidy.
Before: Signed in.; A dashboard with at least one widget is open in the editor.

1. The member views the widgets in the open dashboard. The website shows the dashboard title with its widgets in order, each with title, size and content.
   Changes: lists Widget.
2. The member edits a widget title and size and saves.
   - Widget title (required, 1 to 100 characters), e.g. "Today's note"
   - Widget size (required, one of: small, medium, large), e.g. "medium"
   The website autosaves the new title and size, updates the dashboard last-edited time, and shows the updated widget.
   Changes: updates Widget, updates Dashboard.
3. The member moves a widget earlier or later relative to other widgets. The website autosaves the new order, updates the dashboard last-edited time, and shows the widgets in the new order.
   Changes: updates Widget, updates Dashboard.

Other paths
- F12.A01 (from 1, empty) There are no widgets yet: The website says the dashboard has no widgets yet and offers a way to add one. Flow ends.
- F12.A02 (from 2, invalid) The title is empty: The website marks the title field and keeps what was typed and the chosen size. Back to 2.
- F12.A03 (from 2, failure) Saving the title or size fails: The website keeps the typed title and chosen size and offers to retry. Back to 2.
- F12.A04 (from 3, failure) Saving the new order fails: The website keeps the previous order and offers to retry moving. Back to 3.
- F12.A05 (from 2, notFound) The widget or dashboard was deleted in the meantime: The website says the widget is gone and shows the dashboard as it is now. Flow ends.

Outcome: Widget title, size and order are updated and autosaved; a refresh shows the same arrangement.

## F13 Remove widget
Member · manage · Goal: Remove a widget I no longer need.
Before: Signed in.; A dashboard with at least one widget is open in the editor.

1. The member views the widgets in the open dashboard. The website shows the dashboard with its widgets in order, each with title and content.
   Changes: lists Widget.
2. The member chooses Remove on a widget. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Widget, deletes ChecklistItem, deletes LinkEntry, updates Dashboard.

Other paths
- F13.A01 (from 1, empty) There are no widgets yet: The website says the dashboard has no widgets yet and offers a way to add one. Flow ends.
- F13.A02 (from 2, confirm) The member confirms the removal: The website permanently removes the widget with its content, autosaves the dashboard, updates last-edited, and shows the dashboard without it. Flow ends.
- F13.A03 (from 2, cancel) The member cancels the removal: Nothing is removed; the website shows the dashboard unchanged. Flow ends.
- F13.A04 (from 2, notFound) The widget was already removed: The website says the widget is gone and shows the dashboard as it is now. Flow ends.

Outcome: Widget and its content are gone; a refresh still shows the dashboard without it.

## F14 Use note widget
Member · core · Goal: Capture plain text in a note widget.
Before: Signed in.; A dashboard with a note widget is open in the editor.

1. The member edits the plain text inside a note widget.
   - Note text (optional, up to 5000 characters), e.g. "Call dentist at noon."
   The website autosaves the text, updates the dashboard last-edited time, and shows the updated note.
   Changes: updates Widget, updates Dashboard.

Other paths
- F14.A01 (from 1, invalid) The text is longer than 5000 characters: The website marks the text as too long and keeps what was typed. Back to 1.
- F14.A02 (from 1, failure) Saving fails: The website keeps the typed text and offers to retry. Back to 1.
- F14.A03 (from 1, notFound) The note widget or dashboard was deleted in the meantime: The website says the widget is gone and shows the dashboard as it is now. Flow ends.

Outcome: Note text is saved automatically; a refresh shows the same text.

## F15 Use counter widget
Member · core · Goal: Track a number with a label using a counter.
Before: Signed in.; A dashboard with a counter widget is open in the editor.

1. The member sets the counter label and saves.
   - Counter label (required, 1 to 80 characters), e.g. "Cups of water"
   The website autosaves the label, updates the dashboard last-edited time, and shows the updated label.
   Changes: updates Widget, updates Dashboard.
2. The member presses plus or minus on the counter. The website changes the value by 1, autosaves it, updates the dashboard last-edited time, and shows the current count.
   Changes: updates Widget, updates Dashboard.

Other paths
- F15.A01 (from 1, invalid) The label is empty: The website marks the label field and keeps what was typed. Back to 1.
- F15.A02 (from 1, failure) Saving the label fails: The website keeps the typed label and offers to retry. Back to 1.
- F15.A03 (from 2, failure) Saving the new value fails: The website keeps the previous count and offers to retry. Back to 2.
- F15.A04 (from 1, notFound) The counter widget or dashboard was deleted in the meantime: The website says the widget is gone and shows the dashboard as it is now. Flow ends.

Outcome: Counter label and value are saved; a refresh shows the same label and number.

## F16 Use checklist widget
Member · core · Goal: Track tickable tasks in a checklist.
Before: Signed in.; A dashboard with a checklist widget is open in the editor.

1. The member views the checklist widget. The website shows the checklist items with their ticked or unticked states.
   Changes: lists ChecklistItem.
2. The member adds an item with text to the checklist.
   - Checklist item text (required, 1 to 200 characters), e.g. "Buy milk"
   The website autosaves the new item as unticked, updates the dashboard last-edited time, and shows it with the other items.
   Changes: creates ChecklistItem, updates Dashboard.
3. The member ticks or unticks a checklist item. The website toggles the state, autosaves it, updates the dashboard last-edited time, and shows the updated states.
   Changes: updates ChecklistItem, updates Dashboard.
4. The member chooses Remove on a checklist item. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes ChecklistItem, updates Dashboard.

Other paths
- F16.A01 (from 1, empty) The checklist has no items yet: The website says there are no items yet and invites the member to add one. Back to 2.
- F16.A02 (from 2, invalid) The item text is empty: The website marks the item text field and keeps what was typed. Back to 2.
- F16.A03 (from 2, failure) Saving the new item fails: The website keeps the typed text and offers to retry. Back to 2.
- F16.A04 (from 3, failure) Saving the tick change fails: The website keeps the previous ticked state and offers to retry. Back to 3.
- F16.A05 (from 4, confirm) The member confirms the removal: The website permanently removes the item, autosaves the checklist, updates last-edited, and shows the updated list. Flow ends.
- F16.A06 (from 4, cancel) The member cancels the removal: Nothing is removed; the website shows the checklist unchanged. Flow ends.
- F16.A07 (from 1, notFound) The checklist widget or dashboard was deleted in the meantime: The website says the widget is gone and shows the dashboard as it is now. Flow ends.

Outcome: Checklist items and tick states are saved; a refresh shows the same items and states.

## F17 Use link-list widget
Member · core · Goal: Keep titles and web addresses handy and open them.
Before: Signed in.; A dashboard with a link-list widget is open in the editor.

1. The member views the link-list widget. The website shows the widget title and all saved link titles with their addresses, with options to add a link, edit or remove an entry, and open a link.
   Changes: lists LinkEntry.
2. The member adds a link title and address and saves it.
   - Link title (required, 1 to 200 characters), e.g. "Design inspiration"
   - Link address (required, up to 2000 characters), e.g. "https://example.com/article"
   The website saves the entry automatically, shows it in the link list, and updates the dashboard last-edited time.
   Changes: creates LinkEntry, updates Dashboard.
3. The member edits a link title or address and saves it.
   - Link title (required, 1 to 200 characters), e.g. "Design inspiration"
   - Link address (required, up to 2000 characters), e.g. "https://example.com/article"
   The website saves the changes automatically, shows the updated entry, and updates the dashboard last-edited time.
   Changes: updates LinkEntry, updates Dashboard.
4. The member selects a link entry to open it. The website opens the web address in a new tab and keeps the dashboard unchanged.
   Changes: reads LinkEntry.
5. The member chooses to remove a link entry. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes LinkEntry, updates Dashboard.

Other paths
- F17.A01 (from 1, empty) The link list has no entries yet: The website shows the widget with no entries and invites the member to add the first link. Back to 2.
- F17.A02 (from 2, invalid) The title is empty or the address does not start with http:// or https://: The website marks what is wrong and keeps what was typed. Back to 2.
- F17.A03 (from 2, failure) Saving the new entry fails: The website keeps the typed values and offers to retry. Back to 2.
- F17.A04 (from 3, invalid) The title is empty or the address does not start with http:// or https://: The website marks what is wrong and keeps what was typed. Back to 3.
- F17.A05 (from 3, failure) Saving the edited entry fails: The website keeps the typed values and offers to retry. Back to 3.
- F17.A06 (from 5, confirm) The member confirms the removal: The website shows the link list without the entry and updates the dashboard last-edited time. Flow ends.
- F17.A07 (from 5, cancel) The member cancels the removal: Nothing is removed; the website shows the link list unchanged. Flow ends.

Outcome: Link entries are saved and selecting one opens it in a new tab; a refresh shows the same entries.

## Fields
- FD01 Email (required, up to 254 characters), e.g. "sam@example.com". Member account address used to sign in and own dashboards
- FD02 Password (required, 8 to 128 characters), e.g. "Sunny-day-42". Secret that proves ownership of the member account
- FD03 Dashboard name (required, 1 to 100 characters), e.g. "Morning focus". How the member refers to the dashboard in the list and editor
- FD04 Widget title (required, 1 to 100 characters), e.g. "Today's note". How the member refers to the widget inside its dashboard
- FD05 Widget type (required, one of: note, counter, checklist, link list), e.g. "checklist". What kind of content the widget holds and how it can be used
- FD06 Widget size (required, one of: small, medium, large), e.g. "medium". How much space the widget takes relative to other widgets
- FD07 Note text (optional, up to 5000 characters), e.g. "Call dentist at noon.". Plain text kept inside a note widget
- FD08 Counter label (required, 1 to 80 characters), e.g. "Cups of water". What the counter number counts
- FD09 Checklist item text (required, 1 to 200 characters), e.g. "Buy milk". One task row inside a checklist widget
- FD10 Link title (required, 1 to 200 characters), e.g. "Design inspiration". How the member refers to a saved web address
- FD11 Link address (required, up to 2000 characters), e.g. "https://example.com/article". Web address opened when the link entry is selected

## Forms
- FM01 Account credentials: FD01, FD02

## STD01 Confirm deletion (standard subflow)

1. (system) The website asks to confirm the deletion and says what else will be removed with it.

Other paths
- STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
- STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.

## New assumptions
- A11 (data): New widgets start titled by type (e.g. 'New note') at medium size with default content: empty note text, counter label empty and value 0, empty checklist and link list.
- A12 (behavior): Dashboard list is ordered most-recently-edited first; an empty list invites creating the first dashboard instead of showing a dead end.
- A13 (behavior): Removing a widget permanently removes its items and links, and removing a checklist item or link entry permanently removes that row, with no trash or undo.

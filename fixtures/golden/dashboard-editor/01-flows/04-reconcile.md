# NeonBoard: user flows

## F01 Visit landing page
Member · onboarding · Goal: Understand what NeonBoard is for and get started.
Before: Not signed in.

1. The visitor opens the NeonBoard landing page. The website shows that NeonBoard is for building personal dashboards with notes, counters, checklists and link lists, and invites the visitor to sign up or sign in to create a dashboard.
2. The visitor chooses to sign up. The website shows the sign-up form.

Other paths
- F01.A01 (from 1, other) The visitor chooses to sign in instead: The website shows the sign-in form. Flow ends.

Outcome: Nothing is changed; the visitor knows how to sign up or sign in.

## F02 Sign up
Member · auth · Goal: Create an account and be signed in.
Before: Not signed in.

1. The visitor chooses to sign up. The website shows an empty account form.
2. The visitor fills in the account form and submits it. (Account form)
   - Email (required, up to 254 characters), e.g. "member@example.com"
   - Password (required, 8 to 128 characters), e.g. "secret123"
   The website creates the account, signs the member in, and shows the dashboard list.
   Changes: lists Dashboard.

Other paths
- F02.A01 (from 2, invalid) The email or password is missing or invalid: The website marks what is wrong and keeps what was typed. Back to 2.
- F02.A02 (from 2, failure) Creating the account fails: The website keeps the typed values and offers to retry. Back to 2.
- F02.A03 (from 2, empty) The new member has no dashboards yet: The website shows an empty dashboard list and offers Create as the next action. Flow ends.

Outcome: The account is created and the member is signed in; it stays that way after a refresh.

## F03 Sign in
Member · auth · Goal: Sign in to reach my dashboards.
Before: Not signed in.; Already has an account.

1. The visitor chooses to sign in. The website shows an empty account form.
2. The visitor fills in the account form and submits it. (Account form)
   - Email (required, up to 254 characters), e.g. "member@example.com"
   - Password (required, 8 to 128 characters), e.g. "secret123"
   The website signs the member in and shows the dashboard list with when each dashboard was last edited.
   Changes: lists Dashboard.

Other paths
- F03.A01 (from 2, invalid) The email or password is missing or invalid: The website marks what is wrong and keeps what was typed. Back to 2.
- F03.A02 (from 2, failure) Signing in fails: The website keeps the typed values and offers to retry. Back to 2.
- F03.A03 (from 2, empty) The member has no dashboards yet: The website shows an empty dashboard list and offers Create as the next action. Flow ends.

Outcome: The member is signed in and stays signed in after a refresh.

## F04 Sign out
Member · auth · Goal: Leave the account protected.
Before: Signed in.

1. The member chooses to sign out. The website ends the session and shows the public landing page.

Outcome: The member is signed out and stays signed out after a refresh.

## F05 Create a dashboard
Member · core · Goal: Start a new dashboard and land in its editor.
Before: Signed in.

1. The member chooses Create. The website creates a dashboard named Untitled dashboard, saves it automatically, and opens its empty editor offering adding a widget as the next action.
   Changes: creates Dashboard.

Other paths
- F05.A01 (from 1, failure) Creating the dashboard fails: The website keeps the dashboard list as it was and offers to retry Create. Back to 1.

Outcome: A new dashboard named Untitled dashboard exists and its empty editor is shown; it is still there after a refresh.

## F06 View dashboard list
Member · browse · Goal: Find and reopen one of my dashboards.
Before: Signed in.

1. The member opens the dashboard list. The website shows all of the member's own dashboards ordered by when each was last edited, most recently edited first, with that time.
   Changes: lists Dashboard.
2. The member chooses one dashboard from the list. The website opens that dashboard in the editor and shows its widgets.
   Changes: reads Dashboard, lists Widget.

Other paths
- F06.A01 (from 1, empty) The member has no dashboards yet: The website shows that there are no dashboards yet and offers Create as the next action. Flow ends.
- F06.A02 (from 2, notFound) The chosen dashboard was deleted in the meantime: The website says the dashboard is gone and shows the dashboard list. Flow ends.
- F06.A03 (from 2, empty) The opened dashboard has no widgets yet: The website shows the empty dashboard editor and offers adding a widget as the next action. Flow ends.

Outcome: No data is changed; the chosen dashboard is open in the editor and is still open after a refresh.

## F07 Add a widget
Member · core · Goal: Add a note, counter, checklist or link list widget to the dashboard.
Before: Signed in.; At least one dashboard, opened in the editor.

1. The member chooses to add a widget. The website shows the widget type choices of note, counter, checklist and link list.
2. The member chooses a widget type.
   - Widget type (required, one of: note, counter, checklist, link list), e.g. "note"
   The website creates the widget with a default title based on its type, medium size and empty or zero settings at the end of the dashboard order, saves it automatically, and shows it on the dashboard with an updated last-edited time.
   Changes: creates Widget, updates Dashboard.

Other paths
- F07.A01 (from 2, invalid) No widget type is chosen: The website marks that a type must be chosen and keeps the type choices shown. Back to 2.
- F07.A02 (from 2, failure) Creating the widget fails: The website keeps the type choice and offers to retry. Back to 2.
- F07.A03 (from 2, cancel) The member cancels adding a widget: Nothing is added; the website shows the dashboard as it was. Flow ends.

Outcome: A new widget of the chosen type is on the dashboard and is still there after a refresh.

## F08 Use a note widget
Member · core · Goal: Keep plain text in a note widget.
Before: Signed in.; A dashboard with a note widget.

1. The member opens the dashboard in the editor. The website shows the dashboard with its widgets including the note widget with its title and plain text.
   Changes: reads Dashboard, lists Widget.
2. The member edits the note widget title.
   - Widget title (required, 1 to 100 characters), e.g. "Ideas"
   The website saves the new title automatically and shows the updated title with an updated last-edited time.
   Changes: updates Widget, updates Dashboard.
3. The member edits the note text.
   - Note text (optional, up to 5000 characters), e.g. "Call the dentist on Tuesday"
   The website saves the new text automatically and shows the updated note.
   Changes: updates Widget, updates Dashboard.

Other paths
- F08.A01 (from 1, empty) The dashboard has no widgets: The website shows the empty dashboard editor and offers adding a widget as the next action. Flow ends.
- F08.A02 (from 1, notFound) The dashboard was deleted in the meantime: The website says the dashboard is gone and shows the dashboard list. Flow ends.
- F08.A03 (from 1, denied) The dashboard belongs to another member: The website does not show the dashboard and shows the member's own dashboard list. Flow ends.
- F08.A04 (from 2, invalid) The widget title is empty: The website marks the title and keeps what was typed. Back to 2.
- F08.A05 (from 2, failure) Saving the new title fails: The website keeps the typed title and offers to retry. Back to 2.
- F08.A06 (from 3, invalid) The note text is longer than 5000 characters: The website marks the text and keeps what was typed. Back to 3.
- F08.A07 (from 3, failure) Saving the new text fails: The website keeps the typed text and offers to retry. Back to 3.

Outcome: The note title and text are updated and are still there after a refresh.

## F09 Use a counter widget
Member · core · Goal: Track a number with a counter widget.
Before: Signed in.; A dashboard with a counter widget.

1. The member opens a dashboard with a counter widget in the editor. The website shows the dashboard name and its widgets in order; the counter widget shows its title, label and number with controls to increase and decrease.
   Changes: reads Dashboard, reads Widget.
2. The member edits the counter title and label.
   - Widget title (required, 1 to 100 characters), e.g. "Ideas"
   - Counter label (optional, up to 100 characters), e.g. "Glasses of water"
   The website saves each change automatically, shows the updated title and label, and updates when the dashboard was last edited.
   Changes: updates Widget.
3. The member increases or decreases the counter number. The website changes the number by 1, saves it automatically, shows the updated number, and updates when the dashboard was last edited.
   Changes: updates Widget.

Other paths
- F09.A01 (from 1, notFound) The dashboard or its counter widget was deleted in the meantime: The website says the dashboard or widget is gone and shows the dashboard list. Flow ends.
- F09.A02 (from 2, invalid) The title is empty: The website marks the title as required and keeps what was typed. Back to 2.
- F09.A03 (from 2, failure) Saving the title or label fails: The website keeps the typed values and offers to retry. Back to 2.
- F09.A04 (from 3, failure) Saving the new number fails: The website keeps the previous number and offers to retry. Back to 3.

Outcome: The counter title, label and number are updated and are still there after a refresh.

## F10 Use a checklist widget
Member · core · Goal: Track tasks in a checklist widget.
Before: Signed in.; A dashboard with a checklist widget.

1. The member opens a dashboard with a checklist widget in the editor. The website shows the dashboard name and its widgets in order; the checklist widget shows its title and its items with ticked or unticked states.
   Changes: reads Dashboard, reads Widget, lists ChecklistItem.
2. The member edits the checklist title.
   - Widget title (required, 1 to 100 characters), e.g. "Ideas"
   The website saves the new title automatically, shows the updated title, and updates when the dashboard was last edited.
   Changes: updates Widget.
3. The member adds a new checklist item with text.
   - Checklist item text (required, 1 to 200 characters), e.g. "Buy milk"
   The website saves the item as unticked automatically, shows it at the end of the checklist, and updates when the dashboard was last edited.
   Changes: creates ChecklistItem.
4. The member ticks or unticks a checklist item. The website saves the new ticked state automatically, shows the updated state, and updates when the dashboard was last edited.
   Changes: updates ChecklistItem.

Other paths
- F10.A01 (from 1, empty) The checklist widget has no items yet: The website shows the checklist widget with no items and offers adding an item as the next action. Back to 3.
- F10.A02 (from 1, notFound) The dashboard or its checklist widget was deleted in the meantime: The website says the dashboard or widget is gone and shows the dashboard list. Flow ends.
- F10.A03 (from 2, invalid) The title is empty: The website marks the title as required and keeps what was typed. Back to 2.
- F10.A04 (from 2, failure) Saving the title fails: The website keeps the typed value and offers to retry. Back to 2.
- F10.A05 (from 3, invalid) The item text is empty: The website marks the item text as required and keeps what was typed. Back to 3.
- F10.A06 (from 3, failure) Saving the new item fails: The website keeps the typed value and offers to retry. Back to 3.
- F10.A07 (from 4, failure) Saving the ticked state fails: The website keeps the previous ticked state and offers to retry. Back to 4.

Outcome: The checklist title, items and ticked states are updated and are still there after a refresh.

## F11 Use a link list widget
Member · core · Goal: Keep and open useful links in a link list widget.
Before: Signed in.; A dashboard with a link list widget.

1. The member opens a dashboard with a link list widget in the editor. The website shows the dashboard name and its widgets in order; the link list widget shows its title and its entries with titles and web addresses.
   Changes: reads Dashboard, reads Widget, lists LinkItem.
2. The member edits the link list title.
   - Widget title (required, 1 to 100 characters), e.g. "Ideas"
   The website saves the new title automatically, shows the updated title, and updates when the dashboard was last edited.
   Changes: updates Widget.
3. The member adds a link entry with a title and a web address.
   - Link title (required, 1 to 150 characters), e.g. "Neon design inspiration"
   - Link web address (required, up to 2000 characters), e.g. "https://example.com"
   The website saves the entry automatically, shows it in the link list, and updates when the dashboard was last edited.
   Changes: creates LinkItem.
4. The member chooses a link in the widget. The website opens the link web address for the member and keeps the link list unchanged.
   Changes: reads LinkItem.

Other paths
- F11.A01 (from 1, empty) The link list widget has no entries yet: The website shows the link list widget with no entries and offers adding a link as the next action. Back to 3.
- F11.A02 (from 1, notFound) The dashboard or its link list widget was deleted in the meantime: The website says the dashboard or widget is gone and shows the dashboard list. Flow ends.
- F11.A03 (from 2, invalid) The title is empty: The website marks the title as required and keeps what was typed. Back to 2.
- F11.A04 (from 2, failure) Saving the title fails: The website keeps the typed value and offers to retry. Back to 2.
- F11.A05 (from 3, invalid) The link title is empty or the web address is missing or not a valid web address: The website marks what is wrong and keeps what was typed. Back to 3.
- F11.A06 (from 3, failure) Saving the new link fails: The website keeps the typed values and offers to retry. Back to 3.
- F11.A07 (from 4, notFound) The chosen link was removed in the meantime: The website says the link is gone and shows the updated link list. Back to 1.

Outcome: The link list title and entries are updated and are still there after a refresh; choosing a link opens its address.

## F12 Move and resize a widget
Member · manage · Goal: Arrange widgets by position and size.
Before: Signed in.; A dashboard with at least one widget.

1. The member opens the dashboard in the editor. The website shows the dashboard name and its widgets in their relative order with their sizes.
   Changes: reads Dashboard, lists Widget.
2. The member changes a widget position relative to the other widgets. The website saves the new order automatically, shows the widgets rearranged, and updates when the dashboard was last edited.
   Changes: updates Widget.
3. The member resizes the widget between small, medium and large.
   - Widget size (required, one of: small, medium, large), e.g. "medium"
   The website saves the new size automatically, shows the widget with its new size, and updates when the dashboard was last edited.
   Changes: updates Widget.

Other paths
- F12.A01 (from 1, empty) There are no widgets on the dashboard: The website shows the empty dashboard and offers adding a widget as the next action. Flow ends.
- F12.A02 (from 1, notFound) The dashboard was deleted in the meantime: The website says the dashboard is gone and shows the dashboard list. Flow ends.
- F12.A03 (from 2, failure) Saving the new position fails: The website keeps the previous order and offers to retry. Back to 2.
- F12.A04 (from 3, invalid) No valid size was chosen: The website marks the size as required and keeps the current size. Back to 3.
- F12.A05 (from 3, failure) Saving the new size fails: The website keeps the previous size and offers to retry. Back to 3.

Outcome: The widget order and size are updated and are still there after a refresh.

## F13 Remove a widget
Member · manage · Goal: Remove a widget I no longer want.
Before: Signed in.; A dashboard with at least one widget.

1. The member opens the dashboard in the editor. The website shows the dashboard name and its widgets in order.
   Changes: reads Dashboard, reads Widget.
2. The member chooses to remove the widget. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Widget, deletes ChecklistItem, deletes LinkItem.

Other paths
- F13.A01 (from 1, notFound) The dashboard or widget was deleted in the meantime: The website says the dashboard or widget is gone and shows the dashboard list. Flow ends.
- F13.A02 (from 2, confirm) The member confirmed the removal: The website shows the dashboard without the removed widget and with the remaining widgets in their existing order. Flow ends.
- F13.A03 (from 2, cancel) The member cancelled: Nothing is removed; the website shows the dashboard with the widget unchanged. Flow ends.

Outcome: The widget is gone and stays gone after a refresh; other widgets keep their order.

## F14 Rename a dashboard
Member · manage · Goal: Give a dashboard a meaningful name.
Before: Signed in.; At least one dashboard.

1. The member opens the dashboard in the editor. The website shows the dashboard name and its widgets.
   Changes: reads Dashboard.
2. The member renames the dashboard.
   - Dashboard name (required, 1 to 100 characters), e.g. "Morning focus"
   The website saves the new name automatically, shows it in the editor and in the dashboard list, and updates when the dashboard was last edited.
   Changes: updates Dashboard.

Other paths
- F14.A01 (from 1, notFound) The dashboard was deleted in the meantime: The website says the dashboard is gone and shows the dashboard list. Flow ends.
- F14.A02 (from 2, invalid) The new name is empty: The website marks the name as required and keeps what was typed. Back to 2.
- F14.A03 (from 2, failure) Saving the new name fails: The website keeps the typed value and offers to retry. Back to 2.

Outcome: The dashboard has its new name and it is still there after a refresh.

## F15 Duplicate a dashboard
Member · manage · Goal: Copy a dashboard to reuse its setup.
Before: Signed in.; At least one dashboard.

1. The member opens the dashboard list. The website shows all of the member's own dashboards ordered by when each was last edited with that time.
   Changes: lists Dashboard.
2. The member chooses to duplicate a dashboard. The website creates a new dashboard named with copy added to the original name with copies of all widgets, titles, type settings, positions and sizes, and shows it in the list and in the editor.
   Changes: creates Dashboard, creates Widget, creates ChecklistItem, creates LinkItem.

Other paths
- F15.A01 (from 1, empty) There are no dashboards yet: The website shows no dashboards and offers Create as the next action. Flow ends.
- F15.A02 (from 2, notFound) The dashboard was deleted in the meantime: The website says the dashboard is gone and shows the dashboard list. Flow ends.
- F15.A03 (from 2, failure) Duplicating fails: The website keeps the dashboard list unchanged and offers to retry. Back to 2.

Outcome: A new dashboard copy exists alongside the original and both are still there after a refresh.

## F16 Delete a dashboard
Member · manage · Goal: Delete a dashboard I no longer want.
Before: Signed in.; At least one dashboard.

1. The member opens the dashboard list. The website shows all of the member's own dashboards ordered by when each was last edited with that time.
   Changes: lists Dashboard.
2. The member chooses to delete a dashboard. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Dashboard, deletes Widget, deletes ChecklistItem, deletes LinkItem.

Other paths
- F16.A01 (from 1, empty) There are no dashboards: The website shows no dashboards and offers Create as the next action. Flow ends.
- F16.A02 (from 2, confirm) The member confirmed the deletion: The website shows the dashboard list without the deleted dashboard and its widgets. Flow ends.
- F16.A03 (from 2, cancel) The member cancelled: Nothing is deleted; the website shows the dashboard list unchanged. Flow ends.
- F16.A04 (from 2, notFound) The dashboard was already deleted: The website says the dashboard is gone and shows the dashboard list. Flow ends.

Outcome: The dashboard and its widgets are gone and stay gone after a refresh.

## Fields
- FD01 Email (required, up to 254 characters), e.g. "member@example.com". The member's sign-in address
- FD02 Password (required, 8 to 128 characters), e.g. "secret123". Secret that proves ownership of the account
- FD03 Dashboard name (required, 1 to 100 characters), e.g. "Morning focus". How the member refers to the dashboard in the list and editor
- FD04 Widget type (required, one of: note, counter, checklist, link list), e.g. "note". Which kind of widget to add to the dashboard
- FD05 Widget title (required, 1 to 100 characters), e.g. "Ideas". How the member refers to the widget on the dashboard
- FD06 Widget size (required, one of: small, medium, large), e.g. "medium". How large the widget appears among the other widgets
- FD07 Note text (optional, up to 5000 characters), e.g. "Call the dentist on Tuesday". Plain text kept in a note widget
- FD08 Counter label (optional, up to 100 characters), e.g. "Glasses of water". What the counter number counts
- FD09 Counter number (required), e.g. "3". Current count kept in a counter widget
- FD10 Checklist item text (required, 1 to 200 characters), e.g. "Buy milk". Text of one item inside a checklist widget
- FD11 Link title (required, 1 to 150 characters), e.g. "Neon design inspiration". Readable name shown for a web address in a link list widget
- FD12 Link web address (required, up to 2000 characters), e.g. "https://example.com". Web address opened when the member chooses the link

## Forms
- FM01 Account form: FD01, FD02

## STD01 Confirm deletion (standard subflow)

1. (system) The website asks to confirm the deletion and says what else will be removed with it.

Other paths
- STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
- STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.

## New assumptions
- A08 (behavior): The dashboard list is ordered by last edited, most recently edited first, so the member can find recent work without search or filters.
- A09 (data): Dashboard name and widget title are required and cannot be saved empty; Create uses 'Untitled dashboard' and adding a widget uses a default title based on its type, and clearing a name in the editor is rejected.

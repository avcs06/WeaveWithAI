# TidyDash: user flows

## F01 Discover TidyDash on the landing page
Visitor · browse · Goal: Understand what TidyDash is for and start toward an account.
Before: Not signed in.

1. The visitor opens the landing page. The website shows what TidyDash personal dashboards are for, how creating a dashboard and adding note, counter, checklist and link-list widgets works, and ways to sign up or sign in.
2. The visitor chooses to sign up or sign in. The website directs the visitor to sign up or sign in to start.

Outcome: Nothing is saved; the visitor knows how to start and is directed to sign up or sign in.

## F02 Sign up as a member
Member · auth · Goal: Create an account to own private dashboards.
Before: Not signed in.

1. The visitor chooses to sign up. The website shows an empty account credentials form with a way to submit or go back.
2. The visitor fills in the account credentials and submits. (Account credentials)
   - Email (required, up to 254 characters), e.g. "sam@example.com"
   - Password (required, 8 to 128 characters), e.g. "tidy-morning-42"
   The website creates the account, signs the member in and shows their empty dashboard space ready to create a dashboard.

Other paths
- F02.A01 (from 2, invalid) The email is missing or badly formed, or the password is shorter than 8 characters: The website marks the fields and keeps what was typed. Back to 2.
- F02.A02 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.
- F02.A03 (from 2, conflict) The email already has an account: The website says an account with that email already exists and offers to sign in instead, keeping what was typed. Back to 2.
- F02.A04 (from 2, cancel) The visitor cancels: Nothing is saved; the website shows the landing page as it was. Flow ends.

Outcome: Account created and member signed in; refresh still shows them signed in with an empty dashboard list.

## F03 Sign in as a member
Member · auth · Goal: Sign back in to access my dashboards.
Before: Not signed in.

1. The returning member chooses to sign in. The website shows an empty account credentials form with a way to submit or go back.
2. The member fills in the account credentials and submits. (Account credentials)
   - Email (required, up to 254 characters), e.g. "sam@example.com"
   - Password (required, 8 to 128 characters), e.g. "tidy-morning-42"
   The website verifies the member and shows only their own dashboards with name and last-edited time ordered most-recently-edited first, with ways to create or open one.
   Changes: lists Dashboard.

Other paths
- F03.A01 (from 2, invalid) The email is missing or badly formed, or the password is missing: The website marks the fields and keeps what was typed. Back to 2.
- F03.A02 (from 2, failure) Verifying fails: The website keeps the values and offers to retry. Back to 2.
- F03.A03 (from 2, denied) The email and password do not match: The website says the email and password do not match, keeps the email and offers to try again. Back to 2.
- F03.A04 (from 2, empty) The member has no dashboards yet: The website shows an empty dashboard space with a way to create a new dashboard. Flow ends.
- F03.A05 (from 2, cancel) The member cancels: Nothing is saved; the website shows the landing page as it was. Flow ends.

Outcome: Member signed in; refresh still shows them signed in with their own dashboards.

## F04 Sign out
Member · auth · Goal: End the session on this device.
Before: Signed in.

1. The member chooses to sign out. The website ends the session, hides private dashboards and shows the public landing page with ways to sign up or sign in.

Outcome: Member signed out and private data hidden; refresh still shows signed-out state.

## F05 Create a new dashboard
Member · core · Goal: Start a new empty dashboard in the editor.
Before: Signed in.

1. The member opens their dashboard space. The website shows only their own dashboards with name and last-edited time ordered most-recently-edited first and a way to create a new dashboard.
   Changes: lists Dashboard.
2. The member chooses to create a new dashboard. The website creates an empty dashboard with a default name, saves it automatically with the current last-edited time and opens it in the editor.
   Changes: creates Dashboard.

Other paths
- F05.A01 (from 1, empty) The member has no dashboards yet: The website shows an empty dashboard space with a way to create a new dashboard. Back to 2.
- F05.A02 (from 2, failure) Creating fails: The website keeps the list as it was and offers to retry. Back to 2.

Outcome: New empty dashboard saved with default name and current last-edited time; it appears first in the list and is still there after a refresh, open in the editor.

## F06 View my dashboard list
Member · browse · Goal: See all my dashboards and pick one to open.
Before: Signed in.

1. The member opens their dashboard space. The website shows only their own dashboards with each name and when it was last edited ordered most-recently-edited first, with ways to create a new dashboard or open one.
   Changes: lists Dashboard.

Other paths
- F06.A01 (from 1, empty) The member has no dashboards yet: The website shows an empty dashboard space with a way to create a new dashboard. Flow ends.

Outcome: Nothing changes; refresh still shows the same private list ordered most-recently-edited first.

## F07 Rename a dashboard
Member · manage · Goal: Change a dashboard name.
Before: Signed in.; At least one dashboard exists.

1. The member chooses to rename a dashboard. The website shows the current dashboard name ready to edit.
   Changes: reads Dashboard.
2. The member edits the dashboard name and confirms.
   - Dashboard name (optional, up to 100 characters), e.g. "Morning focus"
   The website saves the new name automatically, updates the last-edited time and shows the renamed dashboard in place.
   Changes: updates Dashboard.

Other paths
- F07.A01 (from 2, invalid) The name is longer than 100 characters: The website marks the field and keeps what was typed. Back to 2.
- F07.A02 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.
- F07.A03 (from 2, notFound) The dashboard is already gone: The website shows that the dashboard is gone and shows the updated list. Flow ends.
- F07.A04 (from 2, cancel) The member cancels: Nothing is saved; the website shows the dashboard as it was. Flow ends.
- F07.A05 (from 1, notFound) The dashboard is already gone: The website shows that the dashboard is gone and shows the updated list. Flow ends.

Outcome: Dashboard name updated and saved with new last-edited time; still renamed after a refresh.

## F08 Duplicate a dashboard
Member · manage · Goal: Make a full copy of a dashboard including its widgets.
Before: Signed in.; At least one dashboard exists.

1. The member opens their dashboard space. The website shows only their own dashboards with name and last-edited time and a way to duplicate a dashboard.
   Changes: lists Dashboard.
2. The member chooses to duplicate a dashboard. The website creates a full copy including all widgets and their content named like Copy of the original, saves it and shows it in the list.
   Changes: creates Dashboard, creates Widget.

Other paths
- F08.A01 (from 1, empty) The member has no dashboards yet: The website shows an empty dashboard space with a way to create a new dashboard. Flow ends.
- F08.A02 (from 2, failure) Duplicating fails: The website keeps the list as it was and offers to retry. Back to 2.
- F08.A03 (from 2, notFound) The dashboard is already gone: The website shows that the dashboard is gone and shows the updated list. Flow ends.

Outcome: Copy saved with all widgets and content; both original and copy are still there after a refresh.

## F09 Delete a dashboard
Member · manage · Goal: Permanently remove a dashboard and its widgets.
Before: Signed in.; At least one dashboard exists.

1. The member views the dashboard list. The website shows only the member's own dashboards with each name and when it was last edited, ordered most-recently-edited first, each with a way to delete it.
   Changes: lists Dashboard.
2. Confirm permanent deletion (subflow SF01):
   1. The member chooses to delete the item. The website asks the member to confirm that deletion is permanent or to cancel.
   2. The member confirms permanent deletion. The website records the confirmation to proceed with permanent deletion.

   Other paths
   - SF01.A01 (from 1, cancel) The member cancels: Nothing is deleted; the website shows the content as it was. Flow ends.
   - SF01.A02 (from 2, failure) Deleting fails: The website keeps the item and offers to retry. Back to 2.
   - SF01.A03 (from 2, notFound) The item is already gone: The website shows that the item is already gone and shows the updated list. Flow ends.
3. (system) The website permanently removes the dashboard and its widgets and shows the updated dashboard list.
   Changes: deletes Dashboard, deletes Widget.

Other paths
- F09.A01 (from 1, empty) There are no dashboards: The website shows that there are no dashboards yet and offers a way to create a new dashboard. Flow ends.
- F09.A02 (from 3, failure) Removing fails: The website keeps the dashboard and offers to retry. Back to 3.
- F09.A03 (from 3, cancel) The member cancels during confirmation: Nothing is deleted; the website shows the dashboard list as it was. Flow ends.

Outcome: Dashboard and its widgets removed; still gone after a refresh and list no longer shows it.

## F10 Add a widget to a dashboard
Member · core · Goal: Add a new widget of a chosen type to the dashboard.
Before: Signed in.; A dashboard is open in the editor.

1. The member views the open dashboard in the editor. The website shows the dashboard name and its widgets in their saved order, with a way to add a widget of each type.
   Changes: reads Dashboard, lists Widget.
2. The member chooses a widget type and adds the widget.
   - Widget type (required, one of: note, counter, checklist, link list), e.g. "counter"
   The website appends a new widget with default title and medium size, saves it automatically, updates the dashboard last-edited time and shows it in order.
   Changes: creates Widget, updates Dashboard.

Other paths
- F10.A01 (from 1, empty) There are no widgets yet: The website shows that the dashboard is empty and offers a way to add a widget. Back to 2.
- F10.A02 (from 2, invalid) No widget type is chosen: The website marks the type choice and keeps the editor as it was. Back to 2.
- F10.A03 (from 2, failure) Saving fails: The website keeps the chosen type and offers to retry. Back to 2.
- F10.A04 (from 1, notFound) The dashboard is already gone: The website shows that the dashboard is gone and shows the dashboard list. Flow ends.

Outcome: New widget saved with defaults and appended in order; still there after a refresh with updated last-edited time.

## F11 Configure and use widget content
Member · core · Goal: Fill in and use the content of my widgets.
Before: Signed in.; A dashboard with at least one widget is open in the editor.

1. The member views the widgets in the open dashboard. The website shows each widget with its title, type-specific content and size in saved order, ready to edit and use.
   Changes: lists Widget.
2. The member types note text in a note widget.
   - Note text (optional, up to 5000 characters), e.g. "Call the dentist on Tuesday about the checkup."
   The website saves the note text automatically, updates the dashboard last-edited time and shows the updated note.
   Changes: updates Widget, updates Dashboard.
3. The member edits the counter label and number.
   - Counter label (optional, up to 100 characters), e.g. "Glasses of water"
   - Counter value (required), e.g. "3"
   The website saves the label and number automatically, updates the dashboard last-edited time and shows the updated counter.
   Changes: updates Widget, updates Dashboard.
4. The member increases or decreases a counter. The website changes the number by 1 per use, saves it automatically, updates the dashboard last-edited time and shows the new number.
   Changes: updates Widget, updates Dashboard.
5. The member adds, edits, ticks, unticks or removes checklist items.
   - Checklist item text (optional, up to 200 characters), e.g. "Buy oat milk"
   - Checklist item done (optional), e.g. "true"
   The website saves each checklist change automatically, keeps ticked items visible, updates the dashboard last-edited time and shows the updated checklist.
   Changes: updates Widget, updates Dashboard.
6. The member adds, edits or removes link titles and addresses and selects a link to open it.
   - Link title (optional, up to 150 characters), e.g. "Favorite recipes"
   - Link address (optional), e.g. "https://example.com/recipes"
   The website saves each link change automatically, updates the dashboard last-edited time, shows the updated link list and opens a selected link in a new browser tab.
   Changes: updates Widget, updates Dashboard.

Other paths
- F11.A01 (from 1, empty) There are no widgets yet: The website shows that the dashboard has no widgets yet and offers a way to add a widget. Flow ends.
- F11.A02 (from 2, invalid) The note text is longer than allowed: The website marks the note text and keeps what was typed. Back to 2.
- F11.A03 (from 2, failure) Saving fails: The website keeps the typed text and offers to retry. Back to 2.
- F11.A04 (from 3, invalid) The counter number is not a whole number: The website marks the counter number and keeps what was typed. Back to 3.
- F11.A05 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.
- F11.A06 (from 4, failure) Saving the new count fails: The website keeps the previous number and offers to retry. Back to 4.
- F11.A07 (from 5, invalid) A new checklist item has no text: The website marks the item text and keeps what was typed. Back to 5.
- F11.A08 (from 5, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 5.
- F11.A09 (from 6, invalid) The link address is missing or is not a valid web address: The website marks the link address and keeps what was typed. Back to 6.
- F11.A10 (from 6, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 6.
- F11.A11 (from 1, notFound) The dashboard or widget is already gone: The website shows that the dashboard is gone and shows the dashboard list. Flow ends.

Outcome: Widget content saved automatically; still there after a refresh and dashboard shows updated last-edited time.

## F12 Manage widgets
Member · manage · Goal: Arrange, resize, rename and remove widgets.
Before: Signed in.; A dashboard with at least one widget is open in the editor.

1. The member views the widgets in the open dashboard. The website shows each widget with its title and size in saved order, each with ways to rename, move, resize and remove it.
   Changes: lists Widget.
2. The member renames a widget.
   - Widget title (optional, up to 100 characters), e.g. "Water intake"
   The website saves the new title automatically, updates the dashboard last-edited time and shows the renamed widget in place.
   Changes: updates Widget, updates Dashboard.
3. The member moves a widget to a new position relative to the other widgets. The website saves the new order automatically, updates the dashboard last-edited time and shows the widgets in the new order.
   Changes: updates Widget, updates Dashboard.
4. The member changes a widget size between small, medium and large.
   - Widget size (optional, one of: small, medium, large), e.g. "medium"
   The website saves the new size automatically, updates the dashboard last-edited time and shows the widget in the new size.
   Changes: updates Widget, updates Dashboard.
5. Confirm permanent deletion (subflow SF01):
   1. The member chooses to delete the item. The website asks the member to confirm that deletion is permanent or to cancel.
   2. The member confirms permanent deletion. The website records the confirmation to proceed with permanent deletion.

   Other paths
   - SF01.A01 (from 1, cancel) The member cancels: Nothing is deleted; the website shows the content as it was. Flow ends.
   - SF01.A02 (from 2, failure) Deleting fails: The website keeps the item and offers to retry. Back to 2.
   - SF01.A03 (from 2, notFound) The item is already gone: The website shows that the item is already gone and shows the updated list. Flow ends.
6. (system) The website removes the widget immediately, updates the dashboard last-edited time and shows the remaining widgets in order.
   Changes: deletes Widget, updates Dashboard.

Other paths
- F12.A01 (from 1, empty) There are no widgets yet: The website shows that the dashboard has no widgets yet and offers a way to add a widget. Flow ends.
- F12.A02 (from 2, invalid) The widget title is longer than allowed: The website marks the title and keeps what was typed. Back to 2.
- F12.A03 (from 2, failure) Saving fails: The website keeps the typed title and offers to retry. Back to 2.
- F12.A04 (from 3, failure) Saving the new order fails: The website keeps the previous order and offers to retry. Back to 3.
- F12.A05 (from 4, invalid) The size choice is missing or not recognized: The website marks the size choice and keeps the widget as it was. Back to 4.
- F12.A06 (from 4, failure) Saving fails: The website keeps the chosen size and offers to retry. Back to 4.
- F12.A07 (from 6, failure) Removing fails: The website keeps the widget and offers to retry. Back to 6.
- F12.A08 (from 1, notFound) The dashboard or widget is already gone: The website shows that the dashboard is gone and shows the dashboard list. Flow ends.
- F12.A09 (from 6, cancel) The member cancels during confirmation: Nothing is removed; the website shows the widgets as they were. Flow ends.

Outcome: Renames, order, sizes saved and removals gone; refresh still shows the same arrangement with updated last-edited time.

## F13 Open a dashboard in the editor
Member · core · Goal: Open one of my existing dashboards to view and edit its widgets.
Before: Signed in.; At least one dashboard exists.

1. The member views the dashboard list. The website shows only the member's own dashboards with each name and when it was last edited, ordered most-recently-edited first, with a way to open one.
   Changes: lists Dashboard.
2. The member chooses a dashboard to open. The website opens the chosen dashboard in the editor showing its name and widgets in saved order, ready to add, configure and manage widgets.
   Changes: reads Dashboard, lists Widget.

Other paths
- F13.A01 (from 1, empty) There are no dashboards: The website shows that there are no dashboards yet and offers a way to create a new dashboard. Flow ends.
- F13.A02 (from 2, notFound) The chosen dashboard is already gone: The website shows that the dashboard is gone and shows the updated dashboard list. Flow ends.
- F13.A03 (from 2, failure) Opening fails: The website keeps the dashboard list and offers to retry. Back to 2.
- F13.A04 (from 2, empty) The dashboard has no widgets yet: The website shows that the dashboard is empty and offers a way to add a widget. Flow ends.

Outcome: The chosen dashboard is open in the editor showing its widgets; it is still open in the editor after a refresh.

## Fields
- FD01 Email (required, up to 254 characters), e.g. "sam@example.com". The member's sign-in address for their private dashboards
- FD02 Password (required, 8 to 128 characters), e.g. "tidy-morning-42". Secret that proves ownership of the account
- FD03 Dashboard name (optional, up to 100 characters), e.g. "Morning focus". How the member refers to the dashboard in the list and editor
- FD04 Widget title (optional, up to 100 characters), e.g. "Water intake". Heading shown on the widget to say what it is for
- FD05 Widget type (required, one of: note, counter, checklist, link list), e.g. "counter". What kind of content the widget holds
- FD06 Widget size (optional, one of: small, medium, large), e.g. "medium". How large the widget appears relative to other widgets
- FD07 Note text (optional, up to 5000 characters), e.g. "Call the dentist on Tuesday about the checkup.". Plain text kept in a note widget
- FD08 Counter label (optional, up to 100 characters), e.g. "Glasses of water". What the counter number is counting
- FD09 Checklist item text (optional, up to 200 characters), e.g. "Buy oat milk". One task line inside a checklist widget
- FD10 Link title (optional, up to 150 characters), e.g. "Favorite recipes". Readable name shown for a saved web address
- FD11 Link address (optional), e.g. "https://example.com/recipes". Web address opened when the link is selected
- FD12 Counter value (required), e.g. "3". Current number kept in a counter widget
- FD13 Checklist item done (optional), e.g. "true". Whether a checklist item is ticked off

## Forms
- FM01 Account credentials: FD01, FD02

## SF01 Confirm permanent deletion (subflow)

1. The member chooses to delete the item. The website asks the member to confirm that deletion is permanent or to cancel.
2. The member confirms permanent deletion. The website records the confirmation to proceed with permanent deletion.

Other paths
- SF01.A01 (from 1, cancel) The member cancels: Nothing is deleted; the website shows the content as it was. Flow ends.
- SF01.A02 (from 2, failure) Deleting fails: The website keeps the item and offers to retry. Back to 2.
- SF01.A03 (from 2, notFound) The item is already gone: The website shows that the item is already gone and shows the updated list. Flow ends.

## New assumptions
- A13 (behavior): Removing a widget asks for confirmation first and then deletes immediately with no trash or undo, reading A09's immediately as no restore after confirm.
- A14 (behavior): Renaming, duplicating, resizing, repositioning and editing any widget content all count as dashboard changes that trigger autosave and update the dashboard last-edited time.

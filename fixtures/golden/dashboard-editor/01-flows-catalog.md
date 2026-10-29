# TidyDash: flows catalog

## Flows
- F01 Discover TidyDash on the landing page (Visitor, browse): A visitor arrives at the public landing page that explains personal dashboards for notes, counts, tasks and links, sees how creating a dashboard and adding widgets works, and chooses to sign up or sign in to start, with nothing saved.
- F02 Sign up as a member (Member, auth): A visitor on the landing page chooses to sign up, provides email and password, submits, and the website creates the account, signs them in as a member and shows their empty dashboard space ready to create.
- F03 Sign in as a member (Member, auth): A returning member arrives signed out, enters email and password, submits, and the website verifies them and restores their own dashboard list ordered by last-edited time.
- F04 Sign out (Member, auth): A signed-in member chooses to sign out and the website ends the session and hides private dashboards, showing the public landing or sign-in starting point.
- F05 Create a new dashboard (Member, core): From the dashboard list a signed-in member chooses Create, and the website immediately creates an empty dashboard with a default name, opens it in the editor, saves it automatically and updates its last-edited time.
- F06 View my dashboard list (Member, browse): A signed-in member opens their dashboard space and the website lists only their own dashboards showing each name and when it was last edited, ordered most-recently-edited first, with a way to create or open one.
- F07 Rename a dashboard (Member, manage): From the list or editor a member edits a dashboard name, and the website saves the new name automatically, updates the last-edited time and shows the renamed dashboard in place.
- F08 Duplicate a dashboard (Member, manage): A member chooses to duplicate a dashboard, and the website creates a full copy including all widgets and their content named like Copy of the original, saves it and shows it in the list.
- F09 Delete a dashboard (Member, manage): A member chooses to delete a dashboard, confirms permanent deletion through the shared confirmation, and the website permanently removes the dashboard and its widgets and shows the updated list.
- F10 Add a widget to a dashboard (Member, core): Inside an open dashboard the member chooses a widget type among note, counter, checklist and link list, and the website appends a new widget with default title and medium size, saves it automatically and shows it in order.
- F11 Configure and use widget content (Member, core): In the editor the member works with widget content by type: typing note text, editing the counter label and using increase and decrease, adding, editing, ticking, unticking and removing checklist items, and adding, editing and removing link titles and addresses and opening links, with every change saved automatically and the last-edited time updated.
- F12 Manage widgets (Member, manage): In the editor the member renames a widget, moves it relative to other widgets, changes its size between small, medium and large, or removes it after confirmation, and the website saves each change automatically and updates the last-edited time.
- F13 Open a dashboard in the editor (Member, core): A signed-in member with at least one dashboard chooses a dashboard from their dashboard list, and the website opens that dashboard in the editor showing its name and widgets in their saved order, ready to add, configure and manage widgets.

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

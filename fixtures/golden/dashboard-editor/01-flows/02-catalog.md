# NeonBoard: flows catalog

## Flows
- F01 Visit landing page (Member, onboarding): A visitor arrives on the public NeonBoard landing page which explains building personal dashboards with notes, counters, checklists and link lists, and the visitor chooses to sign up or sign in to start creating a dashboard.
- F02 Sign up (Member, auth): A visitor chooses to sign up from the landing page, submits email and password, and the website creates the account and signs the new member in so they can create dashboards.
- F03 Sign in (Member, auth): A returning visitor chooses to sign in, submits email and password, and the website signs them in so they return to their own dashboards.
- F04 Sign out (Member, auth): A signed-in member chooses to sign out and the website ends the session so the dashboards are protected until the next sign in.
- F05 Create a dashboard (Member, core): A signed-in member chooses Create, and the website immediately creates a dashboard named Untitled dashboard and opens it in the editor ready for widgets, saving it automatically.
- F06 View dashboard list (Member, browse): A signed-in member opens the dashboard list and the website shows all of their own dashboards ordered by when each was last edited with that time, offering Create when there are none. The member chooses one dashboard from the list and the website opens that dashboard in the editor.
- F07 Add a widget (Member, core): A signed-in member in a dashboard editor chooses a widget type to add, and the website creates the widget with a default title, medium size and empty or zero settings at the end of the dashboard order and shows it saved.
- F08 Use a note widget (Member, core): A signed-in member edits a note widget's title and plain text in the editor, and the website saves each change automatically and shows the updated note.
- F09 Use a counter widget (Member, core): A signed-in member edits a counter widget's title and label and increases or decreases its number by one, and the website saves each change automatically and shows the updated label and number.
- F10 Use a checklist widget (Member, core): A signed-in member edits a checklist widget's title, adds new items with text, and ticks or unticks items, and the website saves each change automatically and shows the updated list and states.
- F11 Use a link list widget (Member, core): A signed-in member edits a link list widget's title, adds entries with a title and web address, and opens links from the widget, and the website saves each change automatically and shows the updated list.
- F12 Move and resize a widget (Member, manage): A signed-in member in the editor changes a widget's position relative to the other widgets and resizes it between small, medium and large, and the website saves the new order and size automatically and shows the widgets rearranged.
- F13 Remove a widget (Member, manage): A signed-in member chooses to remove a widget from a dashboard and confirms, and the website permanently deletes only that widget and shows the dashboard without it.
- F14 Rename a dashboard (Member, manage): A signed-in member renames a dashboard, and the website saves the new name automatically and shows it in the editor and in the dashboard list with an updated last-edited time.
- F15 Duplicate a dashboard (Member, manage): A signed-in member chooses to duplicate a dashboard, and the website creates a new dashboard with copy added to the name containing copies of all widgets, titles, settings, positions and sizes, and shows it.
- F16 Delete a dashboard (Member, manage): A signed-in member chooses to delete a dashboard and confirms, and the website permanently deletes that dashboard and all of its widgets and returns to the dashboard list without it.

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

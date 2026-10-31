# Tidyboards: flows catalog

## Flows
- F01 Discover Tidyboards on landing page (Visitor, browse): A visitor arrives on the public landing page that explains tidy personal dashboards for notes, counts, tasks and links with examples of widgets, and the visitor chooses to get started. The website shows what dashboards are for, how creating a dashboard and adding widgets works, and offers paths to sign up and sign in.
- F02 Sign up as member (Member, auth): A new member starts sign-up from the landing page, provides email and password, and submits. The website creates the account, signs the member in, and shows their empty dashboard list ready to create the first dashboard.
- F03 Sign in as member (Member, auth): A returning member provides email and password to sign in. The website verifies the credentials and shows the member's own dashboard list with names and last-edited times.
- F04 Sign out (Member, auth): A signed-in member chooses to sign out. The website ends the session and shows the public landing page, hiding all private dashboards until the next sign-in.
- F05 Create a dashboard (Member, core): A signed-in member chooses Create from the dashboard list. The website creates a dashboard named Untitled dashboard, updates its last-edited time, and opens it in the editor ready for widgets.
- F06 View dashboard list (Member, browse): A signed-in member opens their dashboard list. The website shows all of the member's own dashboards with name and last-edited time ordered most-recently-edited first, or an invitation to create the first dashboard when empty, with a way to open any dashboard.
- F07 Open dashboard in editor (Member, core): A signed-in member selects a dashboard from the list. The website opens that dashboard in the editor showing its title and all its widgets with their content, ready to view and change with autosave.
- F08 Rename dashboard (Member, manage): A signed-in member edits a dashboard's name in the list or editor and saves it. The website validates the non-empty name, autosaves it, updates the last-edited time, and shows the new name in both list and editor.
- F09 Duplicate dashboard (Member, manage): A signed-in member chooses Duplicate on a dashboard. The website creates a copy named Copy of {name} with all widgets, settings and content copied, updates its last-edited time, and shows it alongside the original.
- F10 Delete dashboard (Member, manage): A signed-in member chooses Delete on a dashboard and confirms. The website permanently removes the dashboard and all its widgets, items and links, and shows the updated list without it.
- F11 Add widget to dashboard (Member, core): A signed-in member with a dashboard open chooses to add a widget, picks note, counter, checklist or link list with a title, and confirms. The website creates the medium-sized widget in the dashboard order, autosaves it, updates last-edited, and shows it ready to use and configure.
- F12 Arrange and rename widget (Member, manage): A signed-in member with a dashboard open renames a widget title, changes its size between small, medium and large, and moves it earlier or later relative to other widgets. The website autosaves each change, updates last-edited, and shows the widgets in the new order and appearance.
- F13 Remove widget (Member, manage): A signed-in member chooses Remove on a widget and confirms. The website permanently deletes the widget and its content, autosaves the dashboard, updates last-edited, and shows the dashboard without it.
- F14 Use note widget (Member, core): A signed-in member edits the plain text inside a note widget. The website autosaves the text, updates the dashboard last-edited time, and shows the updated note.
- F15 Use counter widget (Member, core): A signed-in member sets the counter label and uses plus and minus to increase or decrease its integer value by 1, allowing negatives. The website autosaves label and value, updates last-edited, and shows the current count.
- F16 Use checklist widget (Member, core): A signed-in member adds items with text to a checklist widget, ticks and unticks them to toggle state, and removes rows no longer needed. The website autosaves items and states, updates last-edited, and shows the current list with ticked states.
- F17 Use link-list widget (Member, core): A signed-in member adds titles with web addresses starting with http:// or https:// to a link-list widget, edits or removes entries, and selects a link to open it. The website autosaves entries, updates last-edited, shows the list, and opens the chosen address in a new tab.

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

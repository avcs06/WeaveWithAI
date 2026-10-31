# StudioDesk: flows catalog

## Flows
- F01 Visit landing page (Designer, browse): A visitor arrives on the public StudioDesk landing page which explains it is one calm workspace for a solo freelance designer to run clients, projects, and bookings, then chooses to sign up or sign in as the designer or to open the public booking page as a booker.
- F02 Designer signs up (Designer, auth): A new designer enters an email and password on the sign-up screen, submits, and lands directly on her home screen with an empty workspace ready for her first client, seeing only her own data afterwards.
- F03 Designer signs in (Designer, auth): A returning designer enters her email and password on the sign-in screen, submits, and returns to her home screen with today's sessions, follow-ups due this week, and overdue tasks.
- F04 Designer signs out (Designer, auth): The signed-in designer chooses to sign out from anywhere in the app and is returned to the public landing page, with her data kept for the next sign-in.
- F05 Add a client (Designer, core): The designer adds a client with name, email, optional company, profile, status, and optional follow-up date, saves it, and sees it appear in the client list where it persists.
- F06 View clients and handle follow-ups (Designer, browse): The designer opens the client list sorted with overdue follow-ups first, then soonest, then no date, sees who is due, and with one click marks a follow-up done which clears its date or pushes it a week which adds seven days.
- F07 Edit a client (Designer, manage): The designer opens a client, changes its name, email, company, profile, status, or follow-up date, saves, and sees the updated client details and list position.
- F08 Delete a client (Designer, manage): The designer chooses to delete a client, confirms, and sees it removed together with its projects, their tasks, and its notes, while sessions themselves remain with that client's seats freed.
- F09 Add and view client notes (Designer, core): The designer opens a client, views its dated notes newest first, jots a new note with date and text, sets or changes the follow-up date, and can delete a mistaken note.
- F10 Add a project (Designer, core): The designer creates a project under a chosen client with a name, short description, and optional due date, saves it, and sees it in the project list with its open task count.
- F11 Edit a project (Designer, manage): The designer opens a project, edits its name, description, or due date, saves, and sees the updated project in the list and detail view.
- F12 Delete a project (Designer, manage): The designer chooses to delete a project, confirms, and sees it removed together with all its tasks while the parent client remains.
- F13 View project list with open counts (Designer, browse): The designer opens the project list and sees every project with how many of its tasks are still open, then opens a project to continue work on it.
- F14 View and find tasks in a project (Designer, browse): The designer opens a project to see its tasks with overdue tasks standing out, searches by title and filters by status and priority to find the tasks she needs, then opens a task to continue work on it.
- F15 Add a task (Designer, core): The designer opens a project, adds a new task with title, status, priority, and optional due date, saves it, and sees it appear in the task list with updated open counts.
- F16 Edit a task (Designer, manage): The designer opens a task, changes its title, status, priority, or due date including ticking it Done quickly or moving it back to To do or In progress, saves, and sees the updated task and open counts.
- F17 Delete a task (Designer, manage): The designer chooses to delete a task from its project, confirms, and sees it removed with updated open counts while the project remains.
- F18 Set weekly availability (Designer, settings): The designer sets her weekly availability by choosing which days and from what time to what time she can be booked, saves it, and sees it used to generate open slots for the next two weeks.
- F19 Add a session type (Designer, settings): The designer adds a new session type with name, duration, displayed price, and maximum people, saves it, and sees it offered on the public booking page.
- F20 Edit a session type (Designer, settings): The designer opens a session type from the default discovery call, design review, and Figma workshop types or one she added, edits its name, duration, price display, or maximum people, saves, and sees the updated type on the booking page.
- F21 Delete a session type (Designer, settings): The designer chooses to delete a session type she no longer offers, confirms, and sees it removed so bookers can no longer pick it, while existing sessions already booked for it remain.
- F22 Book a session from public page (Booker, core): A booker without an account opens the public booking page, picks a session type with its displayed price, sees open slots for the next two weeks with full slots marked full, picks a slot, books with name and email, and sees a confirmation with a cancellation link on screen; a matching client email links the booking to that client, otherwise a new Lead client is created.
- F23 Cancel a booking via link (Booker, core): A booker opens the unique cancellation link shown after booking, views the booking details, and cancels just their own booking, freeing the seat for others.
- F24 View upcoming sessions and cancel a slot (Designer, core): The designer opens upcoming sessions with seats booked versus maximum, sees who booked each slot, and cancels a whole slot which cancels everyone booked on it.
- F25 View home dashboard (Designer, core): The designer opens her home screen to see today's sessions, follow-ups due this week including overdue styling, and overdue tasks, and jumps to the relevant client, project, or session from each item.

## Fields
- FD01 Designer email (required), e.g. "maya@studiomaya.in". Email the designer uses to sign up and sign in
- FD02 Password (required, 8 to 128 characters), e.g. "calm-studio-42". Secret that proves the designer owns the account
- FD03 Client name (required, up to 120 characters), e.g. "Aarav Mehta". How the designer refers to the client
- FD04 Client email (required), e.g. "aarav@brightkart.com". Email used to contact the client and to match bookings
- FD05 Company (optional, up to 120 characters), e.g. "Brightkart". Client company, when the client has one
- FD06 Profile (optional, up to 2000 characters), e.g. "Runs a D2C store, met at a design meetup, pays per project". Short profile of what the client does, how they met, and what they pay
- FD07 Client status (required, one of: Lead, Active, Past), e.g. "Lead". Whether the client is a Lead, Active, or Past
- FD08 Follow-up date (optional), e.g. "2026-11-07". When the designer should next follow up with the client
- FD09 Note date (required), e.g. "2026-11-02". The day the call or note happened
- FD10 Note text (required, up to 5000 characters), e.g. "Discussed homepage rework, will share wireframes next week". What was discussed or decided after a call
- FD11 Project name (required, up to 200 characters), e.g. "Checkout redesign". How the designer refers to the piece of work
- FD12 Project description (optional, up to 2000 characters), e.g. "Simplify checkout to reduce drop-offs". Short summary of what the project covers
- FD13 Project due date (optional), e.g. "2026-12-15". When the project should be finished, if there is a deadline
- FD14 Task title (required, up to 200 characters), e.g. "Draft homepage wireframes". What needs to be done in the project
- FD15 Task status (required, one of: To do, In progress, Done), e.g. "To do". Whether the task is To do, In progress, or Done
- FD16 Task priority (required, one of: Low, Medium, High), e.g. "High". How urgent the task is: Low, Medium, or High
- FD17 Task due date (optional), e.g. "2026-11-10". When the task should be finished, if there is a deadline
- FD18 Available days (required, any of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday), e.g. "Monday". Which weekdays the designer can be booked
- FD19 Available from (required), e.g. "10:00". Start of the bookable window on each available day
- FD20 Available to (required), e.g. "17:00". End of the bookable window on each available day
- FD21 Session type name (required, up to 120 characters), e.g. "Design review". How the bookable session is presented to bookers
- FD22 Duration in minutes (required, 15 to 480), e.g. "60". How long one session lasts
- FD23 Price display (required, up to 60 characters), e.g. "₹4,000". Price shown for information only, or Free; nobody pays in the app
- FD24 Maximum people (required, 1 to 50), e.g. "8". How many bookings a slot accepts before it is full
- FD25 Booker name (required, up to 120 characters), e.g. "Priya Nair". Name of the person booking a session
- FD26 Booker email (required), e.g. "priya@brightkart.com". Email of the person booking, used to link to a client
- FD27 Search tasks (optional, up to 120 characters), e.g. "wireframe". Free text to find tasks by title inside a project
- FD28 Chosen session type (required, one of the SessionType records), e.g. "Discovery call". Which kind of session the booker wants to book
- FD29 Chosen slot (required, one of the Session records), e.g. "2026-11-05 10:00". The specific date and start time the booker picks

## Forms
- FM01 Designer auth form: FD01, FD02
- FM02 Client form: FD03, FD04, FD05, FD06, FD07, FD08
- FM03 Note form: FD09, FD10
- FM04 Project form: FD11, FD12, FD13
- FM05 Task form: FD14, FD15, FD16, FD17
- FM06 Availability form: FD18, FD19, FD20
- FM07 Session type form: FD21, FD22, FD23, FD24
- FM08 Booking form: FD25, FD26

## STD01 Confirm deletion (standard subflow)

1. (system) The website asks to confirm the deletion and says what else will be removed with it.

Other paths
- STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
- STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.

## New assumptions
- A12 (behavior, affects F09): Notes are append-only history: the designer can add and view notes and delete a mistaken note, but cannot edit a note's date or text after saving, to keep call history trustworthy.
- A13 (presentation, affects F13): The project list is sorted by project due date soonest first, with projects without a due date last, then by name. Inside a project, overdue tasks are highlighted and task filters default to showing all statuses and priorities.
- A14 (behavior, affects F18, F22): Until the designer sets weekly availability, the public booking page shows no open slots and explains that no times are available yet. Availability changes apply to future slot generation only and never move or cancel existing Sessions or Bookings.

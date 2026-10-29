# Studio Hub: flows catalog

## Flows
- F01 Visit landing page (Freelancer, browse): A visitor not signed in arrives at the public landing page, reads what Studio Hub is for the solo designer, sees how to sign in or create an account and where visitors can book a session, then chooses to start sign-in, sign-up or open the public booking page.
- F02 Sign up (Freelancer, auth): A visitor without an account chooses to sign up, provides account email and password, submits, and on success is signed in and taken to the private home screen with starter session types ready.
- F03 Sign in (Freelancer, auth): A freelancer with an account chooses to sign in, enters account email and password, submits, and on success lands on the private home screen with today's sessions, follow-ups and overdue tasks.
- F04 Sign out (Freelancer, auth): The signed-in freelancer chooses to sign out, confirms leaving, and the website ends the session and returns to the public landing page with private data hidden.
- F05 See home for today (Freelancer, core): The signed-in freelancer opens home to start the day, sees today's sessions with times and bookings, follow-ups due this week with overdue first, and overdue tasks highlighted, and can jump to a session, client or task from each list.
- F06 Browse clients (Freelancer, browse): The freelancer opens the clients list, sees every client with status and next follow-up date ordered with overdue follow-ups first, opens a client to see its notes, projects and bookings, and can start adding a client when the list is empty.
- F07 Add a client (Freelancer, core): The freelancer chooses to add a client, fills the client form with name, email, company, profile and status, saves it, and the website adds the client as Lead by default choice and shows it in the clients list ready for notes and projects.
- F08 Edit and delete a client (Freelancer, manage): The freelancer opens a client, edits its details in the same client form and saves, or chooses to delete the client, confirms that its projects, tasks, notes and bookings will also be removed via the delete confirmation, and the website updates the clients list accordingly.
- F09 Add notes and handle follow-ups (Freelancer, core): The freelancer opens a client, adds a dated note with optional follow-up date which sets the client's next follow-up, reads past notes in date order, edits a note's text, note date or follow-up date and saves so the client's next follow-up updates accordingly, deletes a note via the delete confirmation so the note is removed, and from the client or home handles a due follow-up with one click to mark it done which clears the date or push it a week which adds 7 days.
- F10 Add a project (Freelancer, core): The freelancer opens a client, sees its projects with how many tasks are still open, chooses to add a project, fills name, description and optional due date, saves, and the website shows the new project with zero open tasks ready for tasks.
- F11 Edit and delete a project (Freelancer, manage): The freelancer opens a project, edits its name, description or due date and saves, or chooses to delete the project, confirms that its tasks will also be removed via the delete confirmation, and the website updates the projects list and open counts.
- F12 Work with tasks (Freelancer, core): The freelancer opens a project, sees its tasks with overdue tasks standing out, searches by title and filters by status and priority, adds a new task with title, status, priority and optional due date, and ticks a task done quickly which updates the open count and home overdue list.
- F13 Edit and delete a task (Freelancer, manage): The freelancer opens a task, edits its title, status, priority or due date and saves, or chooses to delete the task via the delete confirmation, and the website updates the task list and the project's open count.
- F14 Set weekly availability (Freelancer, settings): The freelancer opens availability settings, selects which weekdays are bookable and from what time to what time, saves, and the website stores the weekly window and regenerates open slots for the next two weeks for all session types.
- F15 Manage session types (Freelancer, manage): The freelancer views the session types starting as discovery, design review and workshop with durations, displayed prices and seat limits, creates new types, edits name, duration, displayed price or maximum seats, or deletes a type via the delete confirmation, with prices shown as text only and no payment taken.
- F16 Manage upcoming sessions (Freelancer, manage): The freelancer opens upcoming sessions, sees each slot with its type, date, times and bookings with seats booked versus maximum, opens a session to see who booked, and can cancel a whole slot via the delete confirmation which removes the slot and everyone booked on it.
- F17 Book a session as visitor (Booker, core): A visitor without an account opens the public booking page, picks a session type with its duration, displayed price and seats, sees open slots for the next two weeks with full slots marked full, chooses a slot and books with name and email, and the website matches the email to an existing client or creates a new Lead client, updates seats, and shows a confirmation with a cancellation link on screen with no emails sent.
- F18 Cancel booking via link (Booker, manage): A visitor opens their per-booking cancellation link without signing in, sees the booking and session details, chooses to cancel, confirms, and the website removes the booking, frees one seat and shows the booking as cancelled.

## Fields
- FD01 Account email (required, up to 254 characters), e.g. "freelancer@example.com". Email the freelancer uses to sign up and sign in
- FD02 Account password (required, 8 to 128 characters), e.g. "CalmStudio2026!". Secret that protects the private workspace
- FD03 Client name (required, 1 to 100 characters), e.g. "Aarav Mehta". Who the client is
- FD04 Client email (required, up to 254 characters), e.g. "aarav@brightkart.in". Contact email used for matching bookings to this client
- FD05 Client company (optional, up to 120 characters), e.g. "Brightkart". Company the client works for, if any
- FD06 Client profile (required, up to 1000 characters), e.g. "Runs Brightkart D2C store; met at design meetup; pays 60k per project.". What they do, how we met and what they pay
- FD07 Client status (required, one of: Lead, Active, Past), e.g. "Lead". Where the client is in the pipeline
- FD08 Note text (required, up to 2000 characters), e.g. "Discovery call: wants checkout redesign, worried about drop-off.". What was discussed or observed with the client
- FD09 Note date (required), e.g. "2026-10-20". Day the note refers to, defaults to today
- FD10 Follow-up date (optional), e.g. "2026-11-05". Day to follow up with the client; sets the client's next follow-up
- FD11 Project name (required, 1 to 120 characters), e.g. "Checkout redesign". What the project is called
- FD12 Project description (required, up to 1000 characters), e.g. "Redesign Brightkart checkout to lift conversion.". Short summary of the project scope
- FD13 Project due date (optional), e.g. "2026-12-15". Day the project should be finished, if any
- FD14 Task title (required, 1 to 200 characters), e.g. "Draft checkout wireframes". What needs to be done
- FD15 Task status (required, one of: To do, In progress, Done), e.g. "To do". Where the task is in its workflow
- FD16 Task priority (required, one of: Low, Medium, High), e.g. "High". How urgent the task is
- FD17 Task due date (optional), e.g. "2026-11-10". Day the task should be done, if any; past dates show as overdue
- FD18 Task search query (optional, up to 200 characters), e.g. "wireframes". Words to find tasks by title
- FD19 Task status filter (optional, one of: All, To do, In progress, Done), e.g. "In progress". Show only tasks with this status, or all tasks
- FD20 Task priority filter (optional, one of: All, Low, Medium, High), e.g. "High". Show only tasks with this priority, or all priorities
- FD21 Availability days (required, one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday), e.g. "Monday, Tuesday". Weekdays the freelancer can be booked
- FD22 Availability start time (required), e.g. "10:00". Time from which bookings can start on selected days
- FD23 Availability end time (required), e.g. "16:00". Time after which no new slot starts on selected days
- FD24 Session type name (required, 1 to 120 characters), e.g. "Discovery call". Name visitors see when picking what to book
- FD25 Session type duration in minutes (required, 15 to 480), e.g. "30". How long one slot of this type lasts
- FD26 Session type price display (required, at least 0), e.g. "4000". Price shown for information only in INR, 0 means free; nothing is charged
- FD27 Session type maximum seats (required, 1 to 20), e.g. "1". How many bookings a slot holds before it is full
- FD28 Booker name (required, 1 to 120 characters), e.g. "Priya Nair". Name of the visitor booking a session
- FD29 Booker email (required, up to 254 characters), e.g. "priya@craftloom.com". Email of the visitor booking; used to match to an existing client

## Forms
- FM01 Client form: FD03, FD04, FD05, FD06, FD07
- FM02 Project form: FD11, FD12, FD13
- FM03 Task form: FD14, FD15, FD16, FD17

## SF01 Confirm deletion (subflow)

1. The user chooses to delete the record. The website asks to confirm and explains what else will be removed with it.
2. The user confirms the deletion. The website deletes the record with everything it says will go with it and shows the updated list.

Other paths
- SF01.A01 (from 1, cancel) The user cancels: Nothing is deleted; the website shows the list as it was. Flow ends.
- SF01.A02 (from 2, failure) Deleting fails: The website keeps the record and offers to retry. Back to 2.
- SF01.A03 (from 2, notFound) The record is already gone: The website says it is already deleted and shows the updated list. Flow ends.

## New assumptions
- A09 (data, affects F07, F08, F17): Client emails are unique per freelancer case-insensitively; the client form rejects a duplicate email so booking auto-match stays reliable.
- A10 (behavior, affects F05, F09): Follow-ups due this week means follow-up date is today or within the next 7 calendar days, plus all overdue follow-ups not yet marked done.
- A11 (behavior, affects F10, F11, F12, F13): A project's open task count counts tasks whose status is not Done (To do plus In progress).
- A12 (behavior, affects F14, F15, F16, F17): Weekly availability is a single start-to-end time window applied to each selected weekday; open slots regenerate for the next 14 days after every availability or session-type change, excluding past times.
- A13 (scope, affects F15): A new freelancer workspace starts with the three named session types already present: 30min discovery free 1 seat, 60min design review 4000 1 seat, 120min Figma workshop 2500 8 seats, all editable and deletable with prices shown as text only.
- A14 (data, affects F17): A booking that creates a new Lead client fills name and email from the booking, leaves company empty and stores a profile noting it was auto-created from booking.
- A15 (behavior, affects F17, F18): Each booking gets a unique per-booking cancellation link that shows booking details without sign-in; opening it after cancellation shows a cancelled state.

## New questions
- Q03 (blocking): Should a freelancer be prevented from creating two clients with the same email? Why: Changes booking auto-match reliability and whether bookings can land under the wrong client Default: Yes, emails must be unique per freelancer case-insensitively and the form rejects duplicates
- Q04: In which time zone should availability windows and session times be shown to bookers? Why: Changes what slot times mean and whether bookings happen at the expected hour Default: Show all times in the freelancer's local browser time zone for both freelancer and bookers

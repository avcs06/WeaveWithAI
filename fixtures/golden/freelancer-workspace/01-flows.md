# Studio Hub: user flows

## F01 Visit landing page
Freelancer · browse · Goal: Understand what Studio Hub does and choose how to start.
Before: Not signed in.

1. The visitor arrives at the landing page. The website shows what Studio Hub is for the solo designer, how clients, projects, tasks and bookings work together, and how to sign in, create an account or open the public booking page.
2. The visitor chooses to start sign-in, sign-up or open the public booking page. The website starts the chosen entry and shows the sign-in screen, the sign-up screen or the public booking page.

Outcome: Nothing is stored; the visitor knows how to sign in, sign up or reach the booking page.

## F02 Sign up
Freelancer · auth · Goal: Create the private workspace account.
Before: Not signed in.

1. The visitor chooses to sign up. The website shows an empty sign-up screen asking for account email and account password.
2. The visitor fills in the account email and password and submits.
   - Account email (required, up to 254 characters), e.g. "freelancer@example.com"
   - Account password (required, 8 to 128 characters), e.g. "CalmStudio2026!"
   The website creates the account, signs the freelancer in and shows the private home screen with the three starter session types ready.
   Changes: creates SessionType.

Other paths
- F02.A01 (from 2, invalid) The account email is missing or not an email, or the account password is shorter than 8 characters: The website marks the fields, keeps what was typed and explains how to fix them. Back to 2.
- F02.A02 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.
- F02.A03 (from 2, conflict) The account email is already registered: The website says an account with that email already exists and offers to sign in instead. Flow ends.
- F02.A04 (from 1, cancel) The visitor cancels: Nothing is saved; the website shows the landing page as it was. Flow ends.

Outcome: Account is created and the freelancer is signed in; a refresh still shows the private home.

## F03 Sign in
Freelancer · auth · Goal: Access the private workspace.
Before: Has an account.; Not signed in.

1. The freelancer chooses to sign in. The website shows an empty sign-in screen asking for account email and account password.
2. The freelancer enters the account email and password and submits.
   - Account email (required, up to 254 characters), e.g. "freelancer@example.com"
   - Account password (required, 8 to 128 characters), e.g. "CalmStudio2026!"
   The website signs the freelancer in and shows the private home screen with today's sessions, follow-ups and overdue tasks.

Other paths
- F03.A01 (from 2, invalid) The account email is missing or not an email, or the account password is missing: The website marks the fields, keeps what was typed and explains how to fix them. Back to 2.
- F03.A02 (from 2, failure) Signing in fails: The website keeps the values and offers to retry. Back to 2.
- F03.A03 (from 2, denied) The email and password do not match an account: The website says the details were not recognised, keeps the email and offers to retry or sign up. Back to 2.
- F03.A04 (from 1, cancel) The visitor cancels: Nothing changes; the website shows the landing page as it was. Flow ends.

Outcome: Freelancer is signed in and sees the home screen; a refresh stays signed in.

## F04 Sign out
Freelancer · auth · Goal: Leave the workspace securely.
Before: Signed in.

1. The freelancer chooses to sign out. The website asks to confirm leaving the workspace.
2. The freelancer confirms leaving. The website ends the session and shows the public landing page with private data hidden.

Other paths
- F04.A01 (from 1, cancel) The freelancer cancels: Nothing changes; the website shows the home screen as it was and the freelancer stays signed in. Flow ends.
- F04.A02 (from 2, failure) Signing out fails: The website keeps the freelancer signed in and offers to retry. Back to 2.

Outcome: Freelancer is signed out; a refresh shows the landing page and private data stays hidden until sign-in.

## F05 See home for today
Freelancer · core · Goal: Start the day from today's sessions, this week's follow-ups and overdue tasks.
Before: Signed in.

1. The freelancer opens home. The website shows today's sessions with times and bookings, follow-ups due this week with overdue first, and overdue tasks highlighted.
   Changes: lists Session, lists Booking, lists Client, lists Task.
2. The freelancer chooses a session, client or task to open. The website opens the chosen session, client or task with its details.
   Changes: reads Session, reads Client, reads Task.

Other paths
- F05.A01 (from 1, empty) There are no sessions today, no follow-ups due this week and no overdue tasks: The website shows each list as empty with guidance to add clients, projects and tasks and to set availability so sessions can be booked. Back to 1.
- F05.A02 (from 2, notFound) The chosen session, client or task is no longer there: The website says it is no longer available and shows the home lists as they are now. Back to 1.

Outcome: Nothing is changed; a refresh still shows the same three lists for today.

## F06 Browse clients
Freelancer · browse · Goal: See all clients with follow-up urgency, overdue first.
Before: Signed in.

1. The freelancer opens the clients list. The website shows every client with status and next follow-up date ordered with overdue follow-ups first.
   Changes: lists Client.
2. The freelancer opens a client. The website shows the client details with its notes in date order, its projects with open task counts, and its bookings.
   Changes: reads Client, lists Note, lists Project, lists Booking.

Other paths
- F06.A01 (from 1, empty) There are no clients yet: The website says no clients have been added yet and offers to add the first client. Flow ends.
- F06.A02 (from 2, empty) The client has no notes, projects or bookings yet: The website shows the client details with empty notes, projects and bookings and offers to add a note or a project. Back to 2.
- F06.A03 (from 2, notFound) The client is no longer there: The website says the client is no longer there and shows the updated clients list. Back to 1.

Outcome: Nothing is changed; a refresh shows the same ordered client list.

## F07 Add a client
Freelancer · core · Goal: Add a new client to track.
Before: Signed in.

1. The freelancer chooses to add a client. The website shows an empty client form.
2. The freelancer fills in the client and saves it. (Client form)
   - Client name (required, 1 to 100 characters), e.g. "Aarav Mehta"
   - Client email (required, up to 254 characters), e.g. "aarav@brightkart.in"
   - Client company (optional, up to 120 characters), e.g. "Brightkart"
   - Client profile (required, up to 1000 characters), e.g. "Runs Brightkart D2C store; met at design meetup; pays 60k per project."
   - Client status (required, one of: Lead, Active, Past), e.g. "Lead"
   The website saves the client and shows it in the clients list ready for notes and projects.
   Changes: creates Client.

Other paths
- F07.A01 (from 2, invalid) A required value is missing, the email is not an email, or the profile is too long: The website marks the fields, keeps what was typed and explains how to fix them. Back to 2.
- F07.A02 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.
- F07.A03 (from 2, conflict) Another client already uses that email: The website marks the client email, keeps what was typed and explains it must be unique. Back to 2.
- F07.A04 (from 1, cancel) The freelancer cancels: Nothing is saved; the website shows the clients list as it was. Flow ends.

Outcome: New client is saved with its status and empty notes and projects; a refresh still lists it.

## F08 Edit and delete a client
Freelancer · manage · Goal: Keep client details correct and remove clients no longer needed.
Before: Signed in.; At least one client exists.

1. The freelancer opens a client. The website shows the client details with current values in the client form.
   Changes: reads Client.
2. The freelancer edits the client details and saves them. (Client form)
   - Client name (required, 1 to 100 characters), e.g. "Aarav Mehta"
   - Client email (required, up to 254 characters), e.g. "aarav@brightkart.in"
   - Client company (optional, up to 120 characters), e.g. "Brightkart"
   - Client profile (required, up to 1000 characters), e.g. "Runs Brightkart D2C store; met at design meetup; pays 60k per project."
   - Client status (required, one of: Lead, Active, Past), e.g. "Lead"
   The website saves the changes and shows the updated client and clients list.
   Changes: updates Client.
3. Confirm deletion (subflow SF01):
   1. The user chooses to delete the record. The website asks to confirm and explains what else will be removed with it.
   2. The user confirms the deletion. The website deletes the record with everything it says will go with it and shows the updated list.

   Other paths
   - SF01.A01 (from 1, cancel) The user cancels: Nothing is deleted; the website shows the list as it was. Flow ends.
   - SF01.A02 (from 2, failure) Deleting fails: The website keeps the record and offers to retry. Back to 2.
   - SF01.A03 (from 2, notFound) The record is already gone: The website says it is already deleted and shows the updated list. Flow ends.
4. (system) The website has deleted the client with its projects, tasks, notes and bookings and shows the updated clients list.
   Changes: deletes Client, deletes Project, deletes Task, deletes Note, deletes Booking.

Other paths
- F08.A01 (from 2, invalid) A required value is missing, the email is not an email, or the profile is too long: The website marks the fields, keeps what was typed and explains how to fix them. Back to 2.
- F08.A02 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.
- F08.A03 (from 2, conflict) Another client already uses that email: The website marks the client email, keeps what was typed and explains it must be unique. Back to 2.
- F08.A04 (from 1, notFound) The client is already gone: The website says the client is already deleted and shows the updated clients list. Flow ends.
- F08.A05 (from 2, notFound) The client is already gone when saving: The website says the client is already deleted and shows the updated clients list. Flow ends.
- F08.A06 (from 3, cancel) The freelancer cancels the deletion: Nothing is deleted; the website shows the client as it was. Flow ends.

Outcome: Edits are saved or the client with its projects, tasks, notes and bookings is removed; a refresh shows the updated list.

## F09 Add notes and handle follow-ups
Freelancer · core · Goal: Record dated notes and stay on top of follow-ups.
Before: Signed in.; At least one client exists.

1. The freelancer opens a client to see its notes and follow-up state. The website shows the client details with its notes in date order, each with its follow-up date, and the client's next follow-up date with options to mark done or push a week.
   Changes: reads Client, lists Note.
2. The freelancer chooses to add a note. The website shows an empty note form with today's date filled in.
3. The freelancer fills in the note text, note date and optional follow-up date and saves it.
   - Note text (required, up to 2000 characters), e.g. "Discovery call: wants checkout redesign, worried about drop-off."
   - Note date (required), e.g. "2026-10-20"
   - Follow-up date (optional), e.g. "2026-11-05"
   The website saves the note, updates the client's next follow-up date from the follow-up date and shows the updated notes and follow-up state.
   Changes: creates Note, updates Client.
4. The freelancer edits a note's text, note date or follow-up date and saves it.
   - Note text (required, up to 2000 characters), e.g. "Discovery call: wants checkout redesign, worried about drop-off."
   - Note date (required), e.g. "2026-10-20"
   - Follow-up date (optional), e.g. "2026-11-05"
   The website saves the changes, updates the client's next follow-up date and shows the updated notes.
   Changes: updates Note, updates Client.
5. Confirm deletion (subflow SF01):
   1. The user chooses to delete the record. The website asks to confirm and explains what else will be removed with it.
   2. The user confirms the deletion. The website deletes the record with everything it says will go with it and shows the updated list.

   Other paths
   - SF01.A01 (from 1, cancel) The user cancels: Nothing is deleted; the website shows the list as it was. Flow ends.
   - SF01.A02 (from 2, failure) Deleting fails: The website keeps the record and offers to retry. Back to 2.
   - SF01.A03 (from 2, notFound) The record is already gone: The website says it is already deleted and shows the updated list. Flow ends.
6. (system) The website shows the notes without the deleted note and the updated next follow-up date.
   Changes: deletes Note, updates Client.
7. The freelancer marks a due follow-up done with one click. The website clears the client's next follow-up date and shows the follow-up as done.
   Changes: updates Client.
8. The freelancer pushes a due follow-up a week with one click. The website adds 7 days to the client's next follow-up date and shows the new date.
   Changes: updates Client.

Other paths
- F09.A01 (from 1, empty) No notes exist yet for the client: The website shows that there are no notes yet and offers to add the first note. Back to 2.
- F09.A02 (from 2, cancel) The freelancer cancels adding the note: Nothing is saved; the website shows the notes as they were. Back to 1.
- F09.A03 (from 3, invalid) Note text is empty or dates are not valid: The website marks the fields and keeps what was typed. Back to 3.
- F09.A04 (from 3, failure) Saving the note fails: The website keeps the values and offers to retry. Back to 3.
- F09.A05 (from 4, invalid) Edited text is empty or dates are not valid: The website marks the fields and keeps what was typed. Back to 4.
- F09.A06 (from 4, failure) Saving the edited note fails: The website keeps the values and offers to retry. Back to 4.
- F09.A07 (from 4, notFound) The note is already gone: The website says the note is already deleted and shows the updated notes. Back to 1.
- F09.A08 (from 7, failure) Marking the follow-up done fails: The website keeps the follow-up date and offers to retry. Back to 7.
- F09.A09 (from 8, failure) Pushing the follow-up a week fails: The website keeps the follow-up date and offers to retry. Back to 8.
- F09.A10 (from 5, cancel) The freelancer cancels the deletion: Nothing is deleted; the website shows the notes as they were. Back to 1.

Outcome: Notes are saved, edited or deleted and the client's next follow-up date is updated or cleared; a refresh shows the same notes and follow-up state.

## F10 Add a project
Freelancer · core · Goal: Start a project for a client.
Before: Signed in.; At least one client exists.

1. The freelancer opens a client to see its projects with open task counts. The website shows the client with its projects, each with how many tasks are still open.
   Changes: reads Client, lists Project, lists Task.
2. The freelancer chooses to add a project. The website shows an empty project form.
3. The freelancer fills in the project name, description and optional due date and saves it. (Project form)
   - Project name (required, 1 to 120 characters), e.g. "Checkout redesign"
   - Project description (required, up to 1000 characters), e.g. "Redesign Brightkart checkout to lift conversion."
   - Project due date (optional), e.g. "2026-12-15"
   The website saves the project under the client and shows it with zero open tasks.
   Changes: creates Project.

Other paths
- F10.A01 (from 1, empty) The client has no projects yet: The website shows that there are no projects yet and offers to add the first project. Back to 2.
- F10.A02 (from 2, cancel) The freelancer cancels adding the project: Nothing is saved; the website shows the projects as they were. Back to 1.
- F10.A03 (from 3, invalid) Required project fields are empty or too long: The website marks the fields and keeps what was typed. Back to 3.
- F10.A04 (from 3, failure) Saving the project fails: The website keeps the values and offers to retry. Back to 3.

Outcome: Project is saved under its client; a refresh still shows it with its open task count.

## F11 Edit and delete a project
Freelancer · manage · Goal: Keep projects correct and remove finished ones.
Before: Signed in.; At least one project exists.

1. The freelancer opens a project to see its details and tasks. The website shows the project name, description, due date and its tasks with the open task count.
   Changes: reads Project, lists Task.
2. The freelancer edits the project name, description or due date and saves it. (Project form)
   - Project name (required, 1 to 120 characters), e.g. "Checkout redesign"
   - Project description (required, up to 1000 characters), e.g. "Redesign Brightkart checkout to lift conversion."
   - Project due date (optional), e.g. "2026-12-15"
   The website saves the changes and shows the updated project.
   Changes: updates Project.
3. Confirm deletion (subflow SF01):
   1. The user chooses to delete the record. The website asks to confirm and explains what else will be removed with it.
   2. The user confirms the deletion. The website deletes the record with everything it says will go with it and shows the updated list.

   Other paths
   - SF01.A01 (from 1, cancel) The user cancels: Nothing is deleted; the website shows the list as it was. Flow ends.
   - SF01.A02 (from 2, failure) Deleting fails: The website keeps the record and offers to retry. Back to 2.
   - SF01.A03 (from 2, notFound) The record is already gone: The website says it is already deleted and shows the updated list. Flow ends.
4. (system) The website shows the projects list without the deleted project and its tasks.
   Changes: deletes Project, deletes Task.

Other paths
- F11.A01 (from 1, empty) The project has no tasks yet: The website shows that there are no tasks yet and offers to add tasks or edit the project. Back to 2.
- F11.A02 (from 2, invalid) Edited fields are empty or too long: The website marks the fields and keeps what was typed. Back to 2.
- F11.A03 (from 2, failure) Saving the project edits fails: The website keeps the values and offers to retry. Back to 2.
- F11.A04 (from 1, notFound) The project is already gone: The website says the project no longer exists and shows the projects list. Flow ends.
- F11.A05 (from 2, notFound) The project is already gone when saving edits: The website says the project no longer exists and shows the projects list. Flow ends.
- F11.A06 (from 3, cancel) The freelancer cancels the deletion: Nothing is deleted; the website shows the project as it was. Back to 1.

Outcome: Edits are saved or the project with its tasks is deleted; a refresh shows the updated project list.

## F12 Work with tasks
Freelancer · core · Goal: Track and complete project tasks quickly.
Before: Signed in.; At least one project exists.

1. The freelancer opens a project to see its tasks. The website shows the project with its tasks, open task count, and overdue tasks standing out with status, priority and due date.
   Changes: reads Project, lists Task.
2. The freelancer searches by title and filters by status and priority.
   - Task search query (optional, up to 200 characters), e.g. "wireframes"
   - Task status filter (optional, one of: All, To do, In progress, Done), e.g. "In progress"
   - Task priority filter (optional, one of: All, Low, Medium, High), e.g. "High"
   The website shows only the tasks matching the search and filters, with overdue tasks standing out.
   Changes: lists Task.
3. The freelancer chooses to add a task. The website shows an empty task form.
4. The freelancer fills in the task title, status, priority and optional due date and saves it. (Task form)
   - Task title (required, 1 to 200 characters), e.g. "Draft checkout wireframes"
   - Task status (required, one of: To do, In progress, Done), e.g. "To do"
   - Task priority (required, one of: Low, Medium, High), e.g. "High"
   - Task due date (optional), e.g. "2026-11-10"
   The website saves the task and shows it in the task list with the updated open count.
   Changes: creates Task.
5. The freelancer ticks a task done quickly. The website marks the task Done, updates the open count and removes it from overdue.
   Changes: updates Task.

Other paths
- F12.A01 (from 1, empty) The project has no tasks yet: The website shows that there are no tasks yet and offers to add the first task. Back to 3.
- F12.A02 (from 2, empty) No tasks match the search or filters: The website shows that nothing matches and offers to clear the search or filters or add a task. Back to 2.
- F12.A03 (from 3, cancel) The freelancer cancels adding the task: Nothing is saved; the website shows the tasks as they were. Back to 1.
- F12.A04 (from 4, invalid) Task title is empty or fields are not valid: The website marks the fields and keeps what was typed. Back to 4.
- F12.A05 (from 4, failure) Saving the task fails: The website keeps the values and offers to retry. Back to 4.
- F12.A06 (from 5, failure) Marking the task done fails: The website keeps the task status and offers to retry. Back to 5.
- F12.A07 (from 5, notFound) The task is already gone when ticking done: The website says the task no longer exists and shows the updated task list. Back to 1.

Outcome: Tasks are added or marked Done and the list reflects current search and filters; a refresh shows the same tasks and counts.

## F13 Edit and delete a task
Freelancer · manage · Goal: Correct task details and remove unneeded tasks.
Before: Signed in.; At least one task exists.

1. The freelancer opens a task to see its details. The website shows the task title, status, priority and due date.
   Changes: reads Task.
2. The freelancer edits the task title, status, priority or due date and saves it. (Task form)
   - Task title (required, 1 to 200 characters), e.g. "Draft checkout wireframes"
   - Task status (required, one of: To do, In progress, Done), e.g. "To do"
   - Task priority (required, one of: Low, Medium, High), e.g. "High"
   - Task due date (optional), e.g. "2026-11-10"
   The website saves the changes and shows the updated task with the updated open count.
   Changes: updates Task.
3. Confirm deletion (subflow SF01):
   1. The user chooses to delete the record. The website asks to confirm and explains what else will be removed with it.
   2. The user confirms the deletion. The website deletes the record with everything it says will go with it and shows the updated list.

   Other paths
   - SF01.A01 (from 1, cancel) The user cancels: Nothing is deleted; the website shows the list as it was. Flow ends.
   - SF01.A02 (from 2, failure) Deleting fails: The website keeps the record and offers to retry. Back to 2.
   - SF01.A03 (from 2, notFound) The record is already gone: The website says it is already deleted and shows the updated list. Flow ends.
4. (system) The website shows the task list without the deleted task and the updated open count.
   Changes: deletes Task.

Other paths
- F13.A01 (from 2, invalid) Edited fields are empty or not valid: The website marks the fields and keeps what was typed. Back to 2.
- F13.A02 (from 2, failure) Saving the task edits fails: The website keeps the values and offers to retry. Back to 2.
- F13.A03 (from 1, notFound) The task is already gone: The website says the task no longer exists and shows the task list. Flow ends.
- F13.A04 (from 2, notFound) The task is already gone when saving edits: The website says the task no longer exists and shows the task list. Flow ends.
- F13.A05 (from 4, empty) No tasks remain after deletion: The website shows that there are no tasks left and offers to add a task. Flow ends.
- F13.A06 (from 3, cancel) The freelancer cancels the deletion: Nothing is deleted; the website shows the task as it was. Back to 1.

Outcome: Edits are saved or the task is removed; a refresh shows the updated task list and open counts.

## F14 Set weekly availability
Freelancer · settings · Goal: Define when visitors can book.
Before: Signed in.

1. The freelancer opens availability settings. The website shows the current weekly days with start to end time and how open slots for the next two weeks are derived from them.
   Changes: reads Availability.
2. The freelancer selects weekdays and start to end time and saves them.
   - Availability days (required, one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday), e.g. "Monday, Tuesday"
   - Availability start time (required), e.g. "10:00"
   - Availability end time (required), e.g. "16:00"
   The website saves the weekly window and regenerates open slots for the next two weeks for all session types, excluding past times.
   Changes: updates Availability, creates Session, deletes Session.

Other paths
- F14.A01 (from 1, empty) No availability is set yet: The website shows that no weekly availability is set yet and offers to set days and times. Back to 2.
- F14.A02 (from 2, invalid) No days are selected or end time is not after start time: The website marks the fields and keeps what was chosen. Back to 2.
- F14.A03 (from 2, failure) Saving availability fails: The website keeps the chosen days and times and offers to retry. Back to 2.
- F14.A04 (from 2, cancel) The freelancer cancels without saving: Nothing is saved; the website shows the availability as it was. Back to 1.

Outcome: Weekly availability is saved; a refresh shows the same days and times and booking slots reflect them.

## F15 Manage session types
Freelancer · manage · Goal: Define bookable session types with durations, displayed prices and seat limits.
Before: Signed in.

1. The freelancer views the session types. The website shows the session types with name, duration, price shown as text only and maximum seats, starting with discovery, design review and workshop.
   Changes: lists SessionType.
2. The freelancer chooses to create a session type. The website shows an empty session type form.
3. The freelancer fills in name, duration, displayed price and maximum seats and saves it.
   - Session type name (required, 1 to 120 characters), e.g. "Discovery call"
   - Session type duration in minutes (required, 15 to 480), e.g. "30"
   - Session type price display (required, at least 0), e.g. "4000"
   - Session type maximum seats (required, 1 to 20), e.g. "1"
   The website saves the session type with its price shown as text only and shows it in the types list with no payment taken.
   Changes: creates SessionType.
4. The freelancer edits a session type name, duration, displayed price or maximum seats and saves it.
   - Session type name (required, 1 to 120 characters), e.g. "Discovery call"
   - Session type duration in minutes (required, 15 to 480), e.g. "30"
   - Session type price display (required, at least 0), e.g. "4000"
   - Session type maximum seats (required, 1 to 20), e.g. "1"
   The website saves the changes and shows the updated session types with prices shown as text only.
   Changes: updates SessionType.
5. Confirm deletion (subflow SF01):
   1. The user chooses to delete the record. The website asks to confirm and explains what else will be removed with it.
   2. The user confirms the deletion. The website deletes the record with everything it says will go with it and shows the updated list.

   Other paths
   - SF01.A01 (from 1, cancel) The user cancels: Nothing is deleted; the website shows the list as it was. Flow ends.
   - SF01.A02 (from 2, failure) Deleting fails: The website keeps the record and offers to retry. Back to 2.
   - SF01.A03 (from 2, notFound) The record is already gone: The website says it is already deleted and shows the updated list. Flow ends.
6. (system) The website shows the session types without the deleted type.
   Changes: deletes SessionType.

Other paths
- F15.A01 (from 1, empty) No session types exist: The website shows that there are no session types yet and offers to create one. Back to 2.
- F15.A02 (from 2, cancel) The freelancer cancels creating the session type: Nothing is saved; the website shows the session types as they were. Back to 1.
- F15.A03 (from 3, invalid) Required session type fields are empty or out of range: The website marks the fields and keeps what was typed. Back to 3.
- F15.A04 (from 3, failure) Saving the new session type fails: The website keeps the values and offers to retry. Back to 3.
- F15.A05 (from 4, invalid) Edited session type fields are empty or out of range: The website marks the fields and keeps what was typed. Back to 4.
- F15.A06 (from 4, failure) Saving the edited session type fails: The website keeps the values and offers to retry. Back to 4.
- F15.A07 (from 4, notFound) The session type is already gone when saving edits: The website says the session type no longer exists and shows the updated types. Back to 1.
- F15.A08 (from 5, cancel) The freelancer cancels the deletion: Nothing is deleted; the website shows the session types as they were. Back to 1.

Outcome: Session types are saved; a refresh shows the same types and the booking page offers them with prices displayed only.

## F16 Manage upcoming sessions
Freelancer · manage · Goal: See upcoming sessions with bookings and free cancelled time.
Before: Signed in.; Availability and at least one session type exist.

1. The freelancer opens upcoming sessions. The website shows each upcoming slot with its session type, date, start and end time and bookings with seats booked versus maximum.
   Changes: lists Session, lists Booking.
2. The freelancer opens a session to see who booked. The website shows the session details with the list of bookings by name and email and seats booked versus maximum.
   Changes: reads Session, lists Booking.
3. Confirm deletion (subflow SF01):
   1. The user chooses to delete the record. The website asks to confirm and explains what else will be removed with it.
   2. The user confirms the deletion. The website deletes the record with everything it says will go with it and shows the updated list.

   Other paths
   - SF01.A01 (from 1, cancel) The user cancels: Nothing is deleted; the website shows the list as it was. Flow ends.
   - SF01.A02 (from 2, failure) Deleting fails: The website keeps the record and offers to retry. Back to 2.
   - SF01.A03 (from 2, notFound) The record is already gone: The website says it is already deleted and shows the updated list. Flow ends.
4. (system) The website shows the upcoming sessions without the cancelled slot and its bookings.
   Changes: deletes Session, deletes Booking.

Other paths
- F16.A01 (from 1, empty) No upcoming sessions exist: The website shows that there are no upcoming sessions and explains that slots appear from availability and session types. Flow ends.
- F16.A02 (from 2, empty) The session has no bookings yet: The website shows the session details with no bookings yet and seats available. Back to 2.
- F16.A03 (from 2, notFound) The session is already gone when opening it: The website says the session no longer exists and shows the upcoming sessions. Back to 1.
- F16.A04 (from 4, empty) No sessions remain after cancellation: The website shows that there are no upcoming sessions left. Flow ends.
- F16.A05 (from 3, cancel) The freelancer cancels the deletion: Nothing is deleted; the website shows the session as it was. Back to 2.

Outcome: Cancelled slots with their bookings are removed; remaining sessions are still listed after a refresh.

## F17 Book a session as visitor
Booker · core · Goal: Book an open slot without an account.
Before: Not signed in.; Availability and at least one session type exist.

1. The booker opens the public booking page. The website shows the session types with duration, displayed price and maximum seats.
   Changes: lists SessionType.
2. The booker picks a session type. The website shows open slots for the next two weeks for that type with dates and times, marking full slots as full.
   Changes: lists Session, reads SessionType.
3. The booker chooses an open slot. The website shows the chosen slot summary and an empty booking form asking for name and email.
   Changes: reads Session.
4. The booker fills in name and email and confirms the booking.
   - Booker name (required, 1 to 120 characters), e.g. "Priya Nair"
   - Booker email (required, up to 254 characters), e.g. "priya@craftloom.com"
   The website saves the booking under the matched client or a new Lead client, updates seats to close full slots, and shows a confirmation with the booking details and a cancellation link on screen; no email is sent.
   Changes: creates Booking, reads Client, creates Client, updates Session.

Other paths
- F17.A01 (from 1, empty) No session types are available: The website says no sessions are offered right now and suggests checking back later. Flow ends.
- F17.A02 (from 2, empty) There are no open slots for the chosen type in the next two weeks: The website says no open slots are available for that type and suggests picking another session type. Back to 1.
- F17.A03 (from 4, invalid) The name is empty or the email is missing or not an email: The website marks the fields and keeps what was typed. Back to 4.
- F17.A04 (from 4, failure) Saving the booking fails: The website keeps the entered values and offers to retry. Back to 4.
- F17.A05 (from 4, conflict) The slot became full before booking completed: The website says the slot just became full and shows the other open slots. Back to 2.
- F17.A06 (from 4, notFound) The chosen slot was cancelled and no longer exists: The website says the slot is no longer available and shows the remaining open slots. Back to 2.

Outcome: Booking is saved under the matched or new Lead client and seat counts update with full slots closed; the confirmation with cancellation link is still available via the link.

## F18 Cancel booking via link
Booker · manage · Goal: Cancel a booking without signing in.
Before: Not signed in.; Has a booking cancellation link.

1. The booker opens the cancellation link. The website shows the booking with its session type, date and times without requiring sign-in.
   Changes: reads Booking, reads Session.
2. Confirm deletion (subflow SF01):
   1. The user chooses to delete the record. The website asks to confirm and explains what else will be removed with it.
   2. The user confirms the deletion. The website deletes the record with everything it says will go with it and shows the updated list.

   Other paths
   - SF01.A01 (from 1, cancel) The user cancels: Nothing is deleted; the website shows the list as it was. Flow ends.
   - SF01.A02 (from 2, failure) Deleting fails: The website keeps the record and offers to retry. Back to 2.
   - SF01.A03 (from 2, notFound) The record is already gone: The website says it is already deleted and shows the updated list. Flow ends.
3. (system) The website removes the booking, frees one seat while keeping the session for others, and shows the booking as cancelled.
   Changes: deletes Booking, updates Session.

Other paths
- F18.A01 (from 1, notFound) The link is invalid or the booking is already gone: The website says the booking cannot be found and suggests contacting the freelancer. Flow ends.
- F18.A02 (from 1, other) The booking is already cancelled: The website shows the booking as already cancelled with its session details; no further action is needed. Flow ends.
- F18.A03 (from 3, failure) Cancelling the booking fails: The website keeps the booking and offers to retry. Back to 3.
- F18.A04 (from 2, cancel) The booker backs out before confirming: Nothing is cancelled; the website shows the booking as it was. Flow ends.

Outcome: Booking is removed and its seat is freed while the session stays for others; a refresh shows the booking as cancelled.

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

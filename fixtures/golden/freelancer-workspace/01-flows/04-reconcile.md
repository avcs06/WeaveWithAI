# Solo Studio: user flows

## F01 View landing page and get started
Designer · browse · Goal: Understand what the app does and get started.
Before: Not signed in.

1. The visitor opens the landing page. The website shows what Solo Studio is for freelance client, project and booking management and how to start as designer or view public booking.
2. The visitor chooses to get started as designer. The website shows the designer sign-up page.

Other paths
- F01.A01 (from 2, other) The visitor chooses to view public booking instead: The website shows the public booking page with session types and open slots for the next two weeks. Flow ends.
- F01.A02 (from 2, other) The visitor already has an account and chooses to sign in: The website shows the designer sign-in page. Flow ends.

Outcome: Nothing is stored; after refresh the landing page still shows the same explanation and start options.

## F02 Designer sign up
Designer · auth · Goal: Create an account and reach home.
Before: Not signed in.

1. The designer chooses to sign up. The website shows an empty designer sign-up form.
2. The designer fills in the sign-up form and submits it. (Designer sign-up form)
   - Designer email (required), e.g. "maya@mayastudio.in"
   - Designer password (required, at least 8 characters), e.g. "calm-studio-42"
   The website creates the isolated workspace, signs the designer in and shows home ready to add the first client.

Other paths
- F02.A01 (from 2, invalid) The email is invalid or the password is shorter than 8 characters: The website marks what is wrong and keeps what was typed. Back to 2.
- F02.A02 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.
- F02.A03 (from 2, conflict) The email is already registered: The website says the email already has an account and offers to sign in instead. Back to 2.
- F02.A04 (from 2, cancel) The designer cancels without signing up: Nothing is stored; the website shows the landing page as it was. Flow ends.

Outcome: A designer account exists and the designer is signed in; refresh still shows home.

## F03 Designer sign in
Designer · auth · Goal: Sign in to the workspace.
Before: Not signed in.

1. The designer chooses to sign in. The website shows an empty designer sign-in form.
2. The designer fills in the sign-in form and submits it. (Designer sign-in form)
   - Designer email (required), e.g. "maya@mayastudio.in"
   - Designer password (required, at least 8 characters), e.g. "calm-studio-42"
   The website verifies the credentials and shows home with today's sessions, follow-ups and overdue tasks.

Other paths
- F03.A01 (from 2, invalid) The email or password is empty or invalid: The website marks what is wrong and keeps what was typed. Back to 2.
- F03.A02 (from 2, failure) Signing in fails: The website keeps the values and offers to retry. Back to 2.
- F03.A03 (from 2, denied) The email and password do not match an account: The website says the credentials are wrong and offers to try again. Back to 2.

Outcome: The designer is signed in; refresh still shows signed-in home.

## F04 Designer sign out
Designer · auth · Goal: Securely leave the workspace.
Before: Signed in.

1. The designer chooses to sign out. The website ends the session and shows the public landing page.

Outcome: The designer is signed out; refresh still shows the landing page.

## F05 View home dashboard
Designer · core · Goal: See what needs attention today.
Before: Signed in.

1. The designer opens home. The website shows today's sessions, follow-ups due this week including overdue, and overdue tasks with overdue highlight, each of which can be opened.
   Changes: lists Session, lists Note, lists Task.
2. The designer chooses a session, follow-up or overdue task to view. The website shows the details of that session, client note or task.
   Changes: reads Session, reads Note, reads Task.

Other paths
- F05.A01 (from 1, empty) There are no sessions today, no follow-ups due this week and no overdue tasks: The website shows an empty home with guidance to add a first client and set availability. Flow ends.
- F05.A02 (from 2, notFound) The chosen session, note or task was deleted in the meantime: The website says the item is gone and shows home again. Back to 1.

Outcome: Nothing is stored; refresh still shows the same today's sessions, follow-ups and overdue tasks.

## F06 Add a client
Designer · core · Goal: Remember a new client.
Before: Signed in.

1. The designer chooses to add a client. The website shows an empty client form.
2. The designer fills in the client and saves it. (Client form)
   - Client name (required, up to 120 characters), e.g. "Ananya Rao"
   - Client email (required), e.g. "ananya@craftly.in"
   - Client company (optional, up to 120 characters), e.g. "Craftly"
   - Client profile (optional, up to 1000 characters), e.g. "Runs a D2C skincare brand, met at Design Day, pays per milestone"
   - Client status (required, one of: Lead, Active, Past), e.g. "Lead"
   The website saves the client and shows its details with its follow-up state.
   Changes: creates Client.

Other paths
- F06.A01 (from 2, invalid) The name or email is empty or invalid: The website marks what is wrong and keeps what was typed. Back to 2.
- F06.A02 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.
- F06.A03 (from 2, cancel) The designer cancels without saving: Nothing is saved; the website shows the client list as it was. Flow ends.

Outcome: A new client is saved and still appears in the client list after refresh.

## F07 View client list and edit client
Designer · manage · Goal: Find a client and keep details current.
Before: Signed in.; At least one client exists.

1. The designer opens the client list. The website shows clients with name, email, company, profile, status and follow-up state, sorted overdue follow-ups first then by earliest due date.
   Changes: lists Client, lists Note.
2. The designer opens a client from the list. The website shows the client details with its notes and projects.
   Changes: reads Client, lists Note, lists Project.
3. The designer edits the client details and saves them. (Client form)
   - Client name (required, up to 120 characters), e.g. "Ananya Rao"
   - Client email (required), e.g. "ananya@craftly.in"
   - Client company (optional, up to 120 characters), e.g. "Craftly"
   - Client profile (optional, up to 1000 characters), e.g. "Runs a D2C skincare brand, met at Design Day, pays per milestone"
   - Client status (required, one of: Lead, Active, Past), e.g. "Lead"
   The website saves the changes and shows the updated client details.
   Changes: updates Client.

Other paths
- F07.A01 (from 1, empty) There are no clients yet: The website shows an empty client list with guidance to add the first client. Flow ends.
- F07.A02 (from 2, notFound) The client was deleted in the meantime: The website says the client is gone and shows the client list. Back to 1.
- F07.A03 (from 3, invalid) The name or email is empty or invalid: The website marks what is wrong and keeps what was typed. Back to 3.
- F07.A04 (from 3, failure) Saving fails: The website keeps the values and offers to retry. Back to 3.
- F07.A05 (from 3, cancel) The designer cancels without saving: Nothing is changed; the website shows the client details as they were. Back to 2.
- F07.A06 (from 2, empty) The client has no notes or projects yet: The website shows the client details with empty notes and projects sections and offers to add a first note or project. Back to 2.

Outcome: Client edits are saved and still shown after refresh with correct follow-up sorting.

## F08 Delete a client
Designer · manage · Goal: Remove a client and all its work.
Before: Signed in.; At least one client exists.

1. The designer opens a client from the list. The website shows the client details with its notes, projects and bookings.
   Changes: reads Client.
2. The designer chooses Delete on the client. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Client, deletes Project, deletes Task, deletes Note, deletes Booking.

Other paths
- F08.A01 (from 1, notFound) The client was deleted in the meantime: The website says the client is gone and shows the client list. Flow ends.
- F08.A02 (from 2, confirm) The designer confirms the deletion: The website shows the client list without the client and without its projects, tasks, notes and bookings. Flow ends.
- F08.A03 (from 2, cancel) The designer cancels: Nothing is deleted; the website shows the client again, unchanged. Flow ends.

Outcome: The client and its projects, tasks, notes and bookings are gone and stay gone after refresh.

## F09 Manage notes and follow-ups
Designer · core · Goal: Track calls and never miss a follow-up.
Before: Signed in.; At least one client exists.

1. The designer opens the client list. The website shows clients with name, company, status and follow-up state, overdue first.
   Changes: lists Client.
2. The designer opens a client. The website shows the client details with dated notes and follow-up dates and done states.
   Changes: reads Client, lists Note.
3. The designer chooses to add a note. The website shows an empty note form.
4. The designer fills in the note and saves it. (Note form)
   - Note text (required, up to 2000 characters), e.g. "Call about checkout redesign, wants proposal by Friday"
   - Follow-up date (optional), e.g. "2026-11-06"
   The website saves the note with its creation date and shows it with the client notes and updated follow-up state.
   Changes: creates Note.
5. The designer marks a follow-up done or pushes it a week with one click. The website updates the follow-up done state or moves the follow-up date a week later and updates the client list order.
   Changes: updates Note.
6. The designer edits a note and saves changes. (Note form)
   - Note text (required, up to 2000 characters), e.g. "Call about checkout redesign, wants proposal by Friday"
   - Follow-up date (optional), e.g. "2026-11-06"
   The website saves the note changes and shows the updated notes.
   Changes: updates Note.
7. The designer chooses Delete on a note. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Note.

Other paths
- F09.A01 (from 1, empty) No clients are found: The website shows that there are no clients yet and offers to add one. Flow ends.
- F09.A02 (from 2, empty) The client has no notes yet: The website shows that there are no notes yet and offers to add one. Back to 3.
- F09.A03 (from 4, invalid) Required note text is empty: The website marks the missing text and keeps what was typed. Back to 4.
- F09.A04 (from 4, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 4.
- F09.A05 (from 6, invalid) Required note text is empty: The website marks the missing text and keeps what was typed. Back to 6.
- F09.A06 (from 6, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 6.
- F09.A07 (from 7, confirm) The designer confirmed the deletion: The website shows the client notes without the deleted note. Flow ends.
- F09.A08 (from 7, cancel) The designer cancelled: The website shows the note again, unchanged. Flow ends.

Outcome: Notes and follow-up states are saved and still shown after refresh.

## F10 Add and view projects
Designer · core · Goal: Organize work per client and see what is open.
Before: Signed in.; At least one client exists.

1. The designer opens projects. The website shows all projects with their count of still-open tasks.
   Changes: lists Project.
2. The designer opens a client and chooses to add a project. The website shows an empty project form.
   Changes: reads Client.
3. The designer fills in the project and saves it. (Project form)
   - Project name (required, up to 150 characters), e.g. "Craftly checkout redesign"
   - Project description (required, up to 1000 characters), e.g. "Simplify checkout to 2 steps and improve mobile conversion"
   - Project due date (optional), e.g. "2026-12-15"
   The website saves the project and shows it in the projects list with zero open tasks.
   Changes: creates Project.
4. The designer opens a project from the list. The website shows the project details with its tasks.
   Changes: reads Project, lists Task.

Other paths
- F10.A01 (from 1, empty) No projects exist yet: The website shows that there are no projects yet and offers to add one under a client. Back to 2.
- F10.A02 (from 3, invalid) Required project name or description is missing: The website marks what is missing and keeps what was typed. Back to 3.
- F10.A03 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.
- F10.A04 (from 4, empty) The project has no tasks yet: The website shows the project details with zero open tasks and offers to add a task. Flow ends.
- F10.A05 (from 4, notFound) The project was deleted in the meantime: The website says the project is gone and shows the projects list. Flow ends.

Outcome: New projects are saved with correct open-task counts and still shown after refresh.

## F11 Edit and delete a project
Designer · manage · Goal: Keep projects correct or remove them.
Before: Signed in.; At least one project exists.

1. The designer opens projects. The website shows all projects with their count of still-open tasks.
   Changes: lists Project.
2. The designer opens a project. The website shows the project name, description and due date with its tasks.
   Changes: reads Project.
3. The designer edits the project and saves changes. (Project form)
   - Project name (required, up to 150 characters), e.g. "Craftly checkout redesign"
   - Project description (required, up to 1000 characters), e.g. "Simplify checkout to 2 steps and improve mobile conversion"
   - Project due date (optional), e.g. "2026-12-15"
   The website saves the changes and shows the updated project.
   Changes: updates Project.
4. The designer chooses Delete on the project. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Project, deletes Task.

Other paths
- F11.A01 (from 1, empty) No projects are found: The website shows that there are no projects yet and offers to add one. Flow ends.
- F11.A02 (from 2, notFound) The project was deleted in the meantime: The website says the project is gone and shows the projects list. Flow ends.
- F11.A03 (from 3, invalid) Required project name or description is missing: The website marks what is missing and keeps what was typed. Back to 3.
- F11.A04 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.
- F11.A05 (from 4, confirm) The designer confirmed the deletion: The website shows the projects list without the deleted project and its tasks. Flow ends.
- F11.A06 (from 4, cancel) The designer cancelled: The website shows the project again, unchanged. Flow ends.

Outcome: Project edits are saved or the project with its tasks is gone; both persist after refresh.

## F12 Manage tasks in a project
Designer · core · Goal: Track and complete project work quickly.
Before: Signed in.; At least one project exists.

1. The designer opens projects. The website shows all projects with their count of still-open tasks.
   Changes: lists Project.
2. The designer opens a project. The website shows the project tasks with title, status, priority and due date, with overdue tasks highlighted.
   Changes: reads Project, lists Task.
3. The designer chooses to add a task. The website shows an empty task form.
4. The designer fills in the task and saves it. (Task form)
   - Task title (required, up to 200 characters), e.g. "Draft homepage wireframes"
   - Task status (required, one of: To do, In progress, Done), e.g. "To do"
   - Task priority (required, one of: Low, Medium, High), e.g. "High"
   - Task due date (optional), e.g. "2026-11-10"
   The website saves the task and shows it in the task list with updated open counts.
   Changes: creates Task.
5. The designer searches by title and filters by status and priority.
   - Task search query (optional, up to 100 characters), e.g. "wireframe"
   - Task status filter (optional, one of: All, To do, In progress, Done), e.g. "In progress"
   - Task priority filter (optional, one of: All, Low, Medium, High), e.g. "High"
   The website shows only the tasks matching the search and filters.
   Changes: lists Task.
6. The designer ticks a task done. The website sets the task status to Done, removes its overdue highlight and updates the open count.
   Changes: updates Task.

Other paths
- F12.A01 (from 1, empty) No projects are found: The website shows that there are no projects yet and offers to add one. Flow ends.
- F12.A02 (from 2, empty) The project has no tasks yet: The website shows that there are no tasks yet and offers to add one. Back to 3.
- F12.A03 (from 4, invalid) Required task title is missing: The website marks the missing title and keeps what was typed. Back to 4.
- F12.A04 (from 4, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 4.
- F12.A05 (from 5, empty) No tasks match the search or filters: The website shows that nothing matches and offers to clear the search and filters. Back to 5.
- F12.A06 (from 2, notFound) The project was deleted in the meantime: The website says the project is gone and shows the projects list. Flow ends.

Outcome: Tasks and their done states are saved with correct filters and highlights after refresh.

## F13 Edit and delete a task
Designer · manage · Goal: Correct or remove a task.
Before: Signed in.; At least one task exists.

1. The designer opens the project task list. The website shows the project tasks with overdue highlight.
   Changes: lists Task.
2. The designer opens a task. The website shows the task title, status, priority and due date.
   Changes: reads Task.
3. The designer edits the task and saves changes. (Task form)
   - Task title (required, up to 200 characters), e.g. "Draft homepage wireframes"
   - Task status (required, one of: To do, In progress, Done), e.g. "To do"
   - Task priority (required, one of: Low, Medium, High), e.g. "High"
   - Task due date (optional), e.g. "2026-11-10"
   The website saves the changes and shows the updated task with correct overdue highlight.
   Changes: updates Task.
4. The designer chooses Delete on the task. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Task.

Other paths
- F13.A01 (from 1, empty) The project has no tasks: The website shows that there are no tasks yet and offers to add one. Flow ends.
- F13.A02 (from 2, notFound) The task was deleted in the meantime: The website says the task is gone and shows the project task list. Flow ends.
- F13.A03 (from 3, invalid) Required task title is missing: The website marks the missing title and keeps what was typed. Back to 3.
- F13.A04 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.
- F13.A05 (from 4, confirm) The designer confirmed the deletion: The website shows the project task list without the deleted task. Flow ends.
- F13.A06 (from 4, cancel) The designer cancelled: The website shows the task again, unchanged. Flow ends.

Outcome: Task edits are saved or the task is gone; both persist after refresh.

## F14 Set availability and session types
Designer · settings · Goal: Define when and what visitors can book.
Before: Signed in.

1. The designer opens scheduling settings. The website shows the current weekly availability and the session types with duration, display-only price and maximum people.
   Changes: lists Availability, lists SessionType.
2. The designer sets weekly availability and saves it. (Availability form)
   - Available days (required, any of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday), e.g. "Monday"
   - Available from time (required), e.g. "10:00"
   - Available to time (required), e.g. "16:00"
   The website saves the available days and start and end times for generating the next two weeks of slots.
   Changes: creates Availability.
3. The designer creates a session type and saves it. (Session type form)
   - Session type name (required, up to 120 characters), e.g. "Discovery call"
   - Session type duration (required, 5 to 480), e.g. "30"
   - Session type price display (required, up to 50 characters), e.g. "Free"
   - Session type maximum people (required, 1 to 50), e.g. "1"
   The website saves the session type and shows it with the other types.
   Changes: creates SessionType.
4. The designer edits a session type and saves changes. (Session type form)
   - Session type name (required, up to 120 characters), e.g. "Discovery call"
   - Session type duration (required, 5 to 480), e.g. "30"
   - Session type price display (required, up to 50 characters), e.g. "Free"
   - Session type maximum people (required, 1 to 50), e.g. "1"
   The website saves the changes and shows the updated session type.
   Changes: updates SessionType.
5. The designer chooses Delete on a session type. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes SessionType.

Other paths
- F14.A01 (from 1, empty) No availability is set yet: The website shows that no availability is set yet and offers to set weekly days and times. Back to 2.
- F14.A02 (from 2, invalid) Days are missing or the end time is not after the start time: The website marks what is wrong and keeps what was typed. Back to 2.
- F14.A03 (from 2, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 2.
- F14.A04 (from 3, invalid) Required session type fields are missing or numbers are out of range: The website marks what is wrong and keeps what was typed. Back to 3.
- F14.A05 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.
- F14.A06 (from 4, invalid) Required session type fields are missing or numbers are out of range: The website marks what is wrong and keeps what was typed. Back to 4.
- F14.A07 (from 4, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 4.
- F14.A08 (from 5, confirm) The designer confirmed the deletion: The website shows the session types without the deleted type. Flow ends.
- F14.A09 (from 5, cancel) The designer cancelled: The website shows the session type again, unchanged. Flow ends.

Outcome: Availability and session types are saved and still shown after refresh.

## F15 View upcoming sessions and cancel a slot
Designer · manage · Goal: Manage upcoming bookings and cancel when needed.
Before: Signed in.

1. The designer opens upcoming sessions. The website shows upcoming sessions with session type, time, booking count and booker names.
   Changes: lists Session, lists Booking.
2. The designer opens a session. The website shows the session details with everyone booked on it.
   Changes: reads Session, lists Booking.
3. The designer chooses to cancel the slot. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Session, deletes Booking.

Other paths
- F15.A01 (from 1, empty) There are no upcoming sessions: The website shows that there are no upcoming sessions and offers to set availability and session types. Flow ends.
- F15.A02 (from 2, notFound) The session was cancelled in the meantime: The website says the session is gone and shows the upcoming sessions list. Flow ends.
- F15.A03 (from 3, confirm) The designer confirmed the cancellation: The website shows the upcoming sessions without the cancelled slot and its bookings. Flow ends.
- F15.A04 (from 3, cancel) The designer cancelled: The website shows the session again, unchanged. Flow ends.
- F15.A05 (from 2, empty) The session has no bookings yet: The website shows the session details with no bookings yet and offers to cancel the slot or go back. Back to 3.

Outcome: Cancelled slots and their bookings are gone and stay gone after refresh.

## F16 Book a session from public page
Booker · core · Goal: Book a session without an account.
Before: Not signed in.

1. The booker opens the public booking page. The website shows the session types with duration, display-only price and seats per slot.
   Changes: lists SessionType.
2. The booker picks a session type.
   - Chosen session type (required, one of the SessionType records), e.g. "Discovery call"
   The website shows open slots for the next two weeks for that type, excluding past times and full slots.
   Changes: lists Session.
3. The booker chooses a slot and books with name and email. (Booking form)
   - Booker name (required, up to 120 characters), e.g. "Rohan Mehta"
   - Booker email (required), e.g. "rohan@startup.in"
   - Chosen slot (required, one of the Session records), e.g. "2026-11-04 10:00 Discovery call"
   The website saves the booking under the matching client or a new Lead client and shows a confirmation with a cancellation link.
   Changes: creates Booking, reads Client, creates Client.

Other paths
- F16.A01 (from 1, empty) No session types are offered: The website shows that no sessions are offered right now and offers to try again later. Flow ends.
- F16.A02 (from 2, empty) There are no open slots for the chosen type in the next two weeks: The website shows that nothing is open for that type and offers to pick another session type. Back to 2.
- F16.A03 (from 3, invalid) Name or email is missing or the email is not valid: The website marks what is wrong and keeps what was typed. Back to 3.
- F16.A04 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.
- F16.A05 (from 3, conflict) The slot just became full: The website says the slot is now full and offers to pick another open slot. Back to 2.

Outcome: A booking and its linked Lead or existing client are saved; the confirmation with cancellation link is shown and the slot shows one fewer open seat after refresh.

## F17 Cancel a booking via link
Booker · manage · Goal: Cancel a booking via link without an account.
Before: A booking with a valid cancellation link exists.

1. The booker opens the cancellation link. The website shows the booking details with session type, date and time and booker name, with an option to cancel.
   Changes: reads Booking, reads Session.
2. The booker chooses to cancel the booking. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Booking.

Other paths
- F17.A01 (from 1, notFound) The link is invalid or the booking was already cancelled: The website says the booking cannot be found and shows how to make a new booking. Flow ends.
- F17.A02 (from 2, confirm) The booker confirms the cancellation: The website shows the booking is cancelled, the seat is open again and the client record is kept. Flow ends.
- F17.A03 (from 2, cancel) The booker does not confirm the cancellation: Nothing is cancelled; the website shows the booking again unchanged. Flow ends.

Outcome: The booking is gone and the slot is open again after refresh; the client remains.

## Fields
- FD01 Designer email (required), e.g. "maya@mayastudio.in". Email the designer uses to sign up and sign in
- FD02 Designer password (required, at least 8 characters), e.g. "calm-studio-42". Secret password protecting the designer's workspace
- FD03 Client name (required, up to 120 characters), e.g. "Ananya Rao". How the designer refers to the client
- FD04 Client email (required), e.g. "ananya@craftly.in". Email used to contact the client and to link bookings
- FD05 Client company (optional, up to 120 characters), e.g. "Craftly". Optional company the client belongs to
- FD06 Client profile (optional, up to 1000 characters), e.g. "Runs a D2C skincare brand, met at Design Day, pays per milestone". Short note about what they do, how met and what they pay
- FD07 Client status (required, one of: Lead, Active, Past), e.g. "Lead". Where the client is in the pipeline
- FD08 Note text (required, up to 2000 characters), e.g. "Call about checkout redesign, wants proposal by Friday". What was discussed or remembered after a call
- FD09 Follow-up date (optional), e.g. "2026-11-06". Optional date to follow up on this note
- FD10 Project name (required, up to 150 characters), e.g. "Craftly checkout redesign". How the designer refers to the work for a client
- FD11 Project description (required, up to 1000 characters), e.g. "Simplify checkout to 2 steps and improve mobile conversion". Short summary of what the project covers
- FD12 Project due date (optional), e.g. "2026-12-15". Optional date the project should be finished by
- FD13 Task title (required, up to 200 characters), e.g. "Draft homepage wireframes". What needs to be done in the project
- FD14 Task status (required, one of: To do, In progress, Done), e.g. "To do". Where the task is in its workflow
- FD15 Task priority (required, one of: Low, Medium, High), e.g. "High". How urgent the task is
- FD16 Task due date (optional), e.g. "2026-11-10". Optional date the task should be done by, overdue when past and not Done
- FD17 Available days (required, any of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday), e.g. "Monday". Which weekdays repeat weekly as bookable
- FD18 Available from time (required), e.g. "10:00". Start of the bookable window on available days
- FD19 Available to time (required), e.g. "16:00". End of the bookable window on available days
- FD20 Session type name (required, up to 120 characters), e.g. "Discovery call". Name of the bookable offering shown to visitors
- FD21 Session type duration (required, 5 to 480), e.g. "30". Length in minutes used to slice availability into slots
- FD22 Session type price display (required, up to 50 characters), e.g. "Free". Display-only price text shown on booking, never charged
- FD23 Session type maximum people (required, 1 to 50), e.g. "1". How many bookings a slot holds before it is full
- FD24 Booker name (required, up to 120 characters), e.g. "Rohan Mehta". Name of the visitor booking a session
- FD25 Booker email (required), e.g. "rohan@startup.in". Email of the visitor, used to link to an existing client or create a Lead
- FD26 Chosen session type (required, one of the SessionType records), e.g. "Discovery call". Which offering the visitor wants to book
- FD27 Chosen slot (required, one of the Session records), e.g. "2026-11-04 10:00 Discovery call". Which open time slot the visitor books
- FD28 Task search query (optional, up to 100 characters), e.g. "wireframe". Free text to find tasks by title
- FD29 Task status filter (optional, one of: All, To do, In progress, Done), e.g. "In progress". Show only tasks with this status
- FD30 Task priority filter (optional, one of: All, Low, Medium, High), e.g. "High". Show only tasks with this priority

## Forms
- FM01 Designer sign-up form: FD01, FD02
- FM02 Designer sign-in form: FD01, FD02
- FM03 Client form: FD03, FD04, FD05, FD06, FD07
- FM04 Note form: FD08, FD09
- FM05 Project form: FD10, FD11, FD12
- FM06 Task form: FD13, FD14, FD15, FD16
- FM07 Availability form: FD17, FD18, FD19
- FM08 Session type form: FD20, FD21, FD22, FD23
- FM09 Booking form: FD24, FD25

## STD01 Confirm deletion (standard subflow)

1. (system) The website asks to confirm the deletion and says what else will be removed with it.

Other paths
- STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
- STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.

## New assumptions
- A14 (behavior): Notes can be edited and deleted by the designer; deleting a note removes its follow-up; marking done or pushing a week never deletes the note.
- A15 (behavior): Sessions are not manually created; upcoming sessions are weekly availability sliced into back-to-back slots per session type duration for the next two weeks; the designer manages them only by viewing and cancelling, with each session showing booking count and booker names.

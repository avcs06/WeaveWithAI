# StudioDesk: user flows

## F01 Visit landing page
Designer · browse · Goal: Understand what StudioDesk is for and get started.
Before: Not signed in.

1. The visitor opens the StudioDesk landing page. The website shows that StudioDesk is one calm workspace for a solo freelance designer to run clients, projects, and bookings, and offers to sign up, sign in, or open the public booking page.
2. The visitor chooses to sign up as the designer. The website shows the sign-up screen.

Other paths
- F01.A01 (from 2, other) The visitor chooses to sign in instead: The website shows the sign-in screen so the visitor can sign back in. Flow ends.
- F01.A02 (from 2, other) The visitor chooses to open the public booking page instead: The website shows the public booking page with session types and open slots. Flow ends.

Outcome: Nothing is stored; the visitor reaches sign-up, sign-in, or the public booking page.

## F02 Designer signs up
Designer · auth · Goal: Create an account and reach the home screen.
Before: Not signed in.

1. The visitor chooses to sign up. The website shows an empty designer auth form.
2. The visitor fills in the designer auth form and submits it. (Designer auth form)
   - Designer email (required), e.g. "maya@studiomaya.in"
   - Password (required, 8 to 128 characters), e.g. "calm-studio-42"
   The website creates the account, signs her in, and shows the home screen with today's sessions, follow-ups due this week, and overdue tasks.

Other paths
- F02.A01 (from 2, invalid) The email or password is missing or not valid: The website marks what is wrong and keeps what was typed. Back to 2.
- F02.A02 (from 2, failure) Saving the account fails: The website keeps the typed values and offers to retry. Back to 2.
- F02.A03 (from 2, conflict) The email is already registered: The website says the email already has an account and offers to sign in instead. Flow ends.

Outcome: A new designer account exists and sign-in persists; after refresh she is still signed in on the home screen.

## F03 Designer signs in
Designer · auth · Goal: Sign back in to the workspace.
Before: Not signed in.; Designer already signed up.

1. The visitor chooses to sign in. The website shows an empty designer auth form.
2. The designer fills in the designer auth form and submits it. (Designer auth form)
   - Designer email (required), e.g. "maya@studiomaya.in"
   - Password (required, 8 to 128 characters), e.g. "calm-studio-42"
   The website signs her in and shows her home screen with today's sessions, follow-ups due this week, and overdue tasks.

Other paths
- F03.A01 (from 2, invalid) The email or password is missing or not valid: The website marks what is wrong and keeps what was typed. Back to 2.
- F03.A02 (from 2, failure) Signing in fails: The website keeps the typed values and offers to retry. Back to 2.
- F03.A03 (from 2, denied) The email or password is incorrect: The website says the sign-in did not match and keeps what was typed so it can be corrected. Back to 2.

Outcome: The designer is signed in and stays signed in after a refresh.

## F04 Designer signs out
Designer · auth · Goal: Leave the workspace securely.
Before: Signed in.

1. The designer chooses to sign out. The website signs her out and shows the public landing page.

Outcome: The designer is signed out; a refresh still shows the signed-out landing page.

## F05 Add a client
Designer · core · Goal: Remember a new client for the first time.
Before: Signed in.

1. The designer opens the client list. The website shows the client list sorted with overdue follow-ups first, then soonest, then no date.
   Changes: lists Client.
2. The designer chooses to add a client. The website shows an empty client form.
3. The designer fills in the client form and saves it. (Client form)
   - Client name (required, up to 120 characters), e.g. "Aarav Mehta"
   - Client email (required), e.g. "aarav@brightkart.com"
   - Company (optional, up to 120 characters), e.g. "Brightkart"
   - Profile (optional, up to 2000 characters), e.g. "Runs a D2C store, met at a design meetup, pays per project"
   - Client status (required, one of: Lead, Active, Past), e.g. "Lead"
   - Follow-up date (optional), e.g. "2026-11-07"
   The website saves the client and shows it in the client list in its sorted position.
   Changes: creates Client.

Other paths
- F05.A01 (from 1, empty) No clients exist yet: The website says there are no clients yet and offers to add the first client. Back to 2.
- F05.A02 (from 2, cancel) The designer cancels: Nothing is saved; the website shows the client list as it was. Flow ends.
- F05.A03 (from 3, invalid) A required value is missing or not valid: The website marks what is wrong and keeps what was typed. Back to 3.
- F05.A04 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.

Outcome: The new client is saved and still appears in the client list after a refresh.

## F06 View clients and handle follow-ups
Designer · browse · Goal: See who needs a follow-up and act in one click.
Before: Signed in.

1. The designer opens the client list. The website shows clients sorted with overdue follow-ups first, then soonest, then no date, with overdue highlighted and one-click actions to mark done or push a week.
   Changes: lists Client.
2. The designer marks a follow-up done with one click. The website clears that client's follow-up date and updates the sorted order.
   Changes: updates Client.
3. The designer pushes a follow-up a week with one click. The website adds seven days to that client's follow-up date and updates the sorted order.
   Changes: updates Client.

Other paths
- F06.A01 (from 1, empty) No clients exist yet: The website says there are no clients yet and offers to add a client. Flow ends.
- F06.A02 (from 2, failure) Marking the follow-up done fails: The website keeps the follow-up date unchanged and offers to retry. Back to 2.
- F06.A03 (from 3, failure) Pushing the follow-up a week fails: The website keeps the follow-up date unchanged and offers to retry. Back to 3.

Outcome: Follow-up dates updated by done or push-a-week persist and the sorted order still shows after a refresh.

## F07 Edit a client
Designer · manage · Goal: Keep a client's details and follow-up date up to date.
Before: Signed in.; At least one client exists.

1. The designer opens the client list. The website shows the client list sorted with overdue follow-ups first.
   Changes: lists Client.
2. The designer opens a client from the list. The website shows the client's name, email, company, profile, status, and follow-up date.
   Changes: reads Client.
3. The designer edits the client details and saves them. (Client form)
   - Client name (required, up to 120 characters), e.g. "Aarav Mehta"
   - Client email (required), e.g. "aarav@brightkart.com"
   - Company (optional, up to 120 characters), e.g. "Brightkart"
   - Profile (optional, up to 2000 characters), e.g. "Runs a D2C store, met at a design meetup, pays per project"
   - Client status (required, one of: Lead, Active, Past), e.g. "Lead"
   - Follow-up date (optional), e.g. "2026-11-07"
   The website saves the changes and shows the updated client in its sorted position.
   Changes: updates Client.

Other paths
- F07.A01 (from 1, empty) No clients exist yet: The website says there are no clients yet and offers to add a client. Flow ends.
- F07.A02 (from 2, notFound) The client was deleted in the meantime: The website says the client is gone and shows the client list. Flow ends.
- F07.A03 (from 3, invalid) A required value is missing or not valid: The website marks what is wrong and keeps what was typed. Back to 3.
- F07.A04 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.
- F07.A05 (from 3, cancel) The designer cancels: Nothing is changed; the website shows the client again as it was. Flow ends.

Outcome: Client changes are saved and still show after a refresh.

## F08 Delete a client
Designer · manage · Goal: Remove a client and everything under it.
Before: Signed in.; At least one client exists.

1. The designer opens the client list. The website shows the client list sorted with overdue follow-ups first.
   Changes: lists Client.
2. The designer opens a client from the list. The website shows the client's details with its projects and notes.
   Changes: reads Client.
3. The designer chooses Delete on the client. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Booking, deletes Client, deletes Note, deletes Project, deletes Task.

Other paths
- F08.A01 (from 1, empty) No clients exist yet: The website says there are no clients yet and offers to add a client. Flow ends.
- F08.A02 (from 2, notFound) The client was deleted in the meantime: The website says the client is gone and shows the client list. Flow ends.
- F08.A03 (from 3, confirm) The designer confirmed the deletion: The website shows the client list without the deleted client, its projects, tasks, and notes. Flow ends.
- F08.A04 (from 3, cancel) The designer cancelled: Nothing is deleted; the website shows the client again, unchanged. Flow ends.

Outcome: The client, its projects, tasks, and notes are gone and stay gone after a refresh.

## F09 Add and view client notes
Designer · core · Goal: Keep call history and next follow-up under the client.
Before: Signed in.; At least one client exists.

1. The designer opens a client from the client list. The website shows the client's details with its dated notes newest first and its follow-up date.
   Changes: reads Client, lists Note.
2. The designer chooses to add a note. The website shows an empty note form.
3. The designer fills in the note date and text and saves it. (Note form)
   - Note date (required), e.g. "2026-11-02"
   - Note text (required, up to 5000 characters), e.g. "Discussed homepage rework, will share wireframes next week"
   The website saves the note and shows it with the client's notes in date order.
   Changes: creates Note.
4. The designer sets or changes the follow-up date and saves it.
   - Follow-up date (optional), e.g. "2026-11-07"
   The website saves the follow-up date and shows it on the client.
   Changes: updates Client.
5. The designer chooses Delete on a mistaken note. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Note.

Other paths
- F09.A01 (from 1, empty) There are no notes under the client yet: The website shows the client with no notes yet and offers to add the first note. Back to 2.
- F09.A02 (from 1, notFound) The client was deleted in the meantime: The website says the client is gone and shows the client list. Flow ends.
- F09.A03 (from 3, invalid) The note date is missing or the note text is empty: The website marks what is wrong and keeps what was typed. Back to 3.
- F09.A04 (from 3, failure) Saving the note fails: The website keeps the typed values and offers to retry. Back to 3.
- F09.A05 (from 4, invalid) The follow-up date is not a valid date: The website marks the date and keeps what was typed. Back to 4.
- F09.A06 (from 4, failure) Saving the follow-up date fails: The website keeps the typed date and offers to retry. Back to 4.
- F09.A07 (from 5, confirm) The designer confirms the deletion: The website shows the client with its remaining notes, without the deleted note. Flow ends.
- F09.A08 (from 5, cancel) The designer cancels the deletion: Nothing is deleted; the website shows the client notes unchanged. Flow ends.

Outcome: New notes and the follow-up date are saved under the client and still show after a refresh.

## F10 Add a project
Designer · core · Goal: Start tracking a piece of work for a client.
Before: Signed in.; At least one client exists.

1. The designer opens a client from the client list. The website shows the client with its existing projects.
   Changes: reads Client, lists Project.
2. The designer chooses to add a project under this client. The website shows an empty project form.
3. The designer fills in the project and saves it. (Project form)
   - Project name (required, up to 200 characters), e.g. "Checkout redesign"
   - Project description (optional, up to 2000 characters), e.g. "Simplify checkout to reduce drop-offs"
   - Project due date (optional), e.g. "2026-12-15"
   The website saves the project under the client and shows it in the project list with zero open tasks.
   Changes: creates Project.

Other paths
- F10.A01 (from 1, empty) The client has no projects yet: The website shows the client with no projects yet and offers to add the first project. Back to 2.
- F10.A02 (from 1, notFound) The client was deleted in the meantime: The website says the client is gone and shows the client list. Flow ends.
- F10.A03 (from 3, invalid) The project name is empty: The website marks what is wrong and keeps what was typed. Back to 3.
- F10.A04 (from 3, failure) Saving the project fails: The website keeps the typed values and offers to retry. Back to 3.
- F10.A05 (from 2, cancel) The designer cancels adding the project: Nothing is saved; the website shows the client as it was. Flow ends.

Outcome: The new project is saved under its client and still appears with zero open tasks after a refresh.

## F11 Edit a project
Designer · manage · Goal: Keep a project's details correct.
Before: Signed in.; At least one project exists.

1. The designer opens a project from the project list. The website shows the project's name, description, and due date.
   Changes: reads Project.
2. The designer changes the name, description, or due date and saves it. (Project form)
   - Project name (required, up to 200 characters), e.g. "Checkout redesign"
   - Project description (optional, up to 2000 characters), e.g. "Simplify checkout to reduce drop-offs"
   - Project due date (optional), e.g. "2026-12-15"
   The website saves the changes and shows the updated project.
   Changes: updates Project.

Other paths
- F11.A01 (from 1, notFound) The project was deleted in the meantime: The website says the project is gone and shows the project list. Flow ends.
- F11.A02 (from 2, invalid) The project name is empty: The website marks what is wrong and keeps what was typed. Back to 2.
- F11.A03 (from 2, failure) Saving the project fails: The website keeps the typed values and offers to retry. Back to 2.

Outcome: Project changes are saved and still show after a refresh.

## F12 Delete a project
Designer · manage · Goal: Remove a project and its tasks.
Before: Signed in.; At least one project exists.

1. The designer opens a project from the project list. The website shows the project's details and its tasks.
   Changes: reads Project, lists Task.
2. The designer chooses Delete on the project. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Project, deletes Task.

Other paths
- F12.A01 (from 1, notFound) The project was deleted in the meantime: The website says the project is gone and shows the project list. Flow ends.
- F12.A02 (from 2, confirm) The designer confirms the deletion: The website shows the project list without the project and without its tasks. Flow ends.
- F12.A03 (from 2, cancel) The designer cancels the deletion: Nothing is deleted; the website shows the project unchanged. Flow ends.
- F12.A04 (from 1, empty) The project has no tasks yet: The website shows the project with no tasks yet; the designer can still choose to delete it. Back to 2.

Outcome: The project and its tasks are gone and stay gone after a refresh.

## F13 View project list with open counts
Designer · browse · Goal: See all projects and how much work is still open on each.
Before: Signed in.

1. The designer opens the project list. The website shows every project with how many of its tasks are still open.
   Changes: lists Project, lists Task.
2. The designer opens a project to continue work on it. The website shows the project with its tasks.
   Changes: reads Project, lists Task.

Other paths
- F13.A01 (from 1, empty) There are no projects yet: The website shows that there are no projects yet and offers to add the first project for a client. Flow ends.
- F13.A02 (from 2, notFound) The project was deleted in the meantime: The website says the project is gone and shows the project list. Flow ends.
- F13.A03 (from 2, empty) The project has no tasks yet: The website shows the project with no tasks yet and offers to add the first task. Flow ends.

Outcome: Nothing is changed; the same projects with their current open task counts still show after a refresh.

## F14 View and find tasks in a project
Designer · browse · Goal: Find the right tasks inside a project.
Before: Signed in.; At least one project exists.

1. The designer opens a project to see its tasks. The website shows the project's tasks with overdue tasks standing out.
   Changes: reads Project, lists Task.
2. The designer searches by title and filters by status and priority.
   - Search tasks (optional, up to 120 characters), e.g. "wireframe"
   - Task status filter (optional, one of: All, To do, In progress, Done), e.g. "All"
   - Task priority filter (optional, one of: All, Low, Medium, High), e.g. "All"
   The website shows only the tasks that match the search and filters, with overdue tasks standing out.
   Changes: lists Task.
3. The designer opens a task to continue work on it. The website shows the task's title, status, priority, and due date.
   Changes: reads Task.

Other paths
- F14.A01 (from 1, empty) The project has no tasks yet: The website shows the project with no tasks yet and offers to add the first task. Flow ends.
- F14.A02 (from 1, notFound) The project was deleted in the meantime: The website says the project is gone and shows the project list. Flow ends.
- F14.A03 (from 2, empty) No tasks match the search or filters: The website shows that nothing matches and offers to clear the search or filters. Back to 2.
- F14.A04 (from 3, notFound) The task was deleted in the meantime: The website says the task is gone and shows the project's task list. Flow ends.

Outcome: Nothing is changed; the same filtered task list still shows after a refresh.

## F15 Add a task
Designer · core · Goal: Add a new task to a project.
Before: Signed in.; At least one project exists.

1. The designer opens a project to see its tasks. The website shows the project with its tasks and open task count.
   Changes: reads Project, lists Task.
2. The designer chooses to add a task. The website shows an empty task form.
3. The designer fills in the task and saves it. (Task form)
   - Task title (required, up to 200 characters), e.g. "Draft homepage wireframes"
   - Task status (required, one of: To do, In progress, Done), e.g. "To do"
   - Task priority (required, one of: Low, Medium, High), e.g. "High"
   - Task due date (optional), e.g. "2026-11-10"
   The website saves the task and shows it in the task list with updated open counts, with overdue styling when its due date is overdue.
   Changes: creates Task.

Other paths
- F15.A01 (from 1, notFound) The project was deleted in the meantime: The website says the project is gone and shows the project list. Flow ends.
- F15.A02 (from 1, empty) The project has no tasks yet: The website shows the project with no tasks yet and offers to add the first task. Back to 2.
- F15.A03 (from 2, cancel) The designer cancels adding the task: Nothing is saved; the website shows the project tasks as they were. Flow ends.
- F15.A04 (from 3, invalid) The title is empty or another value is not allowed: The website marks what is wrong and keeps what was typed. Back to 3.
- F15.A05 (from 3, failure) Saving the task fails: The website keeps the typed values and offers to retry. Back to 3.

Outcome: The new task is saved in its project and still appears after a refresh.

## F16 Edit a task
Designer · manage · Goal: Keep a task up to date and tick it Done.
Before: Signed in.; At least one task exists.

1. The designer opens a task from its project's task list. The website shows the task's title, status, priority, and due date.
   Changes: reads Task.
2. The designer changes the title, status, priority, or due date, including ticking it Done quickly or moving it back to To do or In progress, and saves it. (Task form)
   - Task title (required, up to 200 characters), e.g. "Draft homepage wireframes"
   - Task status (required, one of: To do, In progress, Done), e.g. "To do"
   - Task priority (required, one of: Low, Medium, High), e.g. "High"
   - Task due date (optional), e.g. "2026-11-10"
   The website saves the changes and shows the updated task and open counts, with overdue styling when it is overdue and not Done.
   Changes: updates Task.

Other paths
- F16.A01 (from 1, notFound) The task was deleted in the meantime: The website says the task is gone and shows the project's task list. Flow ends.
- F16.A02 (from 2, invalid) The title is empty or another value is not allowed: The website marks what is wrong and keeps what was typed. Back to 2.
- F16.A03 (from 2, failure) Saving the task fails: The website keeps the typed values and offers to retry. Back to 2.

Outcome: Task changes including Done status are saved and still show after a refresh.

## F17 Delete a task
Designer · manage · Goal: Remove a task that is no longer needed.
Before: Signed in.; At least one task exists.

1. The designer opens a project from the project list. The website shows the project with its task list and open task counts.
   Changes: reads Project, lists Task.
2. The designer chooses to delete a task. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Task.

Other paths
- F17.A01 (from 1, empty) The project has no tasks: The website says there are no tasks and offers to add a task. Flow ends.
- F17.A02 (from 1, notFound) The project was deleted in the meantime: The website says the project is gone and shows the project list. Flow ends.
- F17.A03 (from 2, confirm) The designer confirmed the deletion: The website shows the project task list without the task and with updated open counts. Flow ends.
- F17.A04 (from 2, cancel) The designer cancelled: The website shows the task unchanged. Flow ends.

Outcome: The task is gone and stays gone after a refresh.

## F18 Set weekly availability
Designer · settings · Goal: Publish when bookers can book her.
Before: Signed in.

1. The designer chooses to set weekly availability. The website shows the current weekly availability.
   Changes: reads Availability.
2. The designer fills in available days and times and saves. (Availability form)
   - Available days (required, any of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday), e.g. "Monday"
   - Available from (required), e.g. "10:00"
   - Available to (required), e.g. "17:00"
   The website saves the weekly availability and shows it with the slots it will generate for the next two weeks.
   Changes: updates Availability.

Other paths
- F18.A01 (from 1, empty) No weekly availability is set yet: The website says no times are bookable yet and shows an empty availability form. Back to 2.
- F18.A02 (from 2, invalid) Available days are empty or Available to is not after Available from: The website marks what is wrong and keeps what was typed. Back to 2.
- F18.A03 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.

Outcome: Weekly availability is saved and still shows after a refresh.

## F19 Add a session type
Designer · settings · Goal: Offer a new kind of bookable session.
Before: Signed in.

1. The designer chooses to add a session type. The website shows an empty session type form.
2. The designer fills in the session type and saves it. (Session type form)
   - Session type name (required, up to 120 characters), e.g. "Design review"
   - Duration in minutes (required, 15 to 480), e.g. "60"
   - Price display (required, up to 60 characters), e.g. "₹4,000"
   - Maximum people (required, 1 to 50), e.g. "8"
   The website saves the session type and shows it in the session type list and on the public booking page.
   Changes: creates SessionType.

Other paths
- F19.A01 (from 1, cancel) The designer cancels: Nothing is saved; the website shows the session types as they were. Flow ends.
- F19.A02 (from 2, invalid) Required details are missing or out of range: The website marks what is wrong and keeps what was typed. Back to 2.
- F19.A03 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.

Outcome: The new session type is saved and still shows on the booking page after a refresh.

## F20 Edit a session type
Designer · settings · Goal: Keep a session type's details correct.
Before: Signed in.; At least one session type exists.

1. The designer opens the session type list. The website shows all session types with their durations, price displays, and maximum people.
   Changes: lists SessionType.
2. The designer opens a session type. The website shows the session type form filled with its current details.
   Changes: reads SessionType.
3. The designer edits the session type and saves it. (Session type form)
   - Session type name (required, up to 120 characters), e.g. "Design review"
   - Duration in minutes (required, 15 to 480), e.g. "60"
   - Price display (required, up to 60 characters), e.g. "₹4,000"
   - Maximum people (required, 1 to 50), e.g. "8"
   The website saves the changes and shows the updated session type list and booking preview.
   Changes: updates SessionType.

Other paths
- F20.A01 (from 1, empty) There are no session types: The website says there are no session types and offers to add one. Flow ends.
- F20.A02 (from 2, notFound) The session type was deleted in the meantime: The website says the session type is gone and shows the session type list. Flow ends.
- F20.A03 (from 3, invalid) Required details are missing or out of range: The website marks what is wrong and keeps what was typed. Back to 3.
- F20.A04 (from 3, failure) Saving fails: The website keeps the values and offers to retry. Back to 3.

Outcome: Session type changes are saved and still show on the booking page after a refresh.

## F21 Delete a session type
Designer · settings · Goal: Stop offering a session type.
Before: Signed in.; At least one session type exists.

1. The designer opens a session type from the session type list. The website shows the session type's name, duration, price display, and maximum people.
   Changes: reads SessionType.
2. The designer chooses to delete the session type. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes SessionType.

Other paths
- F21.A01 (from 1, notFound) The session type was deleted in the meantime: The website says the session type is gone and shows the session type list. Flow ends.
- F21.A02 (from 2, confirm) The designer confirmed the deletion: The website shows the session type list without the deleted type so bookers can no longer pick it. Flow ends.
- F21.A03 (from 2, cancel) The designer cancelled: The website shows the session type unchanged. Flow ends.

Outcome: The session type is gone and stays gone after a refresh.

## F22 Book a session from public page
Booker · core · Goal: Book a session without creating an account.
Before: Designer has set availability and at least one session type.

1. The booker opens the public booking page. The website shows all session types with their durations, price displays, and maximum people.
   Changes: lists SessionType.
2. The booker picks a session type.
   - Chosen session type (required, one of the SessionType records), e.g. "Discovery call"
   The website shows open slots for the next two weeks for that session type, with full slots marked full.
   Changes: lists Session.
3. The booker picks an open slot and fills in name and email and books. (Booking form)
   - Booker name (required, up to 120 characters), e.g. "Priya Nair"
   - Booker email (required), e.g. "priya@brightkart.com"
   - Chosen slot (required, one of the Session records), e.g. "2026-11-05 10:00"
   The website saves the booking on its session and under the matched client or a newly created Lead client, and shows a confirmation with a cancellation link on screen.
   Changes: creates Booking, creates Session, updates Session, reads Client, creates Client.

Other paths
- F22.A01 (from 1, empty) No session types are offered yet: The website says no sessions are available yet and suggests checking back later. Flow ends.
- F22.A02 (from 2, empty) There are no open slots for the chosen session type in the next two weeks: The website says there are no open slots for that session type and offers to pick another session type. Back to 1.
- F22.A03 (from 3, invalid) Name or email is missing or invalid, or no slot is picked: The website marks what is wrong and keeps what was typed. Back to 3.
- F22.A04 (from 3, failure) Saving fails: The website keeps the values and offers to retry. Back to 3.
- F22.A05 (from 3, conflict) The slot became full in the meantime: The website says the slot just became full and shows other open slots. Back to 2.

Outcome: The booking is saved on its session and under the matched or newly created Lead client, and the slot shows one fewer free seat after a refresh.

## F23 Cancel a booking via link
Booker · core · Goal: Cancel my own booking.
Before: Booker has a valid cancellation link from a booking.

1. The booker opens the cancellation link shown after booking. The website shows the booking details with its session type, date, and start time.
   Changes: reads Booking.
2. The booker chooses to cancel the booking. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Booking.

Other paths
- F23.A01 (from 1, notFound) The link is invalid or the booking was already cancelled: The website says the booking is gone or already cancelled. Flow ends.
- F23.A02 (from 2, confirm) The booker confirmed the cancellation: The website shows the booking is cancelled and its seat is available again. Flow ends.
- F23.A03 (from 2, cancel) The booker cancelled: The website shows the booking unchanged. Flow ends.

Outcome: The booking is cancelled and stays cancelled after a refresh, with its seat available again.

## F24 View upcoming sessions and cancel a slot
Designer · core · Goal: Run upcoming sessions and cancel a slot when needed.
Before: Signed in.

1. The designer opens upcoming sessions. The website shows upcoming sessions with seats booked versus maximum and who booked each slot.
   Changes: lists Session, lists Booking.
2. The designer chooses to cancel a slot. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Session, deletes Booking.

Other paths
- F24.A01 (from 1, empty) There are no upcoming sessions: The website says there are no upcoming sessions and offers to set availability and session types. Flow ends.
- F24.A02 (from 2, notFound) The session was already cancelled: The website says the session is gone and shows the updated upcoming list. Flow ends.
- F24.A03 (from 2, confirm) The designer confirmed the cancellation: The website shows the upcoming list without the cancelled session and its bookings. Flow ends.
- F24.A04 (from 2, cancel) The designer cancelled: The website shows the session unchanged. Flow ends.

Outcome: Cancelled sessions and their bookings stay cancelled after a refresh.

## F25 View home dashboard
Designer · core · Goal: Start the day knowing what needs attention.
Before: Signed in.

1. The designer opens the home screen. The website shows today's sessions with seats booked versus maximum, follow-ups due this week with overdue styling, and overdue tasks with their project and due date.
   Changes: lists Session, lists Client, lists Task.
2. The designer chooses a session, follow-up, or overdue task to open it. The website shows the chosen session with its bookings, the client with its follow-up, or the project task.
   Changes: reads Session, reads Client, reads Task.

Other paths
- F25.A01 (from 1, empty) There are no sessions today, no follow-ups due this week, and no overdue tasks: The website shows an all-clear message and links to the client list, project list, and upcoming sessions to add or review work. Flow ends.
- F25.A02 (from 2, notFound) The chosen session, client, or task was removed in the meantime: The website says it is gone and shows the home screen again. Back to 1.

Outcome: Nothing is changed; the same today's sessions, due follow-ups, and overdue tasks still show after a refresh.

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
- FD30 Task status filter (optional, one of: All, To do, In progress, Done), e.g. "All". Which task statuses to show inside a project
- FD31 Task priority filter (optional, one of: All, Low, Medium, High), e.g. "All". Which task priorities to show inside a project

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

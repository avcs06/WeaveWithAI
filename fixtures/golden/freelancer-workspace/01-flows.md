# Solo Studio: user flows

## F01 Discover Solo Studio on the landing page
Designer · browse · Goal: Understand what Solo Studio is for and get started.
Before: Not signed in.

1. The visitor opens the public landing page. The website shows what Solo Studio is for, how the private client, project and booking workspace works, and how to sign in or sign up and share the booking page.
2. The visitor chooses to sign up or sign in. The website shows the start of designer sign-up or sign-in.

Outcome: Nothing is stored; after refresh the landing page still explains the workspace and how to start and share the booking page.

## F02 Designer sign up
Designer · auth · Goal: Create a designer account.
Before: Not signed in.

1. The visitor chooses to sign up. The website shows an empty designer sign-up form.
2. The visitor fills in the sign-up form and submits it. (Designer auth form)
   - Designer email (required), e.g. "maya@example.com"
   - Password (required, at least 8 characters), e.g. "calm-studio-42"
   The website creates the account, signs the designer in, and shows the empty workspace home.

Other paths
- F02.A01 (from 2, invalid) Required email or password is missing or not valid: The website marks what is wrong and keeps what was typed. Back to 2.
- F02.A02 (from 2, failure) Creating the account fails: The website keeps the values and offers to retry. Back to 2.
- F02.A03 (from 2, conflict) The email is already registered: The website says the email already has an account and offers to sign in instead. Back to 2.

Outcome: A designer account is created and signed in; after refresh the designer stays signed in with an empty workspace.

## F03 Designer sign in
Designer · auth · Goal: Sign back into the private workspace.
Before: Not signed in.; Has a designer account.

1. The designer chooses to sign in. The website shows an empty designer sign-in form.
2. The designer fills in the sign-in form and submits it. (Designer auth form)
   - Designer email (required), e.g. "maya@example.com"
   - Password (required, at least 8 characters), e.g. "calm-studio-42"
   The website signs the designer in and shows the home dashboard with their own clients, projects and sessions.

Other paths
- F03.A01 (from 2, invalid) Required email or password is missing or not valid: The website marks what is wrong and keeps what was typed. Back to 2.
- F03.A02 (from 2, failure) Signing in fails for a technical reason: The website keeps the values and offers to retry. Back to 2.
- F03.A03 (from 2, denied) The email or password does not match an account: The website says the details were not recognised and offers to try again. Back to 2.

Outcome: The designer is signed in; after refresh they stay signed in and see their own data.

## F04 View home dashboard
Designer · core · Goal: See what needs attention today.
Before: Signed in.

1. The designer opens the home dashboard. The website shows today's sessions, follow-ups due in the next 7 days including overdue, and overdue tasks with overdue highlight, each linked to its client, project or session.
   Changes: lists Session, lists Note, lists Task.
2. The designer chooses a session, follow-up, or overdue task to open. The website shows the related session, client, or project detail.
   Changes: reads Session, reads Client, reads Project.

Other paths
- F04.A01 (from 1, empty) There are no sessions today, no follow-ups due this week, and no overdue tasks: The website says everything is clear and offers to add a client, add a project, or set availability. Back to 1.
- F04.A02 (from 2, notFound) The chosen session, client, or project was deleted in the meantime: The website says the item is gone and shows the home dashboard again. Back to 1.

Outcome: Nothing is stored; after refresh home still shows today's sessions, this week's follow-ups and overdue tasks.

## F05 Add a client
Designer · core · Goal: Remember a new client.
Before: Signed in.

1. The designer chooses to add a client. The website shows an empty client form.
2. The designer fills in the client and saves it. (Client form)
   - Client name (required, up to 120 characters), e.g. "Priya Nair"
   - Client email (required), e.g. "priya@brightco.com"
   - Company (optional, up to 120 characters), e.g. "Bright Co"
   - Client profile (optional, up to 1000 characters), e.g. "Runs a D2C skincare brand, met at design meetup, pays per project"
   - Client status (optional, one of: Lead, Active, Past), e.g. "Lead"
   The website saves the client defaulting to Lead when status is not set and shows it in the client list with its follow-up state.
   Changes: creates Client.

Other paths
- F05.A01 (from 2, invalid) Required name or email is missing or not valid: The website marks what is wrong and keeps what was typed. Back to 2.
- F05.A02 (from 2, failure) Saving fails: The website keeps the values and offers to retry. Back to 2.
- F05.A03 (from 2, cancel) The designer cancels without saving: Nothing is saved; the website shows the client list as it was. Flow ends.

Outcome: A new Client is saved defaulting to Lead when not set and is still in the list after refresh.

## F06 Track client notes and follow-ups
Designer · core · Goal: Keep notes and never miss a follow-up.
Before: Signed in.; At least one client exists.

1. The designer opens the client list. The website shows clients sorted with overdue follow-ups first then by nearest date, each with its follow-up state.
   Changes: lists Client, lists Note.
2. The designer opens a client from the list. The website shows the client details with dated notes and offers to mark a follow-up done or push it a week with one click.
   Changes: reads Client, lists Note.
3. The designer writes a note with an optional follow-up date and saves it.
   - Note text (required, up to 2000 characters), e.g. "Call went well, wants homepage audit next week"
   - Follow-up date (optional), e.g. "2026-11-05"
   The website saves the dated note and shows it with the client, updating the follow-up order.
   Changes: creates Note.
4. The designer chooses Mark done or Push a week on a follow-up. The website clears the follow-up date when marked done or moves it a week forward when pushed, and updates the client list order.
   Changes: updates Note.

Other paths
- F06.A01 (from 1, empty) There are no clients yet: The website says there are no clients yet and offers to add a client. Back to 1.
- F06.A02 (from 2, notFound) The client was deleted in the meantime: The website says the client is gone and shows the client list. Back to 1.
- F06.A03 (from 2, empty) The client has no notes yet: The website says there are no notes yet and offers to add a note. Back to 2.
- F06.A04 (from 3, invalid) The note text is empty: The website marks what is wrong and keeps what was typed. Back to 3.
- F06.A05 (from 3, failure) Saving the note fails: The website keeps the values and offers to retry. Back to 3.
- F06.A06 (from 4, failure) Updating the follow-up fails: The website keeps the follow-up as it was and offers to retry. Back to 4.

Outcome: Notes and follow-up dates are saved; done clears the date and push adds 7 days; after refresh the list still sorts overdue first.

## F07 Edit a client
Designer · manage · Goal: Keep client details correct.
Before: Signed in.; At least one client exists.

1. The designer opens the client list. The website shows the clients with their follow-up states.
   Changes: lists Client.
2. The designer opens a client. The website shows the client name, email, company, profile and status.
   Changes: reads Client.
3. The designer changes the client details and saves them. (Client form)
   - Client name (required, up to 120 characters), e.g. "Priya Nair"
   - Client email (required), e.g. "priya@brightco.com"
   - Company (optional, up to 120 characters), e.g. "Bright Co"
   - Client profile (optional, up to 1000 characters), e.g. "Runs a D2C skincare brand, met at design meetup, pays per project"
   - Client status (optional, one of: Lead, Active, Past), e.g. "Lead"
   The website saves the changes and shows the updated client in the list and detail.
   Changes: updates Client.

Other paths
- F07.A01 (from 1, empty) There are no clients: The website says there are no clients and offers to add a client. Back to 1.
- F07.A02 (from 2, notFound) The client was deleted in the meantime: The website says the client is gone and shows the client list. Back to 1.
- F07.A03 (from 3, invalid) Required name or email is missing or not valid: The website marks what is wrong and keeps what was typed. Back to 3.
- F07.A04 (from 3, failure) Saving fails: The website keeps the values and offers to retry. Back to 3.
- F07.A05 (from 3, cancel) The designer cancels without saving: Nothing is changed; the website shows the client again as it was. Flow ends.

Outcome: The Client is updated and stays updated after refresh.

## F08 Delete a client
Designer · manage · Goal: Remove a client and everything under it.
Before: Signed in.; At least one client exists.

1. The designer opens the client list. The website shows the clients with their follow-up states.
   Changes: lists Client.
2. The designer opens a client. The website shows the client with its projects and notes and what else will be removed with it.
   Changes: reads Client, lists Project, lists Note.
3. The designer chooses Delete on the client. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Client, deletes Project, deletes Task, deletes Note.

Other paths
- F08.A01 (from 1, empty) There are no clients: The website says there are no clients and offers to add a client. Back to 1.
- F08.A02 (from 2, notFound) The client was deleted in the meantime: The website says the client is gone and shows the client list. Back to 1.
- F08.A03 (from 3, confirm) The designer confirms the deletion: The website shows the client list without the client, its projects, tasks and notes. Flow ends.
- F08.A04 (from 3, cancel) The designer cancels the deletion: Nothing is deleted; the website shows the client again unchanged. Flow ends.
- F08.A05 (from 2, empty) The client has no projects or notes yet: The website says there is nothing else under the client and still offers to delete the client. Back to 2.

Outcome: The Client with its Projects, Tasks and Notes is gone and stays gone after refresh.

## F09 Add a project to a client
Designer · core · Goal: Start a piece of work for a client.
Before: Signed in.; At least one client exists.

1. The designer opens the project list. The website shows all projects with their client and how many tasks are still open.
   Changes: lists Project, lists Task.
2. The designer chooses to add a project. The website shows an empty project form.
3. The designer fills in the project and saves it. (Project form)
   - Project client (required, one of the Client records), e.g. "Priya Nair"
   - Project name (required, up to 150 characters), e.g. "Homepage redesign"
   - Project description (optional, up to 1000 characters), e.g. "Audit and redesign of marketing homepage"
   - Project due date (optional), e.g. "2026-12-10"
   The website saves the project under the chosen client and shows it in the list with zero open tasks.
   Changes: creates Project.

Other paths
- F09.A01 (from 1, empty) There are no projects yet: The website says there are no projects yet and invites the designer to add one. Back to 2.
- F09.A02 (from 3, invalid) Required project name or client is missing: The website marks what is missing and keeps what was typed. Back to 3.
- F09.A03 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.
- F09.A04 (from 2, cancel) The designer cancels: Nothing is saved; the website shows the project list as it was. Flow ends.

Outcome: A new Project linked to the Client is saved and still shows its open task count after refresh.

## F10 Find and work through tasks
Designer · core · Goal: Work through project tasks.
Before: Signed in.; At least one project exists.

1. The designer opens the project list. The website shows all projects with how many tasks are still open on each.
   Changes: lists Project, lists Task.
2. The designer opens a project. The website shows the project details and its tasks, with overdue tasks standing out.
   Changes: reads Project, lists Task.
3. The designer searches by title and filters by status and priority.
   - Task search text (optional, up to 100 characters), e.g. "hero"
   - Task status filter (optional, one of: All, To do, In progress, Done), e.g. "In progress"
   - Task priority filter (optional, one of: All, Low, Medium, High), e.g. "High"
   The website shows only the tasks matching the search text, status and priority.
   Changes: lists Task.
4. The designer chooses to add a task. The website shows an empty task form.
5. The designer fills in the task and saves it. (Task form)
   - Task title (required, up to 200 characters), e.g. "Draft hero options"
   - Task status (optional, one of: To do, In progress, Done), e.g. "To do"
   - Task priority (optional, one of: Low, Medium, High), e.g. "High"
   - Task due date (optional), e.g. "2026-11-02"
   The website saves the task and shows it in the project task list.
   Changes: creates Task.
6. The designer ticks a task done. The website marks the task Done and updates the open task count.
   Changes: updates Task.

Other paths
- F10.A01 (from 1, empty) There are no projects yet: The website says there are no projects yet and invites the designer to add one. Flow ends.
- F10.A02 (from 2, notFound) The project was deleted in the meantime: The website says the project is gone and shows the project list. Flow ends.
- F10.A03 (from 2, empty) The project has no tasks yet: The website says the project has no tasks yet and invites the designer to add one. Back to 4.
- F10.A04 (from 3, empty) No tasks match the search or filters: The website says nothing matches and offers to clear the search and filters or add a task. Back to 3.
- F10.A05 (from 5, invalid) Required task title is missing: The website marks what is missing and keeps what was typed. Back to 5.
- F10.A06 (from 5, failure) Saving the task fails: The website keeps the typed values and offers to retry. Back to 5.
- F10.A07 (from 4, cancel) The designer cancels adding a task: Nothing is saved; the website shows the project tasks as they were. Back to 2.
- F10.A08 (from 6, failure) Marking the task done fails: The website keeps the task as it was and offers to retry. Back to 6.

Outcome: Tasks are created and their Done state is saved; after refresh the project still shows the same counts, filters and highlights.

## F11 Edit a project or task
Designer · manage · Goal: Correct project and task details.
Before: Signed in.; At least one project exists.

1. The designer opens the project list. The website shows all projects with their open task counts.
   Changes: lists Project, lists Task.
2. The designer opens a project. The website shows the project details and its tasks with overdue tasks standing out.
   Changes: reads Project, lists Task.
3. The designer chooses to edit the project. The website shows the project form filled with the current values.
   Changes: reads Project.
4. The designer changes the project and saves it. (Project form)
   - Project client (required, one of the Client records), e.g. "Priya Nair"
   - Project name (required, up to 150 characters), e.g. "Homepage redesign"
   - Project description (optional, up to 1000 characters), e.g. "Audit and redesign of marketing homepage"
   - Project due date (optional), e.g. "2026-12-10"
   The website saves the changes and shows the updated project.
   Changes: updates Project.
5. The designer chooses to edit a task. The website shows the task form filled with the current values.
   Changes: reads Task.
6. The designer changes the task and saves it. (Task form)
   - Task title (required, up to 200 characters), e.g. "Draft hero options"
   - Task status (optional, one of: To do, In progress, Done), e.g. "To do"
   - Task priority (optional, one of: Low, Medium, High), e.g. "High"
   - Task due date (optional), e.g. "2026-11-02"
   The website saves the changes and shows the updated task in the list.
   Changes: updates Task.

Other paths
- F11.A01 (from 1, empty) There are no projects: The website says there are no projects yet and invites the designer to add one. Flow ends.
- F11.A02 (from 2, notFound) The project was deleted in the meantime: The website says the project is gone and shows the project list. Flow ends.
- F11.A03 (from 4, invalid) Required project name or client is missing: The website marks what is wrong and keeps what was typed. Back to 4.
- F11.A04 (from 4, failure) Saving the project fails: The website keeps the typed values and offers to retry. Back to 4.
- F11.A05 (from 3, cancel) The designer cancels editing the project: Nothing is changed; the website shows the project as it was. Back to 2.
- F11.A06 (from 5, notFound) The task was deleted in the meantime: The website says the task is gone and shows the project tasks. Back to 2.
- F11.A07 (from 6, invalid) Required task title is missing: The website marks what is wrong and keeps what was typed. Back to 6.
- F11.A08 (from 6, failure) Saving the task fails: The website keeps the typed values and offers to retry. Back to 6.
- F11.A09 (from 5, cancel) The designer cancels editing the task: Nothing is changed; the website shows the task as it was. Back to 2.
- F11.A10 (from 2, empty) The project has no tasks yet: The website says the project has no tasks yet and the designer can still edit the project details. Back to 2.

Outcome: The Project or Task is updated and stays updated after refresh.

## F12 Delete a project or task
Designer · manage · Goal: Remove work that is no longer needed.
Before: Signed in.; At least one project exists.

1. The designer opens the project list. The website shows all projects with their open task counts.
   Changes: lists Project, lists Task.
2. The designer opens a project. The website shows the project details and its tasks.
   Changes: reads Project, lists Task.
3. The designer chooses Delete on a task. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Task.
4. The designer chooses Delete on the project. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Project, deletes Task.

Other paths
- F12.A01 (from 1, empty) There are no projects: The website says there are no projects yet and invites the designer to add one. Flow ends.
- F12.A02 (from 2, notFound) The project was deleted in the meantime: The website says the project is gone and shows the project list. Flow ends.
- F12.A03 (from 2, empty) The project has no tasks: The website says the project has no tasks and offers to delete the project. Back to 4.
- F12.A04 (from 3, confirm) The designer confirms deleting the task: The website shows the task list without the deleted task. Flow ends.
- F12.A05 (from 3, cancel) The designer cancels deleting the task: Nothing is deleted; the website shows the task as it was. Flow ends.
- F12.A06 (from 4, confirm) The designer confirms deleting the project: The website shows the project list without the deleted project and its tasks. Flow ends.
- F12.A07 (from 4, cancel) The designer cancels deleting the project: Nothing is deleted; the website shows the project as it was. Flow ends.

Outcome: The Task is gone, or the Project with its Tasks is gone, and stays gone after refresh.

## F13 Set weekly availability
Designer · core · Goal: Define when sessions can be booked.
Before: Signed in.

1. The designer opens weekly availability. The website shows the weekly availability rules with weekday, start and end time.
   Changes: lists Availability.
2. The designer chooses to add an availability rule. The website shows an empty availability form.
3. The designer fills in the rule and saves it.
   - Availability weekday (required, one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday), e.g. "Tuesday"
   - Availability start time (required), e.g. "10:00"
   - Availability end time (required), e.g. "14:00"
   The website saves the rule and shows the updated weekly rules.
   Changes: creates Availability.
4. The designer chooses to edit an availability rule. The website shows the rule form filled with the current values.
   Changes: reads Availability.
5. The designer changes the rule and saves it.
   - Availability weekday (required, one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday), e.g. "Tuesday"
   - Availability start time (required), e.g. "10:00"
   - Availability end time (required), e.g. "14:00"
   The website saves the changes and shows the updated weekly rules.
   Changes: updates Availability.
6. The designer chooses Delete on an availability rule. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Availability.

Other paths
- F13.A01 (from 1, empty) No availability rules are set yet: The website says no availability is set so no slots can be booked, and invites the designer to add a rule. Back to 2.
- F13.A02 (from 3, invalid) Weekday is missing or end time is not after start time: The website marks what is wrong and keeps what was typed. Back to 3.
- F13.A03 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.
- F13.A04 (from 2, cancel) The designer cancels adding a rule: Nothing is saved; the website shows the availability rules as they were. Back to 1.
- F13.A05 (from 4, notFound) The rule was deleted in the meantime: The website says the rule is gone and shows the availability rules. Flow ends.
- F13.A06 (from 5, invalid) Weekday is missing or end time is not after start time: The website marks what is wrong and keeps what was typed. Back to 5.
- F13.A07 (from 5, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 5.
- F13.A08 (from 6, confirm) The designer confirms deleting the rule: The website shows the availability rules without the deleted rule. Flow ends.
- F13.A09 (from 6, cancel) The designer cancels deleting the rule: Nothing is deleted; the website shows the rule as it was. Flow ends.

Outcome: Availability rules are saved; after refresh the same weekly rules are still shown and drive open slots.

## F14 Manage session types
Designer · manage · Goal: Define what visitors can book.
Before: Signed in.

1. The designer opens session types. The website shows the session types with name, duration, displayed price and max people per slot.
   Changes: lists SessionType.
2. The designer chooses to add a session type. The website shows an empty session type form.
3. The designer fills in the session type and saves it.
   - Session type name (required, up to 120 characters), e.g. "Discovery call"
   - Session type duration (required, 15 to 480), e.g. "30"
   - Displayed price (optional, up to 30 characters), e.g. "Free"
   - Max people per slot (required, 1 to 20), e.g. "1"
   The website saves the session type and shows it in the list.
   Changes: creates SessionType.
4. The designer chooses to edit a session type. The website shows the session type form filled with the current values.
   Changes: reads SessionType.
5. The designer changes the session type and saves it.
   - Session type name (required, up to 120 characters), e.g. "Discovery call"
   - Session type duration (required, 15 to 480), e.g. "30"
   - Displayed price (optional, up to 30 characters), e.g. "Free"
   - Max people per slot (required, 1 to 20), e.g. "1"
   The website saves the changes and shows the updated session type list.
   Changes: updates SessionType.
6. The designer chooses Delete on a session type. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes SessionType.

Other paths
- F14.A01 (from 1, empty) There are no session types: The website says there are no session types and invites the designer to add one. Back to 2.
- F14.A02 (from 3, invalid) Required name, duration or max people is missing or out of range: The website marks what is wrong and keeps what was typed. Back to 3.
- F14.A03 (from 3, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 3.
- F14.A04 (from 2, cancel) The designer cancels adding a type: Nothing is saved; the website shows the session types as they were. Back to 1.
- F14.A05 (from 4, notFound) The session type was deleted in the meantime: The website says the session type is gone and shows the session type list. Flow ends.
- F14.A06 (from 5, invalid) Required name, duration or max people is missing or out of range: The website marks what is wrong and keeps what was typed. Back to 5.
- F14.A07 (from 5, failure) Saving fails: The website keeps the typed values and offers to retry. Back to 5.
- F14.A08 (from 6, confirm) The designer confirms deleting the type: The website shows the session type list without the deleted type. Flow ends.
- F14.A09 (from 6, cancel) The designer cancels deleting the type: Nothing is deleted; the website shows the session type as it was. Flow ends.

Outcome: SessionTypes are saved including the discovery, review and workshop defaults as edited; after refresh they are still shown.

## F15 View and cancel upcoming sessions
Designer · manage · Goal: Manage upcoming sessions and bookings.
Before: Signed in.; Availability and session types are set.

1. The designer opens upcoming sessions. The website shows upcoming sessions with date, time, session type and how many people are booked on each.
   Changes: lists Session, lists Booking.
2. The designer opens a session. The website shows the session details with its bookings and linked clients.
   Changes: reads Session, lists Booking.
3. The designer chooses Cancel on a single booking. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Booking.
4. The designer chooses Cancel on the whole slot. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Session, deletes Booking.

Other paths
- F15.A01 (from 1, empty) There are no upcoming sessions: The website says there are no upcoming sessions and explains that slots appear once availability and session types are set and booked. Flow ends.
- F15.A02 (from 2, notFound) The session was cancelled in the meantime: The website says the session is gone and shows the upcoming sessions. Flow ends.
- F15.A03 (from 2, empty) The session has no bookings: The website says nobody has booked this slot yet and offers to cancel the slot. Back to 4.
- F15.A04 (from 3, confirm) The designer confirms cancelling the booking: The website shows the session with one freed seat and without the cancelled booking. Flow ends.
- F15.A05 (from 3, cancel) The designer cancels the cancellation: Nothing is cancelled; the website shows the booking as it was. Flow ends.
- F15.A06 (from 4, confirm) The designer confirms cancelling the slot: The website shows the upcoming sessions without the cancelled slot and its bookings. Flow ends.
- F15.A07 (from 4, cancel) The designer cancels the slot cancellation: Nothing is cancelled; the website shows the session as it was. Flow ends.

Outcome: Cancelled slots and bookings are removed and freed seats reopen; after refresh the upcoming list stays without the cancelled items.

## F16 Book a session from the public page
Booker · core · Goal: Book a session without an account.
Before: Designer has set availability and session types.

1. The booker opens the public booking page. The website shows the bookable session types with duration and displayed price.
   Changes: lists SessionType.
2. The booker picks a session type.
   - Session type choice (required, one of the SessionType records), e.g. "Discovery call"
   The website shows the open slots for the next two weeks for that type, without other bookers names or emails.
   Changes: lists Session.
3. The booker picks an open slot and books with name and email.
   - Slot choice (required, one of the Session records), e.g. "Tue 3 Nov 10:00 Discovery call"
   - Booker name (required, up to 120 characters), e.g. "Rohan Mehta"
   - Booker email (required), e.g. "rohan@startup.com"
   The website saves the booking, links it to the client with the same email or creates a new Lead client, and shows a confirmation with a cancellation link.
   Changes: creates Booking, lists Client, creates Client.

Other paths
- F16.A01 (from 1, empty) No session types are available for booking: The website says no sessions can be booked right now. Flow ends.
- F16.A02 (from 2, empty) There are no open slots for the chosen type in the next two weeks: The website says there are no open slots for that type and invites the booker to pick another type. Back to 1.
- F16.A03 (from 3, invalid) Name or email is missing or email is not valid: The website marks what is wrong and keeps what was typed. Back to 3.
- F16.A04 (from 3, failure) Saving the booking fails: The website keeps the typed values and offers to retry. Back to 3.
- F16.A05 (from 3, conflict) The slot just became full: The website says the slot is now full and shows the remaining open slots. Back to 2.
- F16.A06 (from 3, notFound) The slot no longer exists: The website says the slot is no longer available and shows the open slots. Back to 2.
- F16.A07 (from 3, empty) No existing client matches the booking email: The website creates a new Lead client for the booking and shows the confirmation with the cancellation link. Flow ends.

Outcome: A Session booking is saved and linked to the matching Client or a new Lead Client; after refresh the slot shows as booked or full and the confirmation with link is retrievable from the booking.

## F17 Cancel a booking via link
Booker · manage · Goal: Cancel my own booking.
Before: Has a booking cancellation link.

1. The booker opens the cancellation link. The website shows the booking's session type, date and time and asks to confirm cancellation.
   Changes: reads Booking.
2. The booker chooses to cancel the booking. Confirm deletion (subflow STD01):
   1. (system) The website asks to confirm the deletion and says what else will be removed with it.

   Other paths
   - STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
   - STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.
   Changes: deletes Booking.

Other paths
- F17.A01 (from 1, notFound) The link is invalid or the booking was already cancelled: The website says the booking cannot be found and offers to start a new booking from the public booking page. Flow ends.
- F17.A02 (from 2, confirm) The booker confirms cancellation: The website shows the booking is cancelled and the seat is freed. Flow ends.
- F17.A03 (from 2, cancel) The booker keeps the booking: The website shows the booking unchanged with its session details. Flow ends.

Outcome: The Booking is removed and its seat is freed; after refresh the booking stays cancelled and the slot is open again.

## F18 Designer sign out
Designer · auth · Goal: Leave the workspace safely.
Before: Signed in.

1. The designer chooses to sign out. The website signs out the designer and shows the public landing page explaining the workspace and how to start.

Outcome: The designer is signed out; after refresh the workspace requires sign-in and the landing page is shown.

## Fields
- FD01 Designer email (required), e.g. "maya@example.com". Email the designer uses to sign up and sign in
- FD02 Password (required, at least 8 characters), e.g. "calm-studio-42". Secret that proves the designer owns the account
- FD03 Client name (required, up to 120 characters), e.g. "Priya Nair". How the designer refers to the client
- FD04 Client email (required), e.g. "priya@brightco.com". Email used to match bookings to this client
- FD05 Company (optional, up to 120 characters), e.g. "Bright Co". Optional company the client works for
- FD06 Client profile (optional, up to 1000 characters), e.g. "Runs a D2C skincare brand, met at design meetup, pays per project". Short note about what they do, how met and what they pay
- FD07 Client status (optional, one of: Lead, Active, Past), e.g. "Lead". Where the client is in the relationship
- FD08 Note text (required, up to 2000 characters), e.g. "Call went well, wants homepage audit next week". What was discussed or decided with the client
- FD09 Follow-up date (optional), e.g. "2026-11-05". When the designer should next contact the client
- FD10 Project name (required, up to 150 characters), e.g. "Homepage redesign". How the designer refers to the work for a client
- FD11 Project description (optional, up to 1000 characters), e.g. "Audit and redesign of marketing homepage". Short summary of what the project covers
- FD12 Project due date (optional), e.g. "2026-12-10". Optional date the project should be finished by
- FD13 Task title (required, up to 200 characters), e.g. "Draft hero options". What needs to be done in the project
- FD14 Task status (optional, one of: To do, In progress, Done), e.g. "To do". Where the task is in its workflow
- FD15 Task priority (optional, one of: Low, Medium, High), e.g. "High". How urgent the task is
- FD16 Task due date (optional), e.g. "2026-11-02". Optional date the task should be done by, overdue when before today and not Done
- FD17 Availability weekday (required, one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday), e.g. "Tuesday". Which day of the week sessions can be offered
- FD18 Availability start time (required), e.g. "10:00". Time from which sessions can start on that weekday
- FD19 Availability end time (required), e.g. "14:00". Time by which sessions must end on that weekday
- FD20 Session type name (required, up to 120 characters), e.g. "Discovery call". Name of the bookable offering shown to bookers
- FD21 Session type duration (required, 15 to 480), e.g. "30". Length of one slot in minutes
- FD22 Displayed price (optional, up to 30 characters), e.g. "Free". Price shown for information only, nobody pays in the app
- FD23 Max people per slot (required, 1 to 20), e.g. "1". How many bookings a slot holds before it is full
- FD24 Booker name (required, up to 120 characters), e.g. "Rohan Mehta". Name of the visitor booking a session
- FD25 Booker email (required), e.g. "rohan@startup.com". Email used to link the booking to a client and to identify the booking
- FD26 Task search text (optional, up to 100 characters), e.g. "hero". Free text to find tasks by title
- FD27 Task status filter (optional, one of: All, To do, In progress, Done), e.g. "In progress". Show only tasks with this status
- FD28 Task priority filter (optional, one of: All, Low, Medium, High), e.g. "High". Show only tasks with this priority
- FD29 Project client (required, one of the Client records), e.g. "Priya Nair". Which client the project belongs to
- FD30 Session type choice (required, one of the SessionType records), e.g. "Discovery call". Which offering the booker wants to book
- FD31 Slot choice (required, one of the Session records), e.g. "Tue 3 Nov 10:00 Discovery call". Which open time the booker reserves

## Forms
- FM01 Designer auth form: FD01, FD02
- FM02 Client form: FD03, FD04, FD05, FD06, FD07
- FM03 Project form: FD29, FD10, FD11, FD12
- FM04 Task form: FD13, FD14, FD15, FD16

## STD01 Confirm deletion (standard subflow)

1. (system) The website asks to confirm the deletion and says what else will be removed with it.

Other paths
- STD01.A01 (from 1, confirm) The user confirms: The website deletes the record and what belongs to it. Back to the calling flow.
- STD01.A02 (from 1, cancel) The user cancels: Nothing is deleted; the record stays as it was. Back to the calling flow.

## New assumptions
- A11 (behavior, affects F10, F11): Quick tick sets Task status to Done; unticking returns it to To do. Overdue highlight applies only to Tasks not Done whose due date is before today.
- A12 (behavior, affects F16, F17): Each Booking gets a unique cancellation link shown on screen right after booking; the link works without sign-in and stays usable until the Booking is cancelled.

# Solo Studio: flows catalog

## Flows
- F01 View landing page and get started (Designer, browse): A new visitor arrives on the public landing page that explains Solo Studio for freelance client, project and booking management, then chooses to start as designer or to view booking, and the website guides them to sign up or to the public booking page.
- F02 Designer sign up (Designer, auth): A new designer creates an account with email and password from the landing page, and the website creates the isolated workspace, signs them in and lands them on home ready to add the first client.
- F03 Designer sign in (Designer, auth): A returning designer signs in with email and password, and the website verifies the credentials and shows home with today's sessions, follow-ups and overdue tasks.
- F04 Designer sign out (Designer, auth): A signed-in designer chooses to sign out, and the website ends the session and shows the public landing page.
- F05 View home dashboard (Designer, core): A signed-in designer opens home to see today's sessions, follow-ups due this week including overdue, and overdue tasks, and can jump to a session, client note or task from each section.
- F06 Add a client (Designer, core): A signed-in designer adds a client with name, email, optional company and profile and status, and the website saves it and shows it in the client list with its follow-up state.
- F07 View client list and edit client (Designer, manage): A signed-in designer browses the client list sorted overdue follow-ups first, opens a client to see details, notes and projects, and edits name, email, company, profile or status, with the website saving changes and updating the list order.
- F08 Delete a client (Designer, manage): A signed-in designer deletes a client after confirmation, and the website removes the client together with its projects, tasks, notes and bookings while leaving other sessions in place.
- F09 Manage notes and follow-ups (Designer, core): A signed-in designer opens a client, adds dated notes with optional follow-up dates, edits or deletes notes, and marks a follow-up done or pushes it a week with one click, with the website updating due states and client list order.
- F10 Add and view projects (Designer, core): A signed-in designer adds a project under a client with name, description and optional due date, and views all projects with their count of still-open tasks, opening a project to see its tasks.
- F11 Edit and delete a project (Designer, manage): A signed-in designer edits a project's name, description or due date, or deletes it after confirmation, with the website saving edits or removing the project and all its tasks.
- F12 Manage tasks in a project (Designer, core): A signed-in designer opens a project to see its tasks with overdue highlight, adds tasks, searches by title, filters by status and priority, and ticks a task done quickly, with the website updating the list and open counts.
- F13 Edit and delete a task (Designer, manage): A signed-in designer edits a task's title, status, priority or due date, or deletes it after confirmation, with the website saving changes and updating overdue highlight and project counts.
- F14 Set availability and session types (Designer, settings): A signed-in designer sets weekly recurring availability with days and start/end times and creates, edits or deletes session types with duration, display-only price and maximum people, with the website saving them for generating the next two weeks of slots.
- F15 View upcoming sessions and cancel a slot (Designer, manage): A signed-in designer views upcoming sessions with booking counts and bookers, and cancels a slot after confirmation, with the website removing the slot and cancelling everyone booked on it.
- F16 Book a session from public page (Booker, core): A visitor without an account opens the public booking page, picks a session type with its display-only price, sees open slots for the next two weeks excluding full and past slots, and books with name and email, with the website linking to the matching client or creating a new Lead and showing an on-screen confirmation with a cancellation link.
- F17 Cancel a booking via link (Booker, manage): A visitor opens their unique cancellation link, views the booking details, and cancels it, with the website freeing the seat and keeping the client record.

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

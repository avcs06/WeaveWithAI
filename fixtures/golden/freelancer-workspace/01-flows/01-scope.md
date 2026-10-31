# Solo Studio: scope

For a freelance UX designer juggling clients across inbox, notes, spreadsheets and back-and-forth booking emails. It centralizes clients with notes and follow-ups, client projects with tasks, and availability-based booking for discovery calls, design reviews and workshops. The designer manages everything from a home view of today's sessions, follow-ups and overdue tasks, while visitors self-book from a public page without accounts.

Audience: Solo freelance UX designer; public visitors who book sessions

## Roles
- Designer (designer, signs in): Freelance designer who owns all data; manages clients, notes, projects, tasks, availability, session types and sessions.
- Booker (booker, no sign-in): Public visitor without an account who books a session from the public booking page and can cancel via cancellation link.

## Vocabulary
- Client (owned by Designer): Person or company the designer works with; has name, email, optional company, short profile and status Lead, Active, Past.
- Note (owned by Designer): Dated text jotted under a client after calls with optional follow-up date and follow-up done state.
- Project (owned by Designer): Work for a client with name, short description and optional due date.
- Task (owned by Designer): Work item in a project with title, status To do, In progress, Done, priority Low, Medium, High and optional due date.
- Availability (owned by Designer): Weekly recurring available days with start and end times used to offer bookable slots.
- SessionType (owned by Designer): Bookable offering with name, duration, display-only price and maximum people per slot.
- Session (owned by Designer): Scheduled time slot of a session type that visitors can book until full.
- Booking (owned by Designer): Reservation by a visitor with name and email on a session, linked to a client and cancellable via link.

## Capabilities
- accounts: Designer signs up/signs in with email and password; bookers never sign in.
- userOwnedData: Each designer sees only their own clients, notes, projects, tasks, sessions and bookings.
- crud: Designer lists, views, creates, edits and deletes clients, notes, projects, tasks, availability, session types and sessions.
- search: Search tasks by title.
- filterSort: Filter tasks by status and priority; client list sorts follow-up overdue first.
- roles: Designer signed in and Booker public visitor without sign-in.
- publicPages: Landing page, public booking page and public cancellation link page.
- statusWorkflow: Client status Lead, Active, Past and Task status To do, In progress, Done with free transitions.
- datesDeadlines: Note follow-up dates, project and task due dates, weekly availability and session times.
- simpleCounts: Count of still-open tasks per project.

## In scope
- Public landing page explaining the app for freelance client, project and booking management and how to start.
- Client list with name, email, optional company, short profile and status Lead, Active, Past, showing who is due for a follow-up overdue first.
- Dated notes under each client with optional follow-up date and one-click mark follow-up done or push a week.
- Projects belonging to a client with name, short description and optional due date, showing how many tasks are still open.
- Tasks with title, status To do, In progress, Done, priority Low, Medium, High and optional due date, with filter by status and priority, search by title, quick tick done and overdue highlight.
- Edit and delete for clients, projects and tasks; deleting a project deletes its tasks and deleting a client deletes its projects and notes.
- Weekly availability setting with days and start/end times and session types with duration, display-only price and maximum people.
- Upcoming sessions list with ability to cancel a slot, which cancels everyone booked on it.
- Public booking page where visitors without accounts pick a session type, see open slots for the next two weeks and book with name and email; a slot is full when it reaches the session type maximum.
- Automatic client linking on booking: matching email books under that client, otherwise creates a new Lead client.
- On-screen confirmation with cancellation link after booking and cancellation via link with no emails sent.
- Home screen with today's sessions, follow-ups due this week and overdue tasks.

## Out of scope
- Online payments and charging: Idea requires prices display-only and nobody pays in the app. Instead: Price shown as text on session types and booking page with no checkout.
- Email notifications and reminders: Idea requires no emails sent. Instead: Shows confirmation and cancellation link on screen after booking; no emails sent.

## Assumptions
- A01 (scope): Each designer account has its own isolated workspace; there is no sharing, collaboration or team view. 'Just for me' means no other signed-in roles.
- A02 (data): Client requires name and email only; company and profile are optional; status defaults to Lead and can be changed freely between Lead, Active, Past.
- A03 (behavior): Each note has auto creation date, text, optional follow-up date and follow-up done flag. Due means follow-up date is set and not done; overdue means follow-up date is before today and not done; client list sorts overdue first then by earliest due date.
- A04 (behavior): Mark follow-up done sets done flag and keeps the note; Push a week adds 7 days to the follow-up date and leaves it not done.
- A05 (behavior): Task requires title only; status defaults to To do, priority defaults to Medium, due date optional. Ticking done sets status to Done. Overdue means due date is before today and status is not Done, shown highlighted.
- A06 (behavior): Open tasks count means tasks with status To do or In progress.
- A07 (behavior): Deleting a project deletes its tasks. Deleting a client deletes its projects and tasks, its notes, and its bookings; sessions themselves remain unless they have no bookings left.
- A08 (behavior): Availability is weekly recurring days with start and end times. Open slots for the next two weeks are availability sliced into back-to-back slots of each session type duration, excluding past times, full slots and cancelled slots. Sessions cannot overlap regardless of type.
- A09 (scope): The three session types are pre-seeded: 30 minute discovery call free for 1 person, 60 minute design review INR 4,000 shown for information for 1 person, 2 hour Figma workshop INR 2,500 a seat for up to 8 people. Designer can create, edit and delete session types; prices are display-only text.
- A10 (behavior): Booking email match is case-insensitive exact match to an existing client email. If no match, a new client is created as Lead with that name and email and empty company and profile. Cancelling a booking never deletes the client.
- A11 (permission): Booking confirmation shows a unique unguessable cancellation link on screen. Anyone with the link can view and cancel the booking without signing in. No emails are sent.
- A12 (behavior): Home shows: sessions dated today, follow-ups not done with follow-up date up to end of the current week including overdue, and overdue tasks across all projects.
- A13 (scope): No mandatory setup before first value; after sign-up the designer lands on home and can add the first client immediately.

## Questions
- Q01: Should slots include buffer time between sessions? Why: Changes slot generation rules and how many bookable slots appear. Default: No buffer; back-to-back slots allowed.
- Q02: When you cancel a session slot, should bookers see anything beyond the slot disappearing? Why: With no emails, it changes whether any in-app notice or placeholder is needed. Default: Slot and its bookings disappear from upcoming with no notification.

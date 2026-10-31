# StudioDesk: scope

StudioDesk is a single workspace for a freelance UX designer whose clients, notes, project tasks, and bookings are currently scattered across email, notes, and spreadsheets. She manages clients, follow-ups, projects, and tasks, publishes her availability and session types, and receives bookings through a public page. Bookers pick a session type and an open slot, book with their name and email, and can cancel through a link shown on screen.

Audience: A freelance UX designer working solo, plus people who book sessions with her without creating an account.

## Roles
- Designer (designer, signs in): The freelance UX designer. The main role and the one the landing page invites in: she signs up and signs in, and owns all clients, notes, projects, tasks, availability, session types, sessions, and bookings. Her home screen shows today's sessions, follow-ups due this week, and overdue tasks.
- Booker (booker, no sign-in): A person booking a session with the designer. Never signs in: opens the public booking page, picks a session type and an open slot, books with name and email, and cancels through the cancellation link shown on screen after booking.

## Vocabulary
- Client (owned by Designer): A person or company the designer works with. Fields: name, email, company (optional), profile (what they do, how we met, what they pay), status (Lead, Active, Past), follow-up date (optional). Deleting a Client deletes its Projects, their Tasks, and its Notes.
- Note (owned by Designer): A dated note jotted under a Client after a call. Fields: date, text. Belongs to a Client.
- Project (owned by Designer): A piece of work for a Client. Fields: name, description, due date (optional). Belongs to a Client; deleting a Project deletes its Tasks.
- Task (owned by Designer): A to-do inside a Project. Fields: title, status (To do, In progress, Done), priority (Low, Medium, High), due date (optional). Belongs to a Project.
- Availability (owned by Designer): The designer's weekly availability: which days, from what time to what time she can be booked.
- SessionType (owned by Designer): A kind of bookable session the designer defines. Fields: name, duration, price displayed for information (free for the discovery call), maximum people. Defaults: 30 minute discovery call, free, 1 person; 60 minute design review, ₹4,000, 1 person; 2 hour Figma workshop, ₹2,500 a seat, up to 8 people.
- Session (owned by Designer): One bookable slot of a SessionType at a specific date and start time, generated from Availability. It is full when its Bookings reach the SessionType's maximum people. The designer can cancel a Session, which cancels everyone booked on it.
- Booking (owned by Designer): One person's place on a Session, made from the public booking page with the booker's name and email and no account. It lands under the Client whose email matches, or creates that Client as a Lead. The booker can cancel it through the cancellation link shown on screen after booking.

## Capabilities
- accounts: The designer signs up, signs in, and signs out with email and password. Bookers never sign in.
- userOwnedData: The signed-in designer sees only her own clients, notes, projects, tasks, availability, session types, sessions, and bookings.
- crud: Create, view, edit, and delete clients, notes, projects, tasks, session types, and weekly availability; deleting a project deletes its tasks and deleting a client deletes its projects, their tasks, and its notes.
- search: Search tasks by title inside a project.
- filterSort: Filter a project's tasks by status and priority; the client list is sorted with overdue follow-ups first, then by follow-up date.
- publicPages: A public landing page, the public booking page for the next two weeks of open slots, and the per-booking cancellation link page.
- statusWorkflow: Client status is Lead, Active, or Past; task status is To do, In progress, or Done, and a task can be ticked Done quickly and moved back if needed.
- datesDeadlines: Dated client notes, client follow-up dates, optional project and task due dates, weekly availability, session dates, and overdue highlighting.
- simpleCounts: Open task count per project and seats booked versus the session type maximum on each session.
- roles: Two roles: the signed-in designer and the booker who never signs in.
- profileSettings: The designer manages her weekly availability and session types as her booking settings.

## In scope
- A public landing page that says StudioDesk is one calm workspace for a solo freelance UX designer to run clients, projects, and bookings, and invites the designer to sign up or sign in to start; it also links to the public booking page.
- The designer signs up and signs in with email and password and sees only her own data; bookers use the app without ever signing in.
- Clients with name, email, optional company, a short profile covering what they do, how we met, and what they pay, and a status of Lead, Active, or Past; the designer can create, view, edit, and delete clients.
- Under each client, dated notes the designer jots after calls, plus a follow-up date she can set and change.
- A client list sorted so clients due for a follow-up appear with overdue first, with one-click actions to mark a follow-up done or push it a week.
- Projects that belong to a client, each with a name, a short description, and an optional due date; the designer can create, view, edit, and delete projects.
- Tasks inside a project, each with a title, a status of To do, In progress, or Done, a priority of Low, Medium, or High, and an optional due date; the designer can create, view, edit, and delete tasks and tick a task Done quickly.
- A project list showing every project with how many of its tasks are still open, and a project view listing its tasks with filter by status and priority, search by title, and overdue tasks standing out.
- Deleting a project deletes its tasks, and deleting a client deletes its projects, their tasks, and its notes.
- The designer sets her weekly availability by choosing which days and from what time to what time she is available.
- Session types the designer defines, starting with a 30 minute discovery call that is free for one person, a 60 minute design review at ₹4,000 shown for information for one person, and a 2 hour Figma workshop at ₹2,500 a seat for up to 8 people; prices are only displayed and nobody pays in the app.
- A public booking page where a booker picks a session type, sees open slots for the next two weeks, and books with their name and email; a slot is full when its bookings reach the session type's maximum people.
- When a booker's email matches one of the designer's clients, the booking lands under that client; when it does not match, a new client is created as a Lead.
- After booking, the booker sees a cancellation link on screen and can use it to cancel their own booking; no emails are sent.
- The designer sees upcoming sessions and can cancel a slot, which cancels everyone booked on it.
- A home screen for the designer showing today's sessions, follow-ups due this week, and overdue tasks.

## Out of scope
- Taking payments for paid sessions or workshop seats: The idea states prices are only displayed and nobody pays in the app. Instead: Each session type shows its price as information text only, such as ₹4,000 or ₹2,500 a seat, and the discovery call shows as free.
- Sending booking confirmations, reminders, or cancellation emails: The idea states no emails are sent and the cancellation link is shown on screen. Instead: After booking, the booker sees their cancellation link on screen and uses that link to cancel; the designer sees bookings and cancellations in her upcoming sessions.
- Accounts or a portal for clients and bookers: The app is just for the designer, and people booking don't have accounts. Instead: Bookers book and cancel through the public booking page and their on-screen cancellation link, with no sign-in.
- Importing or syncing existing email, Apple Notes, spreadsheets, or calendars: The idea asks for one app to replace those tools going forward, not to connect to them. Instead: The designer adds clients, notes, projects, tasks, availability, and session types directly in the app.
- Team members, shared workspaces, or access for anyone besides the one designer: The idea says the app is just for her. Instead: One signed-in designer owns everything; the only other role is the booker who never signs in.

## Assumptions
- A01 (scope, affects firstSuccess, entry): Sign-up goes straight to the home screen. Setting availability, adding session types, or any other setup is not mandatory before the designer can add a first client, project, or task and see it saved.
- A02 (scope, affects businessRules, data): Marking a follow-up done clears that client's follow-up date. Pushing a follow-up adds seven days to its current date.
- A03 (scope, affects businessRules): On the client list, clients with an overdue follow-up come first, then clients due soonest, then clients with no follow-up date. Overdue means the follow-up date is before today and not marked done.
- A04 (scope, affects businessRules, data): Open tasks on a project are tasks with status To do or In progress. A task is overdue when its due date is before today and its status is not Done.
- A05 (scope, affects businessRules, data): Open slots are generated from the designer's weekly availability for the next two weeks, in the designer's local time zone, starting at the availability start time and repeating at the session type's duration as long as the whole session fits before the availability end time. Slots in the past are not shown.
- A06 (scope, affects businessRules, data): A booking joins an existing Session for the chosen session type and start time when one exists, otherwise it creates that Session. A Session is full when its Bookings reach the session type's maximum people; a full Session is shown as full and cannot be booked.
- A07 (scope, affects businessRules): Follow-ups due this week on the home screen means follow-up dates from today through the next seven days, including overdue ones shown separately by their overdue styling.
- A08 (scope, affects data, businessRules): The cancellation link shown after booking is a unique, hard-to-guess link for that one Booking. Anyone with the link can cancel that Booking; cancelling frees its seat so the slot can be booked again.
- A09 (scope, affects businessRules): Email matching between a booker and a client is an exact, case-insensitive match on the client's email. A newly created client from a booking starts as a Lead with the booker's name and email and no company or profile.
- A10 (scope, affects businessRules, data): Deleting a client also deletes that client's Bookings from the client's record; a Session itself remains for any other bookers on it, with that seat freed. Cancelling a Session by the designer cancels every Booking on it.
- A11 (scope, affects scope): The three session types named in the idea are present by default and the designer can edit or delete them and add her own, since she defines session types in the app.

## Questions
- Q01 (blocking): Do the different session types share one availability calendar, so a booked discovery call or design review blocks an overlapping workshop slot, and vice versa? Why: It changes how open slots are generated and when a slot counts as unavailable, which affects the core booking loop. Default: Yes. Booking any session type blocks that time for the other session types, except that additional bookers can still join the same Figma workshop session until it reaches 8 people.
- Q02: At what times should slots start inside an availability window? Why: It changes how open slots are generated and when a slot counts as unavailable, which affects the core booking loop. Default: Slots start at the availability start time and repeat at the session type's duration as long as the whole session fits before the availability end time.
- Q03: Which time zone should bookers see slot times in? Why: It changes how open slots are generated and when a slot counts as unavailable, which affects the core booking loop. Default: The designer's own local time zone is used and shown on the booking page, with no time zone conversion for bookers.

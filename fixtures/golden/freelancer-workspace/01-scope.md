# Solo Studio: scope

For a freelance UX designer whose clients, notes, tasks and bookings are scattered across inbox, notes, spreadsheets and email. The app gives her one calm private workspace for clients, notes, projects, tasks and self-serve booking. She manages follow-ups and tasks, sets availability and session types, and visitors book from a public page that links bookings to clients.

Audience: Solo freelance UX designer managing her own clients, projects and bookings

## Roles
- Designer (designer, signs in): Freelance UX designer who signs in to manage clients, notes, projects, tasks, availability, session types and bookings.
- Booker (booker, no sign-in): Visitor who books a session from the public booking page with name and email and cancels via link, without ever signing in.

## Vocabulary
- Client (owned by Designer): Person or company the designer works with; has name, email, optional company, short profile and status Lead, Active or Past.
- Note (owned by Designer): Dated note under a client with text, created date and optional follow-up date that can be marked done or pushed a week.
- Project (owned by Designer): Work for a client with name, short description and optional due date; shows how many tasks are still open.
- Task (owned by Designer): Work item in a project with title, status To do, In progress or Done, priority Low, Medium or High, and optional due date.
- Availability (owned by Designer): Weekly availability rule with weekday plus start and end time defining when sessions can be offered.
- SessionType (owned by Designer): Bookable offering with name, duration, displayed price and maximum people per slot, for example 30-min free discovery for 1.
- Session (owned by Designer): Scheduled slot from availability and a session type with date, start and end time; full when bookings reach the type maximum.
- Booking (owned by Designer): Reservation on a session with booker name and email linked to a client, with an on-screen cancellation link.

## Capabilities
- accounts: Designer signs up, signs in and signs out with email and password.
- userOwnedData: Designer sees only their own clients, projects, tasks, notes, sessions and bookings.
- crud: Create, list, view, edit and delete clients, notes, projects, tasks, availability, session types, sessions and bookings.
- search: Search tasks by title.
- filterSort: Filter tasks by status and priority; client list sorted overdue follow-ups first.
- roles: Designer signed in plus booker with no account using public booking only.
- publicPages: Public landing page plus public booking page with session types, open slots and cancellation link.
- statusWorkflow: Client Lead/Active/Past and Task To do/In progress/Done with allowed transitions.
- datesDeadlines: Follow-up dates, task and project due dates, weekly availability and session slots for next two weeks.
- simpleCounts: Open task counts per project and booking counts per slot to decide full.

## In scope
- Public landing page explaining the private client, project and booking workspace and how to sign in and share the booking page.
- Home dashboard showing todays sessions, follow-ups due this week, and overdue tasks.
- Clients with name, email, optional company, profile and status Lead, Active, Past; dated notes with follow-up dates; client list shows who is due with overdue first; one-click mark follow-up done or push a week.
- Projects belonging to a client with name, description and optional due date; project list shows open task counts; project detail shows tasks with filter by status and priority, search by title, quick tick done and overdue highlight; edit and delete clients, projects and tasks.
- Business rules: deleting a project deletes its tasks; deleting a client deletes its projects, tasks and notes; a slot is full when bookings reach the session type maximum; booking email matching an existing client links there otherwise creates a new Lead client.
- Weekly availability with days plus start and end times and session types with duration, displayed price and max people; upcoming sessions list with cancel slot that cancels everyone booked.
- Public booking page where visitors without accounts pick a session type, see open slots for the next two weeks, book with name and email, and receive an on-screen cancellation link to cancel without sign-in.

## Out of scope
- Online payments and checkout: Idea states prices are shown for information and nobody pays in the app. Instead: Prices shown as text on session types and booking page; no checkout form or charge.
- Email confirmations, reminders and notifications: Idea states after booking they see a cancellation link on screen and no emails are sent. Instead: Confirmation and cancellation link shown on screen after booking; designer relies on home dashboard; nothing is sent.
- Team access and shared lists: Idea is just for me with no shared access. Instead: Single designer account owns all data; no invites or sharing.

## Assumptions
- A01 (scope): All Clients, Notes, Projects, Tasks, Availability rules, SessionTypes, Sessions and Bookings belong to the signed-in designer; each designer sees only their own data and bookers never sign in.
- A02 (data): Required fields only: Client name and email; Note text; Project name; Task title; Availability weekday, start and end time; SessionType name, duration and max people; Booking name and email. Company, profile text, descriptions and due dates are optional; new Clients default to Lead and new Tasks default to To do / Medium.
- A03 (behavior): Mark follow-up done clears the follow-up date; Push a week adds 7 days to the existing follow-up date, or to today if missing or already overdue.
- A04 (behavior): Overdue means follow-up date or Task due date is before today and not done; client list sorts overdue follow-ups first then by nearest date, and overdue tasks are visually highlighted.
- A05 (behavior): Home shows Sessions dated today, Notes with follow-ups due in the next 7 calendar days including overdue, and Tasks that are overdue and not Done.
- A06 (behavior): Open slots are generated from weekly availability plus SessionType durations for the next 14 days, excluding past times, full slots and cancelled slots; bookers see only open slots, never other bookers names or emails.
- A07 (behavior): Booking matches Client by case-insensitive exact email within the designers clients; on match the Booking links to that Client, otherwise a new Lead Client is created with the booking name and email and empty company and profile.
- A08 (behavior): Designer cancelling a Session removes the slot and all its Bookings; cancelling a single Booking frees one seat and keeps the slot open.
- A09 (behavior): Deleting a Project deletes its Tasks; deleting a Client deletes its Projects, Tasks under those Projects, and Notes; Sessions remain but Bookings for a deleted Client email stay on the Session for seat history.
- A10 (scope): Availability starts empty so no slots show until set; the three SessionTypes from the idea (30-min free discovery for 1, 60-min review Rs.4,000 for 1, 2-hour workshop Rs.2,500 per seat up to 8) are pre-created and editable.

## Questions
- Q01: Should workshop slots show seats left (for example 3 of 8 left) or only open versus full? Why: Changes what booking data is shown and whether scarcity is used to drive bookings. Default: Show only open versus full without seat counts or other bookers details.
- Q02: Should past sessions and cancelled bookings stay visible as history? Why: Changes whether history lists and retention are in scope. Default: Upcoming lists show only future items; past sessions and done history are hidden in MVP.

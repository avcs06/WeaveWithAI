# Solo Studio: flows catalog

## Flows
- F01 Discover Solo Studio on the landing page (Designer, browse): A visitor arrives on the public landing page that explains the calm private workspace for clients, projects, tasks and self-serve booking, then chooses to sign in or sign up and reaches the start of the designer workspace.
- F02 Designer sign up (Designer, auth): A new designer creates an account with email and password from the landing page and lands in an empty workspace ready to add clients and set up booking.
- F03 Designer sign in (Designer, auth): A returning designer signs in with email and password and returns to the home dashboard with their own clients, projects and sessions.
- F04 View home dashboard (Designer, core): The signed-in designer opens home to see today's sessions, follow-ups due in the next 7 days including overdue, and overdue tasks, and can jump to the related client, project or session.
- F05 Add a client (Designer, core): The designer adds a client with name, email, optional company, profile and status, saves it, and sees it in the client list with its follow-up state.
- F06 Track client notes and follow-ups (Designer, core): The designer browses the client list sorted overdue follow-ups first, opens a client to see dated notes, adds a note with an optional follow-up date, and marks a follow-up done or pushes it a week with one click.
- F07 Edit a client (Designer, manage): The designer opens a client, changes its name, email, company, profile or status between Lead, Active and Past, saves, and sees the updated client in the list and detail.
- F08 Delete a client (Designer, manage): The designer deletes a client after confirmation and returns to the client list without that client, its projects, tasks and notes.
- F09 Add a project to a client (Designer, core): The designer creates a project under a client with name, short description and optional due date and then sees it in the project list with its count of open tasks.
- F10 Find and work through tasks (Designer, core): The designer browses all projects with open task counts, opens a project to see its tasks, searches by title, filters by status and priority, adds tasks, and ticks tasks done quickly with overdue tasks standing out.
- F11 Edit a project or task (Designer, manage): The designer opens a project or task, changes its fields such as description, due dates, status or priority, saves, and sees the updated project and task lists.
- F12 Delete a project or task (Designer, manage): The designer deletes a task or a project after confirmation; deleting a project also removes its tasks and the lists update accordingly.
- F13 Set weekly availability (Designer, core): The designer sets weekly availability by adding, editing and removing weekday rules with start and end times that control which slots can be offered for the next two weeks.
- F14 Manage session types (Designer, manage): The designer reviews the pre-created session types, edits their names, durations, displayed prices and max people, and can add or remove types, seeing how each type defines slot length and fullness.
- F15 View and cancel upcoming sessions (Designer, manage): The designer views upcoming sessions with their bookings, cancels a whole slot which removes the slot and all its bookings, or cancels a single booking to free one seat.
- F16 Book a session from the public page (Booker, core): A visitor without an account opens the public booking page, picks a session type, sees open slots for the next two weeks without other bookers details, books with name and email, and sees a confirmation with an on-screen cancellation link; matching email links to an existing client otherwise creates a new Lead client.
- F17 Cancel a booking via link (Booker, manage): A booker opens their cancellation link without signing in, confirms cancellation, and sees that the booking is cancelled and the seat is freed.
- F18 Designer sign out (Designer, auth): The signed-in designer signs out and returns to the public landing page, leaving the private workspace protected until next sign-in.

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

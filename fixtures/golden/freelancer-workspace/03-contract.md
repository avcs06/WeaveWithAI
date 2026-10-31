# StudioDesk: contract

The records the app keeps, the operations its widgets call, and what covers each widget. Every record also has id, createdAt, updatedAt. Sign up, sign in and sign out are built in.

## Entities

### Client

Implements Client.

| Field | Kind | Required |
| ----- | ---- | -------- |
| name | string | yes |
| email | email | yes |
| company | string | no |
| profile | text | no |
| status | enum ClientStatus | yes |
| followUpDate | date | no |

### Note

Implements Note.

| Field | Kind | Required |
| ----- | ---- | -------- |
| date | date | yes |
| text | text | yes |
| client | ref Client | yes |

### Project

Implements Project.

| Field | Kind | Required |
| ----- | ---- | -------- |
| name | string | yes |
| description | text | no |
| dueDate | date | no |
| client | ref Client | yes |

### Task

Implements Task.

| Field | Kind | Required |
| ----- | ---- | -------- |
| title | string | yes |
| status | enum TaskStatus | yes |
| priority | enum TaskPriority | yes |
| dueDate | date | no |
| project | ref Project | yes |

### Availability

Implements Availability.

| Field | Kind | Required |
| ----- | ---- | -------- |
| days | enum Weekday list | yes |
| from | time | yes |
| to | time | yes |

### SessionType

Implements SessionType.

| Field | Kind | Required |
| ----- | ---- | -------- |
| name | string | yes |
| duration | int | yes |
| priceDisplay | string | yes |
| maxPeople | int | yes |

### Session

Implements Session.

| Field | Kind | Required |
| ----- | ---- | -------- |
| date | date | yes |
| startTime | time | yes |
| sessionType | ref SessionType | yes |

### Booking

Implements Booking.

| Field | Kind | Required |
| ----- | ---- | -------- |
| name | string | yes |
| email | email | yes |
| session | ref Session | yes |
| client | ref Client | yes |

## Enums

- ClientStatus: Lead (`lead`), Active (`active`), Past (`past`)
- TaskStatus: To do (`to_do`), In progress (`in_progress`), Done (`done`)
- TaskPriority: Low (`low`), Medium (`medium`), High (`high`)
- Weekday: Monday (`monday`), Tuesday (`tuesday`), Wednesday (`wednesday`), Thursday (`thursday`), Friday (`friday`), Saturday (`saturday`), Sunday (`sunday`)

## Operations

| Operation | Kind | Entity | Summary | Inputs | Serves |
| --------- | ---- | ------ | ------- | ------ | ------ |
| listClients | list | Client | List clients sorted by follow-up | none | F05.S01, F06.S01, F07.S01, F08.S01, F25.S01 |
| getClient | get | Client | Read a client | none | F07.S02, F08.S02, F09.S01, F10.S01, F22.S03, F25.S02 |
| createClient | create | Client | Create a client or Lead from booking | FD03 Client name as name, FD04 Client email as email, FD05 Company as company, FD06 Profile as profile, FD07 Client status as status, FD08 Follow-up date as followUpDate, FD25 Booker name as name, FD26 Booker email as email | F05.S03, F22.S03 |
| updateClient | update | Client | Update client including follow-up date | FD03 Client name as name, FD04 Client email as email, FD05 Company as company, FD06 Profile as profile, FD07 Client status as status, FD08 Follow-up date as followUpDate | F06.S02, F06.S03, F07.S03, F09.S04 |
| deleteClient | delete | Client | Delete a client and its data | none | F08.S03 |
| listNotes | list | Note | List notes of a client | none | F09.S01 |
| createNote | create | Note | Add a note under a client | FD09 Note date as date, FD10 Note text as text | F09.S03 |
| deleteNote | delete | Note | Delete a note | none | F08.S03, F09.S05 |
| listProjects | list | Project | List projects | none | F10.S01, F13.S01 |
| getProject | get | Project | Read a project | none | F11.S01, F12.S01, F13.S02, F14.S01, F15.S01, F17.S01 |
| createProject | create | Project | Create a project under a client | FD11 Project name as name, FD12 Project description as description, FD13 Project due date as dueDate | F10.S03 |
| updateProject | update | Project | Edit a project | FD11 Project name as name, FD12 Project description as description, FD13 Project due date as dueDate | F11.S02 |
| deleteProject | delete | Project | Delete a project and its tasks | none | F08.S03, F12.S02 |
| listTasks | list | Task | List tasks with search and filters | FD27 Search tasks as q, FD30 Task status filter as status, FD31 Task priority filter as priority | F12.S01, F13.S01, F13.S02, F14.S01, F14.S02, F15.S01, F17.S01, F25.S01 |
| getTask | get | Task | Read a task | none | F14.S03, F16.S01, F25.S02 |
| createTask | create | Task | Add a task to a project | FD14 Task title as title, FD15 Task status as status, FD16 Task priority as priority, FD17 Task due date as dueDate | F15.S03 |
| updateTask | update | Task | Edit a task including Done | FD14 Task title as title, FD15 Task status as status, FD16 Task priority as priority, FD17 Task due date as dueDate | F16.S02 |
| deleteTask | delete | Task | Delete a task | none | F08.S03, F12.S02, F17.S02 |
| getAvailability | get | Availability | Read weekly availability | none | F18.S01 |
| updateAvailability | update | Availability | Set weekly availability | FD18 Available days as days, FD19 Available from as from, FD20 Available to as to | F18.S02 |
| listSessionTypes | list | SessionType | List session types | none | F20.S01, F22.S01 |
| getSessionType | get | SessionType | Read a session type | none | F20.S02, F21.S01 |
| createSessionType | create | SessionType | Add a session type | FD21 Session type name as name, FD22 Duration in minutes as duration, FD23 Price display as priceDisplay, FD24 Maximum people as maxPeople | F19.S02 |
| updateSessionType | update | SessionType | Edit a session type | FD21 Session type name as name, FD22 Duration in minutes as duration, FD23 Price display as priceDisplay, FD24 Maximum people as maxPeople | F20.S03 |
| deleteSessionType | delete | SessionType | Delete a session type | none | F21.S02 |
| listSessions | list | Session | List sessions and open slots | FD28 Chosen session type as sessionType | F22.S02, F24.S01, F25.S01 |
| getSession | get | Session | Read a session | none | F25.S02 |
| createSession | create | Session | Create a session slot from availability | none | F22.S03 |
| updateSession | update | Session | Update a session when booked | none | F22.S03 |
| deleteSession | delete | Session | Cancel a session | none | F24.S02 |
| listBookings | list | Booking | List bookings of sessions | none | F24.S01 |
| getBooking | get | Booking | Read a booking | none | F23.S01 |
| createBooking | create | Booking | Book a session slot | FD25 Booker name as name, FD26 Booker email as email, FD29 Chosen slot as session | F22.S03 |
| deleteBooking | delete | Booking | Cancel a booking | none | F08.S03, F23.S02, F24.S02 |

## Widgets

### W01 sharedPageHeader (page-header)

- Opens other screens or shows fixed content; it calls nothing.

### W02 landingHero (hero)

- Opens other screens or shows fixed content; it calls nothing.

### W03 landingFeatures (feature-grid)

- Opens other screens or shows fixed content; it calls nothing.

### W04 landingCta (cta)

- Opens other screens or shows fixed content; it calls nothing.

### W05 signupForm (auth-form)

- Asks for FD01 Designer email, which goes to the built-in sign up.
- Asks for FD02 Password, which goes to the built-in sign up.

### W06 signinForm (auth-form)

- Asks for FD01 Designer email, which goes to the built-in sign in.
- Asks for FD02 Password, which goes to the built-in sign in.

### W07 homeTodaySessions (list)

- Shows a list of Session (Session.date, Session.startTime), loaded by listSessions.
- Shows SessionType (SessionType.name), loaded by listSessionTypes.
- Shows Booking (Booking.name), loaded by listBookings.
- At F25.S01, lists Session and lists Client and lists Task: listClients, listTasks, listSessions.
- At F25.S02, reads Session and reads Client and reads Task: getClient, getTask, getSession.

### W08 homeFollowups (list)

- Shows a list of Client (Client.name, Client.followUpDate), loaded by listClients.
- At F25.S01, lists Session and lists Client and lists Task: listClients, listTasks, listSessions.
- At F25.S02, reads Session and reads Client and reads Task: getClient, getTask, getSession.

### W09 homeOverdueTasks (list)

- Shows a list of Task (Task.title, Task.dueDate), loaded by listTasks.
- Shows Project (Project.name), loaded by listProjects.
- At F25.S01, lists Session and lists Client and lists Task: listClients, listTasks, listSessions.
- At F25.S02, reads Session and reads Client and reads Task: getClient, getTask, getSession.

### W10 clientsList (list)

- Shows a list of Client (Client.name, Client.company, Client.status, Client.followUpDate), loaded by listClients.
- At F05.S01, lists Client: listClients.
- At F06.S01, lists Client: listClients.
- At F06.S02, updates Client: updateClient.
- At F06.S03, updates Client: updateClient.
- At F07.S01, lists Client: listClients.
- At F07.S02, reads Client: getClient.
- At F08.S01, lists Client: listClients.
- At F08.S02, reads Client: getClient.
- At F09.S01, reads Client and lists Note: getClient, listNotes.
- At F10.S01, reads Client and lists Project: getClient, listProjects.

### W11 addClientButton (custom)

- Opens other screens or shows fixed content; it calls nothing.

### W12 clientDetailHeader (detail)

- Shows Client (Client.name, Client.status, Client.email, Client.company, Client.profile, Client.followUpDate), loaded by getClient.
- Asks for FD08 Follow-up date, which goes to updateClient.
- At F08.S03, deletes Booking and deletes Client and deletes Note and deletes Project and deletes Task: deleteClient, deleteNote, deleteProject, deleteTask, deleteBooking.
- At F09.S04, updates Client: updateClient.

### W13 clientProjects (list)

- Shows a list of Project (Project.name, Project.dueDate), loaded by listProjects.

### W14 clientNotes (list)

- Shows a list of Note (Note.date, Note.text), loaded by listNotes.
- At F09.S05, deletes Note: deleteNote.

### W15 projectsTable (table)

- Shows a list of Project (Project.name, Project.dueDate), loaded by listProjects.
- Shows Client (Client.name), loaded by listClients.
- At F11.S01, reads Project: getProject.
- At F12.S01, reads Project and lists Task: getProject, listTasks.
- At F13.S01, lists Project and lists Task: listProjects, listTasks.
- At F13.S02, reads Project and lists Task: getProject, listTasks.
- At F14.S01, reads Project and lists Task: getProject, listTasks.
- At F15.S01, reads Project and lists Task: getProject, listTasks.
- At F17.S01, reads Project and lists Task: getProject, listTasks.

### W16 projectDetailHeader (detail)

- Shows Project (Project.name, Project.description, Project.dueDate), loaded by getProject.
- Shows Client (Client.name), loaded by getClient.
- At F12.S02, deletes Project and deletes Task: deleteProject, deleteTask.

### W17 taskFilters (filters)

- Asks for FD27 Search tasks, which goes to listTasks.
- Asks for FD30 Task status filter, which goes to listTasks.
- Asks for FD31 Task priority filter, which goes to listTasks.
- At F14.S02, lists Task: listTasks.

### W18 taskList (list)

- Shows a list of Task (Task.title, Task.status, Task.priority, Task.dueDate), loaded by listTasks.
- Asks for FD27 Search tasks, which goes to listTasks.
- Asks for FD30 Task status filter, which goes to listTasks.
- Asks for FD31 Task priority filter, which goes to listTasks.
- At F14.S02, lists Task: listTasks.
- At F14.S03, reads Task: getTask.
- At F16.S01, reads Task: getTask.
- At F17.S02, deletes Task: deleteTask.

### W19 sessionsList (list)

- Shows a list of Session (Session.date, Session.startTime), loaded by listSessions.
- Shows SessionType (SessionType.name), loaded by listSessionTypes.
- Shows Booking (Booking.name), loaded by listBookings.
- At F24.S01, lists Session and lists Booking: listSessions, listBookings.
- At F24.S02, deletes Session and deletes Booking: deleteSession, deleteBooking.

### W20 availabilitySettings (settings-group)

- Shows Availability (Availability.days, Availability.from, Availability.to), loaded by getAvailability.
- Asks for FD18 Available days, which goes to updateAvailability.
- Asks for FD19 Available from, which goes to updateAvailability.
- Asks for FD20 Available to, which goes to updateAvailability.
- At F18.S01, reads Availability: getAvailability.
- At F18.S02, updates Availability: updateAvailability.

### W21 sessionTypesList (list)

- Shows a list of SessionType (SessionType.name, SessionType.duration, SessionType.priceDisplay, SessionType.maxPeople), loaded by listSessionTypes.
- At F20.S01, lists SessionType: listSessionTypes.
- At F20.S02, reads SessionType: getSessionType.
- At F21.S01, reads SessionType: getSessionType.
- At F21.S02, deletes SessionType: deleteSessionType.

### W22 bookingSessionCards (cards)

- Shows a list of SessionType (SessionType.name, SessionType.duration, SessionType.priceDisplay, SessionType.maxPeople), loaded by listSessionTypes.
- At F22.S01, lists SessionType: listSessionTypes.

### W23 bookingSlotPicker (custom)

- Shows a list of Session (Session.date, Session.startTime), loaded by listSessions.
- Asks for FD28 Chosen session type, which goes to listSessions.
- At F22.S02, lists Session: listSessions.

### W24 bookingForm (form)

- Shows Booking (Booking.name, Booking.email), typed in by the user and saved by createBooking.
- Asks for FD25 Booker name, which goes to createClient, createBooking.
- Asks for FD26 Booker email, which goes to createClient, createBooking.
- Asks for FD29 Chosen slot, which goes to createBooking.
- At F22.S03, creates Booking and creates Session and updates Session and reads Client and creates Client: getClient, createClient, createSession, updateSession, createBooking.

### W25 bookingConfirmation (detail)

- Shows Booking (Booking.name), typed in by the user and saved by createBooking.
- Shows Session (Session.date, Session.startTime), loaded by listSessions.
- Asks for FD25 Booker name, which goes to createClient, createBooking.
- Asks for FD26 Booker email, which goes to createClient, createBooking.
- Asks for FD29 Chosen slot, which goes to createBooking.
- At F22.S03, creates Booking and creates Session and updates Session and reads Client and creates Client: getClient, createClient, createSession, updateSession, createBooking.

### W26 manageBookingCard (detail)

- Shows SessionType (SessionType.name), loaded by getSessionType.
- Shows Session (Session.date, Session.startTime), loaded by getSession.
- Shows Booking (Booking.name), loaded by getBooking.
- At F23.S01, reads Booking: getBooking.
- At F23.S02, deletes Booking: deleteBooking.

### W27 clientFormAdd (form)

- Shows Client (Client.name, Client.email, Client.company, Client.profile, Client.status, Client.followUpDate), typed in by the user and saved by createClient.
- Asks for FD03 Client name, which goes to createClient.
- Asks for FD04 Client email, which goes to createClient.
- Asks for FD05 Company, which goes to createClient.
- Asks for FD06 Profile, which goes to createClient.
- Asks for FD07 Client status, which goes to createClient.
- Asks for FD08 Follow-up date, which goes to createClient.
- At F05.S03, creates Client: createClient.

### W28 clientFormEdit (form)

- Shows Client (Client.name, Client.email, Client.company, Client.profile, Client.status, Client.followUpDate), loaded by getClient.
- Asks for FD03 Client name, which goes to updateClient.
- Asks for FD04 Client email, which goes to updateClient.
- Asks for FD05 Company, which goes to updateClient.
- Asks for FD06 Profile, which goes to updateClient.
- Asks for FD07 Client status, which goes to updateClient.
- Asks for FD08 Follow-up date, which goes to updateClient.
- At F07.S03, updates Client: updateClient.

### W29 deleteConfirmGeneric (custom)

- Part of STD01, which runs for F08.S03 (deleteClient, deleteNote, deleteProject, deleteTask, deleteBooking), F09.S05 (deleteNote), F12.S02 (deleteProject, deleteTask), F17.S02 (deleteTask), F21.S02 (deleteSessionType), F23.S02 (deleteBooking), F24.S02 (deleteSession, deleteBooking).

### W30 noteForm (form)

- Shows Note (Note.date, Note.text), typed in by the user and saved by createNote.
- Asks for FD09 Note date, which goes to createNote.
- Asks for FD10 Note text, which goes to createNote.
- At F09.S03, creates Note: createNote.

### W31 projectFormAdd (form)

- Shows Project (Project.name, Project.description, Project.dueDate), typed in by the user and saved by createProject.
- Asks for FD11 Project name, which goes to createProject.
- Asks for FD12 Project description, which goes to createProject.
- Asks for FD13 Project due date, which goes to createProject.
- At F10.S03, creates Project: createProject.

### W32 projectFormEdit (form)

- Shows Project (Project.name, Project.description, Project.dueDate), loaded by getProject.
- Asks for FD11 Project name, which goes to updateProject.
- Asks for FD12 Project description, which goes to updateProject.
- Asks for FD13 Project due date, which goes to updateProject.
- At F11.S02, updates Project: updateProject.

### W33 taskForm (form)

- Shows Task (Task.title, Task.status, Task.priority, Task.dueDate), loaded by getTask.
- Asks for FD14 Task title, which goes to updateTask.
- Asks for FD15 Task status, which goes to updateTask.
- Asks for FD16 Task priority, which goes to updateTask.
- Asks for FD17 Task due date, which goes to updateTask.
- At F15.S03, creates Task: createTask.
- At F16.S02, updates Task: updateTask.

### W34 sessionTypeForm (form)

- Shows SessionType (SessionType.name, SessionType.duration, SessionType.priceDisplay, SessionType.maxPeople), loaded by getSessionType.
- Asks for FD21 Session type name, which goes to updateSessionType.
- Asks for FD22 Duration in minutes, which goes to updateSessionType.
- Asks for FD23 Price display, which goes to updateSessionType.
- Asks for FD24 Maximum people, which goes to updateSessionType.
- At F19.S02, creates SessionType: createSessionType.
- At F20.S03, updates SessionType: updateSessionType.

### W36 sessionTypeDeleteNote (custom)

- Shows SessionType (SessionType.name), loaded by getSessionType.

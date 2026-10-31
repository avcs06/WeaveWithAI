# StudioDesk: design

Audience: A solo freelance UX designer managing her own clients, projects and bookings daily, plus occasional bookers who book a session without an account. Feels calm, warm, focused, personal, organized; copy is Plain, warm and concise: short everyday words, gentle prompts, and no salesy or corporate jargon..

- Density comfortable, radius 8px surfaces and 6px controls, focus ring halo, imagery icons.
- Fonts: Figtree for text, Fraunces for headings, JetBrains Mono for code.
- Logo: the name as a wordmark in Fraunces 600, as written, letter spacing -0.02em; #5D4894 in light.
- Style warm and minimal, light only; brand hue 294, balanced; page background linear-gradient(180deg, oklch(0.96 0.03 294) 0%, oklch(0.985 0.009 294) 320px, oklch(0.985 0.009 294) 100%); frame hue 294, balanced. References: Linear.
- Wireframes of every screen at desktop width: `02-design/08-wireframes.html`.

## Palette

### page, light

| Role | Hex | Contrast |
| ---- | --- | -------- |
| pageBg | `#FAF9FF` |  |
| pageFg | `#443D5A` | 9.73:1 on pageBg, 9.01:1 on frameBg |
| pageFgMuted | `#5A5277` | 6.9:1 on pageBg, 6.38:1 on frameBg |
| frameBg | `#F2EFFF` |  |
| divider | `#DBD8EB` | 1.33:1 on pageBg, 1.23:1 on frameBg |
| backdrop | `#1E1A2A` |  |
| skeleton | `#DBD8EB` | 1.33:1 on pageBg, 1.23:1 on frameBg |
| pageBackground | `linear-gradient(180deg, oklch(0.96 0.03 294) 0%, oklch(0.985 0.009 294) 320px, oklch(0.985 0.009 294) 100%)` |  |

### theme, light

| Role | Hex | Contrast |
| ---- | --- | -------- |
| bg | `#FAF9FF` |  |
| fg | `#463670` | 9.92:1 on pageBg, 9.18:1 on frameBg, 9.92:1 on bg, 9.18:1 on hoverBg |
| fgMuted | `#5D4894` | 7.11:1 on bg |
| border | `#6E59A7` | 5.5:1 on pageBg, 5.09:1 on frameBg, 5.5:1 on bg |
| hoverBg | `#F2EFFF` |  |
| accentBg | `#6E59A7` |  |
| accentFg | `#FAF9FF` | 5.5:1 on accentBg, 7.11:1 on accentHoverBg |
| accentBorder | `#6E59A7` |  |
| accentHoverBg | `#5D4894` |  |
| focus | `#6E59A7` | 5.5:1 on pageBg, 5.09:1 on frameBg, 5.5:1 on bg |
| accentFocus | `#463670` |  |
| shadow | `#1F1636` |  |

### base, light

| Role | Hex | Contrast |
| ---- | --- | -------- |
| bg | `#FAF9FF` |  |
| fg | `#443D5A` | 9.73:1 on pageBg, 9.01:1 on frameBg, 9.73:1 on bg, 9.04:1 on hoverBg |
| fgMuted | `#5A5277` | 6.9:1 on bg |
| border | `#6B6289` | 5.37:1 on pageBg, 4.97:1 on frameBg, 5.37:1 on bg |
| hoverBg | `#F2F0FB` |  |
| accentBg | `#443D5A` |  |
| accentFg | `#FAF9FF` | 9.73:1 on accentBg, 16.22:1 on accentHoverBg |
| accentBorder | `#443D5A` |  |
| accentHoverBg | `#1E1A2A` |  |
| focus | `#6B6289` | 5.37:1 on pageBg, 4.97:1 on frameBg, 5.37:1 on bg |
| accentFocus | `#6B6289` |  |
| shadow | `#1E1A2A` |  |

Entity set sessionType: A kind of bookable session the designer defines. Fields: name, duration, price displayed for information (free for the discovery call), maximum people. Defaults: 30 minute discovery call, free, 1 person; 60 minute design review, ₹4,000, 1 person; 2 hour Figma workshop, ₹2,500 a seat, up to 8 people.

### sessionType, light

| Role | Hex | Contrast |
| ---- | --- | -------- |
| bg | `#EDFEFE` |  |
| fg | `#004D4D` | 9.32:1 on bg, 8.74:1 on hoverBg |
| fgMuted | `#006566` | 6.62:1 on bg |
| border | `#007879` | 5.1:1 on bg |
| hoverBg | `#DCF9F8` |  |
| accentBg | `#007879` |  |
| accentFg | `#EDFEFE` | 5.1:1 on accentBg, 6.62:1 on accentHoverBg |
| accentBorder | `#007879` |  |
| accentHoverBg | `#006566` |  |
| focus | `#007879` | 5.1:1 on bg |
| accentFocus | `#004D4D` |  |
| shadow | `#002223` |  |

## Layouts, shells and navigation

- app: sidebars first; container fluid start, padding 6, section gap 6; header sticky, divider; sidebar left 248 wide sticky, divider.
- marketing: header first; container fixed 1120 center, padding 8, section gap 8, full-bleed sections; header sticky, over the hero, none; footer, divider.

Component defaults: Textarea look outline; Tag variant base, size sm, look bordered; Tabs variant default; Switch variant default, size sm; MultiSelect look outline; Select look outline; Radio variant default, size sm; PopoverButton look rounded ghost; Link variant default, look plain; Input look outline; NumberInput look outline; PasswordInput look outline; SearchInput look outline; FormControl variant default, size md, look outline; Dialog size md; Chip variant default, size sm, look outline rounded; ChipGroup look collapsed; Checkbox variant default, size md; Card variant default, look outline; Button variant default, size md, look rounded; IconButton look rounded ghost; Avatar size md; Accordion look bordered; Collapsible look bordered; Toast status info.

Navigation: Home → S04 (signedIn), Clients → S05 (signedIn), Projects → S07 (signedIn), Sessions → S09 (signedIn), Booking settings → S10 (signedIn), Book a session → S11 (public).

### SH1 app

The frame of every framed app page, from the theme's app layout. Frames S04, S05, S06, S07, S08, S09, S10.

- SH1.r1 left, 248 wide, column gap 3 padding 4 align stretch justify between: top: StudioDesk wordmark and main navigation: Home, Clients, Projects, Sessions, Booking settings; bottom: Designer account and sign out
  - [container · column gap 4 align stretch] StudioDesk (fills) `SH1.n01`
    - [Link plain] StudioDesk → S04 (fills) `SH1.n03`
    - [container · column gap 2 align stretch] main navigation list (fills) `SH1.n04`
      - [Link plain] Home → S04 (fills) `SH1.n05`
      - [Link plain] Clients → S05 (fills) `SH1.n06`
      - [Link plain] Projects → S07 (fills) `SH1.n07`
      - [Link plain] Sessions → S09 (fills) `SH1.n08`
      - [Link plain] Booking settings → S10 (fills) `SH1.n09`
  - [container · column gap 2 align stretch] account and sign out column (fills) `SH1.n02`
    - [container · row gap 2 align center] designer account row (fills) `SH1.n10`
      - [Avatar md · display] designer avatar `SH1.n11`
      - [Truncate] Ava Sharma (fills) `SH1.n12`
    - [Button md rounded · secondary-action] Sign out → S03 (fills) `SH1.n13`
- SH1.r2 top, 64 tall, row gap 3 padding 4 align center justify between: start: Current page title; center: Search clients and tasks; end: Public booking link, account menu
  - [Truncate] Home `SH1.n14`
  - [Link plain] Clients → S05 `SH1.S06.n01`
  - [Link plain] Projects → S07 `SH1.S08.n01`
  - [SearchInput sm outline · input] Search clients and tasks (240 wide; over the defaults: fits inside fixed 64px header) `SH1.n15`
  - [container · row gap 2 align center justify end] booking link and account row `SH1.n16`
    - [Link plain] Book a session → S11 `SH1.n17`
    - [Dropdown · secondary-action] "Account menu" `SH1.n18`

### SH2 marketing

The frame of every framed marketing page, from the theme's marketing layout. Frames S01, S11, S12.

- SH2.r1 top, over the page, 64 tall, row gap 4 padding 4 align center justify between: start: StudioDesk wordmark; center: Overview, How booking works; end: Sign in, Sign up, Book a session
  - [container · row gap 2 align center] StudioDesk `SH2.n01`
    - [Truncate] StudioDesk → S01 `SH2.n02`
  - [container · row gap 4 align center justify center] a row of overview links `SH2.n03`
    - [Link plain · navigation] Overview → S01 `SH2.n04`
    - [Link plain · navigation] How booking works → S01 `SH2.n05`
  - [container · row gap 2 align center justify end] a row of sign in and booking actions `SH2.n06`
    - [Link plain · navigation] Sign in → S03 `SH2.n07`
    - [Button sm rounded · navigation] Sign up → S02 (over the defaults: fits inside 64px header padding) `SH2.n08`
    - [Button sm rounded · navigation] Book a session → S11 (over the defaults: fits inside 64px header padding) `SH2.n09`
- SH2.r2 bottom, content height, row gap 4 padding 6 align center justify between: start: StudioDesk wordmark and short tagline; center: Overview and booking links; end: Sign in
  - [container · column gap 1.5 justify center] StudioDesk `SH2.n10`
    - [Truncate] StudioDesk → S01 `SH2.n11`
    - [text caption] Simple bookings for calm studios `SH2.n12`
  - [container · row gap 4 align center justify center] a row of footer links `SH2.n13`
    - [Link plain · navigation] Overview → S01 `SH2.n14`
    - [Link plain · navigation] How booking works → S01 `SH2.n15`
    - [Link plain · navigation] Book a session → S11 `SH2.n16`
  - [container · row gap 2 align center justify end] a row holding sign in `SH2.n17`
    - [Link plain · navigation] Sign in → S03 `SH2.n18`

## S01 Landing

/ · marketing screen · shell SH2 · full width · signed in (designer) · entry

Explain StudioDesk and invite the designer to sign up or sign in and link to public booking.

States: . Serves: F01.S01, F01.S02, F04.S01, F01.A01, F01.A02. Sections: column gap 8 padding 8 align stretch.
Box S01.b1: column gap 8, fills.

### S01.sec1 StudioDesk (hero, column gap 4 padding 12 align center, in S01.b1, on the brand surface)

Headline that StudioDesk is one calm workspace for clients, projects and bookings with Sign up and Sign in actions.

- [h1 display] StudioDesk (F01.S01, F04.S01) `S01.n01`
- [text title] One calm place for clients, projects and bookings. (F01.S01, F04.S01) `S01.n02`
- [container · row gap 2 align center justify center wraps] a row of sign up and sign in actions `S01.n03`
  - [Button md rounded · primary-action] Sign up → S02 (F01.S01, F01.S02, F04.S01) `S01.n04`
  - [Button md rounded · secondary-action] Sign in → S03 (F01.S01, F01.A01, F04.S01) `S01.n05`

### S01.sec2 landingFeatures (feature-grid, grid 3 columns gap 4 align stretch, in S01.b1)

Three calm feature bands for clients with follow-ups, projects with tasks, and public booking.

- [container · column gap 4] client feature card (fills) `S01.n06`
  - [media] a small line icon of people (32 wide, 32 tall) `S01.n07`
  - [text subheading] Clients in one place (fills) `S01.n08`
  - [text body] See every client, note, and follow-up date without hunting. (fills) `S01.n09`
- [container · column gap 4] project feature card (fills) `S01.n10`
  - [media] a small line icon of a checklist (32 wide, 32 tall) `S01.n11`
  - [text subheading] Projects with clear tasks (fills) `S01.n12`
  - [text body] Track work, due dates, and next steps for each client. (fills) `S01.n13`
- [container · column gap 4] booking feature card (fills) `S01.n14`
  - [media] a small line icon of a calendar (32 wide, 32 tall) `S01.n15`
  - [text subheading] Easy public booking (fills) `S01.n16`
  - [text body] Share your link and let clients book a time that suits. (fills) `S01.n17`

### S01.sec3 landingCta (cta, column gap 4 padding 12 align center justify center, in S01.b1, on the accent surface)

Closing call-to-action band inviting the designer to start with a Start action plus a Book a session action.

- [container · column gap 2 align center justify center] centered inviting words (fills) `S01.n18`
  - [text title] Bring calm to your client work `S01.n19`
  - [text body] Start free today, or book a live session to see how it fits. `S01.n20`
- [container · row gap 2 align center justify center wraps] row of two actions `S01.n21`
  - [Button md rounded · primary-action] Get started → S02 `S01.n22`
  - [Button md rounded · secondary-action] Book a session → S11 (F01.A02) `S01.n23`

## S02 Sign up

/signup · app screen · shell none · narrow width · public · entry

Create a designer account and reach the home screen.

States: . Serves: F02.S01, F02.S02, F02.A01, F02.A02, F02.A03. Sections: column gap 6 padding 6 align stretch.
Box S02.b1: column gap 6 align center, fills.

### S02.sec1 Sign up (auth-form, column gap 4 padding 4 align stretch, in S02.b1)

Centered card with title, helper copy, email and password fields, Create account action and a Sign in instead link with inline errors.

- [h1 title] Sign up (fills) `S02.n01`
- [container · column gap 6 align stretch] form content (fills) `S02.n02`
  - [text body] Keep clients, projects and bookings in one calm place. (fills) `S02.n03`
  - [container · column gap 4 align stretch] email and password fields (fills) `S02.n04`
    - [Input outline · input] Email (F02.S01, F02.S02) (fills; field FD01) `S02.n05`
    - [PasswordInput outline · input] Password (F02.S02) (fills; field FD02) `S02.n06`
  - [container · column gap 4 align center] submit and switch actions (fills) `S02.n07`
    - [Button md rounded · primary-action] Create account → S04 (F02.S02, F02.A01, F02.A02, F02.A03) (fills) `S02.n08`
    - [Link plain · navigation] Already have an account? Sign in → S03 (F02.A03) `S02.n09`

## S03 Sign in

/signin · app screen · shell none · narrow width · public · entry

Sign the designer back into her workspace.

States: . Serves: F03.S01, F03.S02, F03.A01, F03.A02, F03.A03. Sections: column gap 6 padding 6 align stretch.
Box S03.b1: column gap 6 align center, fills.

### S03.sec1 Sign in (auth-form, column gap 4 padding 4 align stretch, in S03.b1)

Centered card with title, helper copy, email and password fields, Sign in action and a Sign up instead link with inline errors.

- [Truncate] Sign in (fills) `S03.n01`
- [container · column gap 6 align stretch] a column of helper copy, fields and actions (fills) `S03.n02`
  - [text subheading] Welcome back. Sign in to see today's sessions and follow-ups. (fills) `S03.n03`
  - [container · column gap 4 align stretch] a column of sign-in fields (fills) `S03.n04`
    - [Input outline · input] Designer email (F03.S01, F03.S02, F03.A01) (fills; field FD01) `S03.n05`
    - [PasswordInput outline · input] Password (F03.S01, F03.S02, F03.A01) (fills; field FD02) `S03.n06`
  - [container · column gap 4 align center] a column with sign-in action and sign-up link (fills) `S03.n07`
    - [Button md rounded · primary-action] Sign in (F03.S02, F03.A02, F03.A03) (fills) `S03.n08`
    - [Link plain · navigation] New here? Sign up → S02 `S03.n09`

## S04 Home

/home · app screen · shell SH1 · wide width · signed in (designer) · entry

Start the day knowing today's sessions, due follow-ups, and overdue tasks.

States: empty, error, notFound. Serves: F25.S01, F25.S02, F25.A01, F25.A02. Sections: column gap 6 padding 6 align stretch.
Box S04.b1: column gap 6, fills.
Box S04.b2 in S04.b1: row gap 6 align stretch, fills.

### S04.sec1 Home (page-header, grid 2 columns gap 2 padding 8 align center justify between, in S04.b1)

Shows the page title with helper description and an optional action button on the right.

- [h1 title] Home (fills) `S04.n01`
- [container · row gap 2 align center justify end] a row for the page action `S04.n02`
- [text body] Saturday, October 31 — here is your day at a glance. (fills, spans 2) `S04.n03`

### S04.sec2 homeTodaySessions (list, column gap 4 align stretch, in S04.b2)

Today's sessions section showing session type, time and seats booked versus maximum; each row links to its session.

- [h2 heading] Today's sessions (F25.S01) (fills; states default, empty, error, notFound) `S04.n04`
- [container · column gap 6 align stretch] the list of today's sessions (F25.S01) (fills) `S04.n05`
  - [container · column gap 4 padding 4 align stretch] a session row (fills) `S04.n06`
    - [container · row gap 2 align center justify between] the title and time line (fills) `S04.n07`
      - [Link plain] Design review → S09 (F25.S02) (fills; data SessionType.name) `S04.n08`
      - [Truncate] 10:30 AM (96 wide; data Session.startTime, Session.date) `S04.n09`
    - [Truncate] 6 of 8 seats booked (fills; data Booking.name) `S04.n10`
  - [container · column gap 4 padding 4 align stretch] a second session row (fills) `S04.n11`
    - [container · row gap 2 align center justify between] the title and time line (fills) `S04.n12`
      - [Link plain] Figma workshop → S09 (F25.S02) (fills; data SessionType.name) `S04.n13`
      - [Truncate] 2:00 PM (96 wide; data Session.startTime, Session.date) `S04.n14`
    - [Truncate] 3 of 8 seats booked (fills; data Booking.name) `S04.n15`
- [container · column gap 4 padding 4 align center] the empty all-clear block (F25.A01) (fills; states empty) `S04.n16`
  - [media] A calm calendar icon (F25.A01) (states empty) `S04.n17`
  - [text body] Nothing today — you are all clear. (F25.A01) (states empty) `S04.n18`
  - [Button md rounded · navigation] View sessions → S09 (F25.A01) (states empty) `S04.n19`
- [feedback body] Today's sessions did not load. Please try again soon. (F25.S01) (fills; states error) `S04.n20`
- [text body] That session is gone. (F25.A02) (fills; states notFound) `S04.n21`
- [Link plain] Back to home → S04 (F25.A02, F25.S01) (states notFound) `S04.n22`

### S04.sec3 homeFollowups (list, column gap 4 align stretch, in S04.b2)

Follow-ups due this week section with overdue styling; each row links to its client.

- [h2 heading] Follow-ups due this week (F25.S01) (fills; states default, empty, error, notFound) `S04.n23`
- [container · column gap 4 align stretch] a list of follow-up rows (F25.S01) (fills; data Client.name, Client.followUpDate) `S04.n24`
  - [container · row gap 2 align center justify between] an overdue follow-up row (fills; data Client.name, Client.followUpDate) `S04.n25`
    - [Link plain · navigation] Maya Shah → S06 (F25.S01, F25.S02) (fills; data Client.name) `S04.n26`
    - [Tag sm bordered · display] Overdue · 28 Oct (F25.S01) (data Client.followUpDate) `S04.n27`
  - [container · row gap 2 align center justify between] a follow-up row due this week (fills; data Client.name, Client.followUpDate) `S04.n28`
    - [Link plain · navigation] Rohan Mehta → S06 (F25.S01, F25.S02) (fills; data Client.name) `S04.n29`
    - [Tag sm bordered · display] Due Fri (F25.S01) (data Client.followUpDate) `S04.n30`
- [container · column gap 4 padding 4 align center justify center] an empty message with action, centred (F25.A01) (fills; states empty) `S04.n31`
  - [media] a check-circle icon (F25.A01) (states empty) `S04.n32`
  - [text body] You're all caught up — no follow-ups due this week. (F25.A01) (states empty) `S04.n33`
  - [Link plain · navigation] View clients → S05 (F25.A01) (states empty) `S04.n34`
- [feedback body] Couldn't load follow-ups. Try again soon. (F25.S01) (fills; states error) `S04.n35`
- [container · column gap 4 padding 4 align center justify center] a not-found message with a way back, centred (F25.A02) (fills; states notFound) `S04.n36`
  - [text body] That client is gone. (F25.A02) (states notFound) `S04.n37`
  - [Link plain · navigation] Back to home → S04 (F25.A02) (states notFound) `S04.n38`

### S04.sec4 homeOverdueTasks (list, column gap 4 padding 6 align stretch, in S04.b2)

Overdue tasks section showing task, project and due date; each row links to its project task.

- [h2 heading] Overdue tasks (F25.S01) (fills; states default, empty, error) `S04.n39`
- [container · column gap 2 align stretch] the list of overdue tasks (F25.S01) (fills) `S04.n40`
  - [container · column gap 4 align stretch] one overdue task row (F25.S01) (fills) `S04.n41`
    - [container · row gap 2 justify between] a row with task and project (F25.S01) (fills) `S04.n42`
      - [Link plain] Finalize homepage copy → S08 (F25.S01, F25.S02) (fills; data Task.title) `S04.n43`
      - [Truncate] Acme rebrand (F25.S01) (data Project.name) `S04.n44`
    - [Truncate] Due 28 Oct · 3 days overdue (F25.S01) (fills; data Task.dueDate) `S04.n45`
- [container · column gap 4 align center] the centred empty state (F25.A01) (fills; states empty) `S04.n46`
  - [media] ✓ (F25.A01) (states empty) `S04.n47`
  - [text body] You're all caught up. (F25.A01) (states empty) `S04.n48`
  - [Link plain] View projects → S07 (F25.A01) (states empty) `S04.n49`
- [feedback body] Couldn't load overdue tasks. (F25.S01) (fills; states error) `S04.n50`
- [container · column gap 4 align center] the centred gone message (F25.A02) (fills; states notFound) `S04.n51`
  - [text body] That task is gone. (F25.A02) (states notFound) `S04.n52`
  - [Link plain] Back to home → S04 (F25.A02) (states notFound) `S04.n53`

## S05 Clients

/clients · app screen · shell SH1 · wide width · signed in (designer)

See all clients in follow-up order and act on follow-ups in one click.

States: empty, error, notFound. Serves: F05.S01, F05.S02, F06.S01, F06.S02, F06.S03, F07.S01, F07.S02, F08.S01, F08.S02, F08.A02, F09.S01, F10.S01, F05.A01, F05.A02, F06.A01, F06.A02, F06.A03, F07.A01, F07.A02, F08.A01, F09.A01, F09.A02, F10.A01, F10.A02. Sections: column gap 6 padding 6 align stretch.
Box S05.b1: column gap 6, fills.

### S05.sec1 Clients (page-header, grid 2 columns gap 2 padding 8 align center justify between, in S05.b1)

Shows the page title with helper description and an optional action button on the right.

- [h1 title] Clients (fills) `S05.n01`
- [container · row gap 2 align center justify end] a row for the page action `S05.n02`
  - [Button md rounded · primary-action] Add client → S13 (F05.S02, F05.A01) (states default, empty) `S05.n04`
- [text body] See who needs a follow-up and keep in touch. (fills, spans 2) `S05.n03`

### S05.sec2 clientsList (list, column gap 6 align stretch, in S05.b1)

Sorted client list with overdue first showing name, company, status tag and follow-up date with Done and Push a week actions; selecting a row opens the client.

- [container · column gap 2 align stretch] client list (F05.S01, F05.A02, F06.S01, F07.S01, F08.S01) (fills) `S05.n05`
  - [container · column gap 4 align stretch] a client row card (fills) `S05.n06`
    - [container · row gap 2 align center] top row of name, company and status (fills) `S05.n07`
      - [Link plain] Maya Shah → S06 (F07.S02, F08.S02, F09.S01, F10.S01, F09.A01, F10.A01) (fills; data Client.name) `S05.n08`
      - [Truncate] Studio Maya (data Client.company) `S05.n09`
      - [Tag sm bordered · display] Active (data Client.status) `S05.n10`
    - [container · row gap 2 align center justify between] bottom row of follow-up and actions (fills) `S05.n11`
      - [Truncate] Follow-up 28 Oct · Overdue (fills; data Client.followUpDate) `S05.n12`
      - [container · row gap 2 align center justify end] row of follow-up actions `S05.n13`
        - [Button md rounded · secondary-action] Done (F06.S02, F06.A02) `S05.n14`
        - [Button md rounded · secondary-action] Push a week (F06.S03, F06.A03) `S05.n15`
- [container · column gap 4 align center justify center] empty state (fills; states empty) `S05.n16`
  - [media] an empty clients icon (states empty) `S05.n17`
  - [text body] No clients yet (states empty) `S05.n18`
  - [Button md rounded · primary-action] Add client → S13 (F05.S02, F05.A01, F06.A01, F07.A01, F08.A01) (states empty) `S05.n19`
- [container · column gap 4 align center justify center] error state (fills; states error) `S05.n20`
  - [feedback body] Couldn't load clients. Try again. (states error) `S05.n21`
  - [Button md rounded · secondary-action] Try again (F05.S01, F06.S01, F07.S01, F08.S01) (states error) `S05.n22`
- [container · column gap 4 align center justify center] gone state (fills; states notFound) `S05.n23`
  - [text body] That client is gone. (states notFound) `S05.n24`
  - [Button md rounded · navigation] Back to clients → S05 (F07.A02, F08.A02, F09.A02, F10.A02, F05.S01, F06.S01, F07.S01, F08.S01) (states notFound) `S05.n25`

## S06 Client detail

/clients/[clientId] · app screen · shell SH1 · medium width · signed in (designer)

View and manage one client's details, projects, notes, and follow-up date.

States: notFound. Serves: F08.S03, F09.S02, F09.S04, F09.S05, F10.S02, F08.A03, F08.A04, F09.A05, F09.A06, F09.A07, F09.A08, F10.A05. Sections: column gap 6 padding 6 align stretch.
Box S06.b1: column gap 6, fills.
Frame: adds SH1.S06.n01; leaves out nothing.

### S06.sec1 clientDetailHeader (detail, column gap 4 align stretch, in S06.b1)

Client header showing name, status tag, email, company, profile and inline follow-up date editor with Edit and Delete actions.

- [container · row gap 2 align center justify between] top row with name, status and actions (fills) `S06.n01`
  - [h1 title] Ava Mehta (fills; data Client.name) `S06.n02`
  - [Tag sm bordered · display] Active (data Client.status) `S06.n03`
  - [container · row gap 2 align center justify end] a row of Edit and Delete buttons `S06.n04`
    - [Button md rounded · secondary-action] Edit → S14 `S06.n05`
    - [Button md rounded · destructive-action] Delete → S15 (F08.S03, F08.A03, F08.A04) `S06.n06`
- [container · column gap 1] a column of client contact details (fills) `S06.n07`
  - [text body] ava@studioava.com (fills; data Client.email) `S06.n08`
  - [text body] Studio Ava (fills; data Client.company) `S06.n09`
  - [text body] Brand designer we met at the market, on a monthly retainer. (fills; data Client.profile) `S06.n10`
- [container · row gap 2 align end] inline follow-up date editor row (fills) `S06.n11`
  - [Input outline · input] Follow-up date (F09.S04) (fills; field FD08; data Client.followUpDate) `S06.n12`
  - [Button md rounded · primary-action] Save (F09.S04, F09.A05, F09.A06) `S06.n13`
- [text body] This client is gone. (fills; states notFound) `S06.n14`
- [Button md rounded · navigation] Back to clients → S05 (states notFound) `S06.n15`

### S06.sec2 clientProjects (list, column gap 4 align stretch, in S06.b1)

Projects section listing the client's projects with Add project button; selecting a row opens the project.

- [h2 heading] Projects (fills) `S06.n16`
- [Button md rounded · primary-action] Add project → S17 (F10.S02, F10.A05) `S06.n17`
- [container · column gap 2 align stretch] a list of the client's projects (fills) `S06.n18`
  - [Card outline · row gap 2 padding 4 align center justify between · navigation] "Open Harbor rebrand project" → S08 (fills) `S06.n19`
    - [Truncate] Harbor rebrand (fills; data Project.name) `S06.n20`
    - [Truncate] Due 12 Jun 2026 (120 wide; data Project.dueDate) `S06.n21`
  - [Card outline · row gap 2 padding 4 align center justify between · navigation] "Open Website refresh project" → S08 (fills) `S06.n22`
    - [Truncate] Website refresh (fills; data Project.name) `S06.n23`
    - [Truncate] Due 28 Jun 2026 (120 wide; data Project.dueDate) `S06.n24`

### S06.sec3 clientNotes (list, column gap 4 align stretch, in S06.b1)

Notes section newest first with Add note button and Delete per note.

- [h2 heading] Notes (fills) `S06.n25`
- [Button md rounded · primary-action] Add note → S16 (F09.S02) `S06.n26`
- [container · column gap 2 align stretch] a list of client notes, newest first (fills) `S06.n27`
  - [container · column gap 4 padding 4 align stretch] a note card (fills) `S06.n28`
    - [container · row gap 2 align center justify between wraps] a row with the note date and delete action (fills) `S06.n29`
      - [Truncate] Oct 12, 2026 (fills; data Note.date) `S06.n30`
      - [IconButton rounded ghost · destructive-action] "Delete note" (F09.S05, F09.A07, F09.A08) `S06.n31`
    - [display body] Called about the new menu — sending fresh ideas on Friday. (fills; data Note.text) `S06.n32`

## S07 Projects

/projects · app screen · shell SH1 · wide width · signed in (designer)

See all projects with how much work is still open on each.

States: empty, error, notFound. Serves: F11.S01, F12.S01, F13.S01, F13.S02, F14.S01, F15.S01, F17.S01, F11.A01, F12.A01, F12.A04, F13.A01, F13.A02, F13.A03, F14.A01, F14.A02, F15.A01, F15.A02, F17.A01, F17.A02. Sections: column gap 6 padding 6 align stretch.
Box S07.b1: column gap 6, fills.

### S07.sec1 Projects (page-header, grid 2 columns gap 2 padding 8 align center justify between, in S07.b1)

Shows the page title with helper description and an optional action button on the right.

- [h1 title] Projects (fills) `S07.n01`
- [container · row gap 2 align center justify end] a row for the page action `S07.n02`
- [text body] Projects live under a client. Open a client to add one. (fills, spans 2) `S07.n03`

### S07.sec2 projectsTable (table, column gap 6 align stretch, in S07.b1)

Every project as rows showing its client, due date and open task count badge; selecting a row opens the project.

- [Table · navigation] Harbor Rebrand · Acme Co · Jun 12 · 5 open → S08 (F11.S01, F12.S01, F13.S01, F13.S02, F14.S01, F15.S01, F17.S01) (fills; data Project.name, Project.dueDate, Client.name) `S07.n04`
- [container · column gap 4 align center justify center] empty state (fills; states empty) `S07.n05`
  - [media] a folder icon (states empty) `S07.n06`
  - [text body] No projects yet (F12.A04, F13.A01, F13.A03, F14.A01, F15.A02, F17.A01) (states empty) `S07.n07`
  - [Button md rounded · primary-action] Add project → S17 (F13.A01) (states empty) `S07.n08`
- [container · column gap 4 align center justify center] project gone message group (fills; states notFound) `S07.n09`
  - [text body] This project is gone (F11.A01, F12.A01, F13.A02, F14.A02, F15.A01, F17.A02) (states notFound) `S07.n10`
  - [Link plain · navigation] Back to projects → S07 (states notFound) `S07.n11`
- [feedback body] We could not load your projects (fills; states error) `S07.n12`

## S08 Project detail

/projects/[projectId] · app screen · shell SH1 · wide width · signed in (designer)

View, find, and manage one project's tasks.

States: empty, error, notFound. Serves: F12.S02, F14.S02, F14.S03, F15.S02, F16.S01, F17.S02, F12.A02, F12.A03, F14.A03, F14.A04, F15.A03, F16.A01, F17.A03, F17.A04. Sections: column gap 6 padding 6 align stretch.
Box S08.b1: column gap 6, fills.
Frame: adds SH1.S08.n01; leaves out nothing.

### S08.sec1 projectDetailHeader (detail, grid 2 columns gap 2 align center, in S08.b1)

Project header with name, description, due date, client link and open count plus Edit and Delete actions.

- [Truncate] Website refresh (fills; data Project.name) `S08.n01`
- [container · row gap 2 align center justify end] a row of header actions `S08.n02`
  - [Button md rounded · primary-action] Edit → S18 `S08.n03`
  - [Button md rounded · destructive-action] Delete → S20 (F12.S02, F12.A02, F12.A03) `S08.n04`
- [text body] New marketing site with booking and portfolio. (fills, spans 2; data Project.description) `S08.n05`
- [container · row gap 2 align center wraps] a row of project meta (fills, spans 2) `S08.n06`
  - [text caption] Due 12 Dec (data Project.dueDate) `S08.n07`
  - [Link plain · navigation] Acme Studio → S06 (data Client.name) `S08.n08`
  - [text caption] 3 open tasks `S08.n09`

### S08.sec2 taskFilters (filters, row gap 2 align center wraps, in S08.b1)

Tasks toolbar with search by title, status and priority filters and Add task action.

- [SearchInput outline · input] Search tasks (F14.S02) (fills; field FD27; states default, empty, error) `S08.n10`
- [container · row gap 2 align center wraps] a row of task filters (states default, empty, error) `S08.n11`
  - [Select outline · input] Status (F14.S02) (160 wide; field FD30; states default, empty, error) `S08.n12`
  - [Select outline · input] Priority (F14.S02) (160 wide; field FD31; states default, empty, error) `S08.n13`
  - [Button md rounded · secondary-action] Clear filters (F14.A03) (states empty) `S08.n14`
- [Button md rounded · primary-action] Add task → S19 (states default, empty, error) `S08.n15`

### S08.sec3 taskList (list, column gap 6 align stretch, in S08.b1)

Task list with quick Done tick, priority and status tags, overdue highlighting and per-task delete; selecting a row opens the task.

- [container · row gap 2 align stretch wraps] a row of search and filter fields with add action (fills) `S08.n16`
  - [SearchInput outline · input] Search tasks (F14.S02) (fills; field FD27) `S08.n17`
  - [Select outline · input] Status (F14.S02) (field FD30) `S08.n18`
  - [Select outline · input] Priority (F14.S02) (field FD31) `S08.n19`
  - [Button md rounded · primary-action] Add task → S19 (F15.S02) `S08.n20`
- [container · column gap 2 align stretch] a column of task rows (F15.A03, F17.A03, F17.A04) (fills; data Task.title, Task.status, Task.priority, Task.dueDate) `S08.n21`
  - [container · column gap 4 padding 4 align stretch] a task row container (fills; data Task.title, Task.status, Task.priority, Task.dueDate) `S08.n22`
    - [container · row gap 2 align center wraps] the top line of a task row (fills) `S08.n23`
      - [IconButton rounded ghost · secondary-action] "Mark as done" `S08.n24`
      - [Link plain · navigation] Design homepage wireframe → S19 (F14.S03, F16.S01) (fills; data Task.title) `S08.n25`
      - [container · row gap 1 align center] a row of status and priority tags (data Task.status, Task.priority) `S08.n26`
        - [Tag sm bordered · display] In progress (data Task.status) `S08.n27`
        - [Tag sm bordered · display] High (data Task.priority) `S08.n28`
      - [IconButton rounded ghost · destructive-action] "Delete task" (F17.S02) `S08.n29`
    - [text caption] Due 12 Nov · Overdue (fills; data Task.dueDate) `S08.n30`
- [container · column gap 4 padding 4 align center] a centred empty state (F14.A03) (fills; states empty) `S08.n31`
  - [media] an empty tasks icon (F14.A03) (states empty) `S08.n32`
  - [text body] Nothing matches your search. (F14.A03) (states empty) `S08.n33`
  - [Button md rounded · secondary-action] Clear search (F14.S02, F14.A03) (states empty) `S08.n34`
- [feedback body] Tasks could not load. Try again. (fills; states error) `S08.n35`
- [container · column gap 4 padding 4 align center] a centred gone message (F14.A04, F16.A01) (fills; states notFound) `S08.n36`
  - [text body] This task is gone. (F14.A04, F16.A01) (states notFound) `S08.n37`
  - [Button md rounded · navigation] Back to tasks → S08 (F14.A04, F16.A01) (states notFound) `S08.n38`

## S09 Sessions

/sessions · app screen · shell SH1 · wide width · signed in (designer)

Run upcoming sessions and cancel a slot when needed.

States: empty, error, notFound. Serves: F24.S01, F24.S02, F24.A01, F24.A02, F24.A03, F24.A04. Sections: column gap 6 padding 6 align stretch.
Box S09.b1: column gap 6, fills.

### S09.sec1 Sessions (page-header, grid 2 columns gap 2 padding 8 align center justify between, in S09.b1)

Shows the page title with helper description and an optional action button on the right.

- [h1 title] Sessions (fills) `S09.n01`
- [container · row gap 2 align center justify end] a row for the page action `S09.n02`
- [text body] See what is coming up and tweak booking settings any time. (fills, spans 2) `S09.n03`

### S09.sec2 sessionsList (list, column gap 6 padding 4 align stretch, in S09.b1)

Upcoming sessions grouped by date showing session type, time, seats booked versus maximum and who booked it with Cancel slot action per session.

- [container · column gap 4 align stretch] a date group of sessions (F24.S01, F24.A03, F24.A04) (fills) `S09.n04`
  - [Truncate] Sat, 8 Nov (F24.S01, F24.A03, F24.A04) (fills; data Session.date) `S09.n05`
  - [container · row gap 2 align center justify between] a session row (F24.S01, F24.A03, F24.A04) (fills) `S09.n06`
    - [Truncate] Design review · 10:00 AM (F24.S01, F24.A03, F24.A04) (fills; data SessionType.name, Session.startTime) `S09.n07`
    - [Truncate] 3 of 8 booked (F24.S01, F24.A03, F24.A04) `S09.n08`
    - [Button md rounded · destructive-action] Cancel → S23 (F24.S02) `S09.n09`
  - [text caption] Maya Shah, Arjun Mehta (F24.S01, F24.A03, F24.A04) (fills; data Booking.name) `S09.n10`
- [container · column gap 4 padding 4 align center justify center] a centred empty state (F24.A01) (fills; states empty) `S09.n11`
  - [media] an empty calendar illustration (F24.A01) (states empty) `S09.n12`
  - [text body] No upcoming sessions yet. (F24.A01) (states empty) `S09.n13`
  - [Button md rounded · navigation] Set up sessions → S10 (F24.A01) (states empty) `S09.n14`
- [feedback body] That session is already gone. (F24.A02) (fills; states notFound) `S09.n15`
- [Button md rounded · navigation] Back to home → S04 (F24.A02) (states notFound) `S09.n16`
- [feedback body] Could not load sessions. Please try again. (F24.S01) (fills; states error) `S09.n17`
- [Button md rounded · secondary-action] Try again (F24.S01) (states error) `S09.n18`

## S10 Booking settings

/settings/bookings · app screen · shell SH1 · medium width · signed in (designer)

Set weekly availability and define session types.

States: empty, error, notFound. Serves: F18.S01, F18.S02, F19.S01, F20.S01, F20.S02, F21.S01, F21.S02, F18.A01, F18.A02, F18.A03, F19.A01, F20.A01, F20.A02, F21.A01, F21.A02, F21.A03. Sections: column gap 6 padding 6 align stretch.
Box S10.b1: column gap 6, fills.

### S10.sec1 Booking settings (page-header, grid 2 columns gap 2 padding 8 align center justify between, in S10.b1)

Shows the page title with helper description and an optional action button on the right.

- [h1 title] Booking settings (fills) `S10.n01`
- [container · row gap 2 align center justify end] a row for the page action `S10.n02`
- [text body] Choose when you are open and what folks can book. (fills, spans 2) `S10.n03`

### S10.sec2 availabilitySettings (settings-group, column gap 4 padding 4 align stretch, in S10.b1)

Weekly availability section with day choices, Available from and Available to time fields, Save action and preview of slots for the next two weeks.

- [h2 heading] Weekly availability (fills; states default, empty) `S10.n04`
- [text subheading] Choose the days and hours you can be booked. (fills; states default, empty) `S10.n05`
- [ChipGroup collapsed · input] Available days (F18.S01, F18.S02) (fills; field FD18; data Availability.days; states default, empty) `S10.n06`
- [container · row gap 2 wraps] a row of time fields (fills; states default, empty) `S10.n07`
  - [new TimeInput · input] Available from (F18.S01, F18.S02) (200 wide; field FD19; data Availability.from; states default, empty) `S10.n08`
  - [new TimeInput · input] Available to (F18.S01, F18.S02) (200 wide; field FD20; data Availability.to; states default, empty) `S10.n09`
- [Button md rounded · primary-action] Save (F18.S02, F18.A02, F18.A03) (states default, empty) `S10.n10`
- [text body] No times are bookable yet. Add your days and hours to open booking. (F18.A01) (fills; states empty) `S10.n11`
- [container · column gap 1 align stretch] a preview group (fills) `S10.n12`
  - [h3 subheading] Slots for the next two weeks (fills) `S10.n13`
  - [text body] Mon 9 Nov · 10:00 – 17:00 · Tue 10 Nov · 10:00 – 17:00 (fills; data Availability.days, Availability.from, Availability.to) `S10.n14`

### S10.sec3 sessionTypesList (list, column gap 4 align stretch, in S10.b1)

Session types section listing duration, price display and maximum people with Add, Edit and Delete actions.

- [h2 heading] Session types (fills; states default, empty, error) `S10.n15`
- [container · row gap 2 align center justify end] a toolbar row for the add action (fills) `S10.n16`
  - [Button md rounded · primary-action] Add session type → S21 (F19.S01) `S10.n17`
- [container · column gap 2 align stretch] a list of session types (F20.S01, F19.A01, F21.A02, F21.A03) (fills; data SessionType.name, SessionType.duration, SessionType.priceDisplay, SessionType.maxPeople) `S10.n18`
  - [container · row gap 2 align center justify between wraps] a session type row (fills) `S10.n19`
    - [Truncate] Design review (fills; data SessionType.name) `S10.n20`
    - [Truncate] 60 min · ₹4,000 · Up to 8 people (fills; data SessionType.duration, SessionType.priceDisplay, SessionType.maxPeople) `S10.n21`
    - [container · row gap 2 align center justify end] a row of edit and delete buttons `S10.n22`
      - [IconButton sm rounded ghost · secondary-action] "Edit session type" → S21 (F20.S02, F21.S01) (over the defaults: smaller buttons fit in the row) `S10.n23`
      - [IconButton sm rounded ghost · destructive-action] "Delete session type" → S22 (F21.S02) (over the defaults: smaller buttons fit in the row) `S10.n24`
- [container · column gap 4 padding 6 align center justify center] a centred empty message (F20.A01) (fills; states empty) `S10.n25`
  - [media] 📅 (F20.A01) (states empty) `S10.n26`
  - [text body] No session types yet. (F20.A01) (states empty) `S10.n27`
  - [Button md rounded · secondary-action] Add session type → S21 (F19.S01, F20.A01) (states empty) `S10.n28`
- [feedback body] Could not load session types. Try again later. (fills; states error) `S10.n29`
- [container · column gap 4 padding 6 align center justify center] a centred gone message (F20.A02, F21.A01) (fills; states notFound) `S10.n30`
  - [text body] This session type is gone. (F20.A02, F21.A01) (states notFound) `S10.n31`
  - [Link plain · navigation] Back to session types → S10 (F20.S01, F20.A02, F21.A01) (states notFound) `S10.n32`

## S11 Book a session

/book · marketing screen · shell SH2 · medium width · public · entry

Let a booker pick a session type and open slot and book with name and email.

States: empty, error. Serves: F22.S01, F22.S02, F22.S03, F22.A01, F22.A02, F22.A03, F22.A04, F22.A05. Sections: column gap 8 padding 8 align stretch.
Box S11.b1: column gap 8, fills.
Box S11.b2 in S11.b1: row gap 8, fills.

### S11.sec1 Book a session (page-header, grid 2 columns gap 2 padding 8 align center justify between, in S11.b1, on the brand surface)

Shows the page title with helper description and an optional action button on the right.

- [h1 display] Book a session (fills) `S11.n01`
- [container · row gap 2 align center justify end] a row for the page action `S11.n02`
- [text body] Choose a friendly one-to-one session. Times are shown in your timezone, and prices are only to help you choose. (fills, spans 2) `S11.n03`

### S11.sec2 bookingSessionCards (cards, row gap 2 align stretch wraps, in S11.b1)

Selectable session type cards showing duration, price display and seats; picking a card shows its slots.

- [container · column gap 4 padding 4 align stretch] a selectable session type card (F22.S01) (240 wide) `S11.n04`
  - [text body] 60 minute design review (fills; data SessionType.name) `S11.n05`
  - [text label] 60 minutes · ₹4,000 (fills; data SessionType.duration, SessionType.priceDisplay) `S11.n06`
  - [text label] 1 person (fills; data SessionType.maxPeople) `S11.n07`
  - [Button md rounded · secondary-action] Select (F22.S01) (fills) `S11.n08`
- [container · column gap 4 padding 4 align center justify center] empty state (F22.A01) (fills; states empty) `S11.n09`
  - [media] a calendar illustration (states empty) `S11.n10`
  - [text body] No sessions are available yet. (F22.A01) (states empty) `S11.n11`
  - [Button md rounded · secondary-action] Try again (F22.S01) (states empty) `S11.n12`
- [feedback body] We could not load sessions. Please try again. (F22.S01) (fills; states error) `S11.n13`

### S11.sec3 bookingSlotPicker (custom, column gap 4 padding 4 align stretch, share 2, in S11.b2)

Date-grouped open slots for the next two weeks with full marked; the booker picks one open slot.

- [h2 title] Pick a time that suits you (fills) `S11.n14`
- [text title] Open times for the next two weeks, with full times marked. (fills) `S11.n15`
- [new SlotPicker · input] Tue, Nov 4 · 10:00 AM, 2:00 PM · Wed, Nov 5 · 9:30 AM (F22.S02, F22.A05) (fills; field FD28; data Session.date, Session.startTime; states default, error) `S11.n16`
- [feedback body] That time just became full. Pick another open time below. (F22.A05) (fills; states error) `S11.n17`
- [container · column gap 4 padding 4 align center] the empty state (fills; states empty) `S11.n18`
  - [media] an empty calendar icon (states empty) `S11.n19`
  - [text body] No open times for this type in the next two weeks. (F22.A02) (states empty) `S11.n20`
  - [Button md rounded · secondary-action] Try another type (F22.A02) (states empty) `S11.n21`

### S11.sec4 bookingForm (form, column gap 4 align stretch, in S11.b2)

Booking form with name and email fields and Book action with inline errors.

- [container · column gap 4 align stretch] fields group (fills) `S11.n22`
  - [Select outline · input] Chosen slot (F22.S03) (fills; field FD29) `S11.n23`
  - [Input outline · input] Booker name (F22.S03) (fills; field FD25; data Booking.name) `S11.n24`
  - [Input outline · input] Booker email (F22.S03) (fills; field FD26; data Booking.email) `S11.n25`
- [Button md rounded · primary-action] Book (F22.S03, F22.A03, F22.A04) `S11.n26`

### S11.sec5 bookingConfirmation (detail, column gap 4 padding 4 align stretch, in S11.b1, on the frame surface)

Confirmation panel showing the booking is saved with its cancellation link.

- [h2 title] You're booked (fills; data Booking.name) `S11.n27`
- [text heading] Thursday, November 5 at 10:00 AM (fills; data Session.date, Session.startTime) `S11.n28`
- [Input outline · input] Booker name (F22.S03) (fills; field FD25; data Booking.name) `S11.n29`
- [Input outline · input] Booker email (F22.S03) (fills; field FD26) `S11.n30`
- [Select outline · input] Chosen slot (F22.S03) (fills; field FD29; data Session.date, Session.startTime) `S11.n31`
- [text body] Keep this link to change or cancel. (fills) `S11.n32`
- [Link plain · navigation] Manage your booking → S12 (fills) `S11.n33`

## S12 Manage booking

/bookings/[token] · marketing screen · shell SH2 · narrow width · public · entry

Let a booker view and cancel their own booking via its link.

States: notFound. Serves: F23.S01, F23.S02, F23.A01, F23.A02, F23.A03. Sections: column gap 8 padding 8 align stretch.
Box S12.b1: column gap 8, fills.

### S12.sec1 manageBookingCard (detail, column gap 4 padding 8 align stretch, in S12.b1)

Focused card showing session type, date and start time and booker name with status and Cancel booking button.

- [h1 display] Design review (F23.S01) (fills; data SessionType.name) `S12.n01`
- [container · row gap 2 justify between] a row of booking summary and status (fills) `S12.n02`
  - [text body] Tue 12 May · 10:00 AM · Maya Shah (F23.S01) (fills; data Session.date, Session.startTime, Booking.name) `S12.n03`
  - [Tag sm bordered · display] Confirmed (F23.S01) `S12.n04`
- [Button md rounded · destructive-action] Cancel booking → S24 (F23.S01, F23.S02, F23.A02, F23.A03) `S12.n05`
- [text body] This booking is gone or already cancelled. (F23.A01) (fills; states notFound) `S12.n06`
- [Link plain · navigation] Book a new session → S11 (states notFound) `S12.n07`

## S13 Add client

dialog of S05 · app screen · medium width · signed in (designer)

Create a new client from the client list.

States: . Serves: F05.S03, F05.A03, F05.A04. Sections: column gap 5 align stretch.
Box S13.b1: column gap 5, fills.

### S13.sec1 clientFormAdd (form, column gap 4 align stretch, in S13.b1)

Client form dialog for name, email, company, profile, status and follow-up date with Save and Cancel actions and inline validation.

- [h2 heading] Add client (fills) `S13.n01`
- [container · column gap 4 align stretch] a column of client fields (fills) `S13.n02`
  - [Input outline · input] Client name (F05.S03) (fills; field FD03; data Client.name) `S13.n03`
  - [Input outline · input] Client email (F05.S03) (fills; field FD04; data Client.email) `S13.n04`
  - [Input outline · input] Company (F05.S03) (fills; field FD05; data Client.company) `S13.n05`
  - [Textarea outline · input] Profile (F05.S03) (fills; field FD06; data Client.profile) `S13.n06`
  - [Select outline · column gap 4 align stretch · input] Client status (F05.S03) (fills; field FD07; data Client.status) `S13.n07`
    - [SelectOption · input] Lead (fills) `S13.n08`
    - [SelectOption · input] Active (fills) `S13.n09`
    - [SelectOption · input] Past (fills) `S13.n10`
  - [Input outline · input] Follow-up date (F05.S03) (fills; field FD08; data Client.followUpDate) `S13.n11`
- [container · row gap 2 align center justify end] a row of footer actions (fills) `S13.n12`
  - [Button md rounded · secondary-action] Cancel `S13.n13`
  - [Button md rounded · primary-action] Save (F05.S03, F05.A03, F05.A04) `S13.n14`

## S14 Edit client

dialog of S06 · app screen · medium width · signed in (designer)

Update the open client's details and follow-up date.

States: . Serves: F07.S03, F07.A03, F07.A04, F07.A05. Sections: column gap 5 align stretch.
Box S14.b1: column gap 5, fills.

### S14.sec1 clientFormEdit (form, column gap 4 align stretch, in S14.b1)

Prefilled client form dialog for name, email, company, profile, status and follow-up date with Save and Cancel and inline validation.

- [h2 heading] Edit client (fills) `S14.n01`
- [container · column gap 4 align stretch] a column of client fields (fills) `S14.n02`
  - [Input outline · input] Client name (F07.S03) (fills; field FD03; data Client.name) `S14.n03`
  - [Input outline · input] Client email (F07.S03) (fills; field FD04; data Client.email) `S14.n04`
  - [Input outline · input] Company (F07.S03) (fills; field FD05; data Client.company) `S14.n05`
  - [Textarea outline · input] Profile (F07.S03) (fills; field FD06; data Client.profile) `S14.n06`
  - [Select outline · input] Client status (F07.S03) (fills; field FD07; data Client.status) `S14.n07`
  - [Input outline · input] Follow-up date (F07.S03) (fills; field FD08; data Client.followUpDate) `S14.n08`
- [container · row gap 2 align center justify end] a row of footer actions (fills) `S14.n09`
  - [Button md rounded · secondary-action] Cancel (F07.A05) `S14.n10`
  - [Button md rounded · primary-action] Save (F07.S03, F07.A03, F07.A04) `S14.n11`

## S15 Delete client confirm

dialog of S06 · app screen · narrow width · signed in (designer, booker)

Confirm deleting the client and its contents or a mistaken note.

States: . Serves: STD01.S01, STD01.A01, STD01.A02. Sections: column gap 5 align stretch.
Box S15.b1: column gap 5, fills.

### S15.sec1 Delete this client? (custom, column gap 4 align stretch, in S15.b1)

Small confirm dialog naming the item to remove and what else goes with it with Delete and Keep actions, Delete emphasized as danger.

- [h2 heading] Delete this client? (STD01.S01) (fills) `S15.n01`
- [text subheading] Its projects, tasks and notes will also be removed. (STD01.S01) (fills) `S15.n02`
- [container · column gap 2 align stretch] screen-specific delete details (STD01.S01) (fills) `S15.n03`
- [container · row gap 2 align center justify end] a row of confirm actions (fills) `S15.n04`
  - [Button md rounded · secondary-action] Keep (STD01.A02) `S15.n05`
  - [Button md rounded · destructive-action] Delete (STD01.A01) `S15.n06`

## S16 Add note

dialog of S06 · app screen · narrow width · signed in (designer)

Jot a dated note under the open client.

States: . Serves: F09.S03, F09.A03, F09.A04. Sections: column gap 5 align stretch.
Box S16.b1: column gap 5, fills.

### S16.sec1 noteForm (form, column gap 4 align stretch, in S16.b1)

Small dialog with note date and text fields with Save note and Cancel and inline validation.

- [h2 heading] Add note (fills) `S16.n01`
- [container · column gap 4 align stretch] a column of note fields (fills) `S16.n02`
  - [Input outline · input] Note date (F09.S03) (fills; field FD09; data Note.date) `S16.n03`
  - [Textarea outline · input] Note text (F09.S03) (fills; field FD10; data Note.text) `S16.n04`
- [container · row gap 2 align center justify end] a row of footer actions (fills) `S16.n05`
  - [Button md rounded · primary-action] Save note (F09.A03, F09.A04, F09.S03) `S16.n06`
  - [Button md rounded · secondary-action] Cancel `S16.n07`

## S17 Add project

dialog of S06 · app screen · narrow width · signed in (designer)

Start a new project under the open client.

States: . Serves: F10.S03, F10.A03, F10.A04. Sections: column gap 5 align stretch.
Box S17.b1: column gap 5, fills.

### S17.sec1 projectFormAdd (form, column gap 4 align stretch, in S17.b1)

Small dialog with project name, description and optional due date with Save and Cancel and inline validation.

- [h2 heading] Add project (fills) `S17.n01`
- [container · column gap 4 align stretch] a column of project fields (fills) `S17.n02`
  - [Input outline · input] Project name (fills; field FD11; data Project.name) `S17.n03`
  - [Textarea outline · input] Project description (fills; field FD12; data Project.description) `S17.n04`
  - [Input outline · input] Project due date (fills; field FD13; data Project.dueDate) `S17.n05`
- [container · row gap 2 align center justify end] a row of form actions (fills) `S17.n06`
  - [Button md rounded · secondary-action] Cancel `S17.n07`
  - [Button md rounded · primary-action] Save (F10.S03, F10.A03, F10.A04) `S17.n08`

## S18 Edit project

dialog of S08 · app screen · narrow width · signed in (designer)

Update the open project's details.

States: . Serves: F11.S02, F11.A02, F11.A03. Sections: column gap 5 align stretch.
Box S18.b1: column gap 5, fills.

### S18.sec1 projectFormEdit (form, column gap 4 align stretch, in S18.b1)

Small prefilled project form with name, description and due date with Save and Cancel and inline validation.

- [h2 heading] Edit project (fills) `S18.n01`
- [container · column gap 4 align stretch] the fields group (fills) `S18.n02`
  - [Input outline · input] Project name (F11.S02) (fills; field FD11; data Project.name) `S18.n03`
  - [Textarea outline · input] Project description (F11.S02) (fills; field FD12; data Project.description) `S18.n04`
  - [Input outline · input] Project due date (F11.S02) (fills; field FD13; data Project.dueDate) `S18.n05`
- [container · row gap 2 align center justify end] a row of form actions (fills) `S18.n06`
  - [Button md ghost · secondary-action] Cancel (over the defaults: quiet secondary action next to the primary save) `S18.n07`
  - [Button md rounded · primary-action] Save (F11.S02, F11.A02, F11.A03) `S18.n08`

## S19 Task form

dialog of S08 · app screen · narrow width · signed in (designer)

Add or edit a task in the open project.

States: . Serves: F15.S03, F16.S02, F15.A04, F15.A05, F16.A02, F16.A03. Sections: column gap 5 align stretch.
Box S19.b1: column gap 5, fills.

### S19.sec1 taskForm (form, column gap 4 align stretch, in S19.b1)

Small task dialog with title, status, priority and optional due date including quick Done choice with Save and Cancel and inline validation.

- [h2 heading] Task details (fills) `S19.n01`
- [container · column gap 4 align stretch] a column of task fields (fills) `S19.n02`
  - [Input outline · input] Task title (F15.S03, F16.S02) (fills; field FD14; data Task.title) `S19.n03`
  - [RadioGroup · column gap 4 · input] Task status (F15.S03, F16.S02) (fills; field FD15; data Task.status) `S19.n04`
    - [Radio sm · input] To do (fills) `S19.n05`
    - [Radio sm · input] In progress (fills) `S19.n06`
    - [Radio sm · input] Done (fills) `S19.n07`
  - [Select outline · column gap 4 align stretch · input] Task priority (F15.S03, F16.S02) (fills; field FD16; data Task.priority) `S19.n08`
    - [SelectOption · input] Low (fills) `S19.n09`
    - [SelectOption · input] Medium (fills) `S19.n10`
    - [SelectOption · input] High (fills) `S19.n11`
  - [Input outline · input] Due date, optional (F15.S03, F16.S02) (fills; field FD17; data Task.dueDate) `S19.n12`
- [container · row gap 2 align center justify end] a row of footer actions (fills) `S19.n13`
  - [Button md rounded · secondary-action] Cancel `S19.n14`
  - [Button md rounded · primary-action] Save (F15.S03, F16.S02, F15.A04, F15.A05, F16.A02, F16.A03) `S19.n15`

## S20 Delete project confirm

dialog of S08 · app screen · narrow width · signed in (designer, booker)

Confirm deleting the project and its tasks or a single task.

States: . Serves: STD01.S01, STD01.A01, STD01.A02. Sections: column gap 5 align stretch.
Box S20.b1: column gap 5, fills.

### S20.sec1 Delete this project? (custom, column gap 4 align stretch, in S20.b1)

Small confirm dialog naming the item to remove and what else goes with it with Delete and Keep actions, Delete emphasized as danger.

- [h2 heading] Delete this project? (STD01.S01) (fills) `S20.n01`
- [text subheading] Its projects, tasks and notes will also be removed. (STD01.S01) (fills) `S20.n02`
- [container · column gap 2 align stretch] screen-specific delete details (STD01.S01) (fills) `S20.n03`
- [container · row gap 2 align center justify end] a row of confirm actions (fills) `S20.n04`
  - [Button md rounded · secondary-action] Keep (STD01.A02) `S20.n05`
  - [Button md rounded · destructive-action] Delete (STD01.A01) `S20.n06`

## S21 Session type form

dialog of S10 · app screen · narrow width · signed in (designer)

Add or edit a bookable session type.

States: . Serves: F19.S02, F20.S03, F19.A02, F19.A03, F20.A03, F20.A04. Sections: column gap 5 align stretch.
Box S21.b1: column gap 5, fills.

### S21.sec1 sessionTypeForm (form, column gap 4 align stretch, in S21.b1)

Small session type dialog with name, duration, price display and maximum people with Save and Cancel and inline validation.

- [h2 heading] Session type (fills) `S21.n01`
- [container · column gap 4 align stretch] a column of session type fields (fills) `S21.n02`
  - [Input outline · input] Session type name (F19.S02, F20.S03) (fills; field FD21; data SessionType.name) `S21.n03`
  - [NumberInput outline · input] Duration in minutes (F19.S02, F20.S03) (fills; field FD22; data SessionType.duration) `S21.n04`
  - [Input outline · input] Price display (F19.S02, F20.S03) (fills; field FD23; data SessionType.priceDisplay) `S21.n05`
  - [NumberInput outline · input] Maximum people (F19.S02, F20.S03) (fills; field FD24; data SessionType.maxPeople) `S21.n06`
- [container · row gap 2 align center justify end] a row of footer actions (fills) `S21.n07`
  - [Button md rounded · secondary-action] Cancel `S21.n08`
  - [Button md rounded · primary-action] Save (F19.S02, F20.S03, F19.A02, F19.A03, F20.A03, F20.A04) `S21.n09`

## S22 Delete session type confirm

dialog of S10 · app screen · narrow width · signed in (designer, booker)

Confirm stopping a session type.

States: . Serves: STD01.S01, F21.A02, F21.A03, STD01.A01, STD01.A02. Sections: column gap 5 align stretch.
Box S22.b1: column gap 5, fills.

### S22.sec1 Stop offering “{Session type.name}”? (custom, column gap 4 align stretch, in S22.b1)

Small confirm dialog naming the item to remove and what else goes with it with Delete and Keep actions, Delete emphasized as danger.

- [h2 heading] Remove "Acme Co" for good? (STD01.S01) (fills) `S22.n01`
- [text subheading] Bookers can no longer pick this session type. (STD01.S01) (fills) `S22.n02`
- [container · column gap 2 align stretch] screen-specific delete details (STD01.S01) (fills) `S22.n03`
  - [text body] “60 minute design review” will no longer be offered — bookers can no longer pick it. (F21.A02, F21.A03) (fills; data SessionType.name) `S22.n07`
- [container · row gap 2 align center justify end] a row of confirm actions (fills) `S22.n04`
  - [Button md rounded · secondary-action] Keep (STD01.A02) `S22.n05`
  - [Button md rounded · destructive-action] Delete (STD01.A01) `S22.n06`

## S23 Cancel session confirm

dialog of S09 · app screen · narrow width · signed in (designer, booker)

Confirm cancelling an upcoming session and its bookings.

States: . Serves: STD01.S01, STD01.A01, STD01.A02. Sections: column gap 5 align stretch.
Box S23.b1: column gap 5, fills.

### S23.sec1 Cancel Morning Flow on Tuesday? (custom, column gap 4 align stretch, in S23.b1)

Small confirm dialog naming the item to remove and what else goes with it with Delete and Keep actions, Delete emphasized as danger.

- [h2 heading] Cancel Morning Flow on Tuesday? (STD01.S01) (fills) `S23.n01`
- [text subheading] Its projects, tasks and notes will also be removed. (STD01.S01) (fills) `S23.n02`
- [container · column gap 2 align stretch] screen-specific delete details (STD01.S01) (fills) `S23.n03`
- [container · row gap 2 align center justify end] a row of confirm actions (fills) `S23.n04`
  - [Button md rounded · secondary-action] Keep (STD01.A02) `S23.n05`
  - [Button md rounded · destructive-action] Delete (STD01.A01) `S23.n06`

## S24 Cancel booking confirm

dialog of S12 · marketing screen · narrow width · signed in (designer, booker)

Confirm the booker wants to cancel their own booking.

States: . Serves: STD01.S01, STD01.A01, STD01.A02. Sections: column gap 5 align stretch.
Box S24.b1: column gap 5, fills.

### S24.sec1 Cancel this booking? (custom, column gap 4 align stretch, in S24.b1)

Small confirm dialog naming the item to remove and what else goes with it with Delete and Keep actions, Delete emphasized as danger.

- [h2 title] Cancel this booking? (STD01.S01) (fills) `S24.n01`
- [text subheading] Its projects, tasks and notes will also be removed. (STD01.S01) (fills) `S24.n02`
- [container · column gap 2 align stretch] screen-specific delete details (STD01.S01) (fills) `S24.n03`
- [container · row gap 2 align center justify end] a row of confirm actions (fills) `S24.n04`
  - [Button md rounded · secondary-action] Keep (STD01.A02) `S24.n05`
  - [Button md rounded · destructive-action] Delete (STD01.A01) `S24.n06`

## New components

### SlotPicker

Let a booker pick one open session slot grouped by day with full states visible.

- Closest existing: RadioGroup, ChipGroup, Card. Why not: RadioGroup and ChipGroup lack date grouping, two-week range structure, and full-versus-open slot states with seat counts.
- Look: A date-grouped grid for the next two weeks that shows each day as a heading with its time slots as selectable pills in Figtree, soft radius, comfortable density. Open slots are selectable, full slots are muted and marked Full with a Tag, past slots are omitted. It stands out as the primary booking control on the public page, calm and scannable like the slot grids of a booking app.
- Width: 480 to fill. Box: fill, content, padding 6, gap 6; column gap 6 padding 6 align stretch.
  - [container] a day group for Monday slots `SlotPicker.n01`
  - [heading] the day heading: Monday, Nov 3 `SlotPicker.n02`
  - [container] a wrapping row of time slot pills `SlotPicker.n03`
  - [Chip] an open time slot pill: 9:30 AM `SlotPicker.n04`
  - [Chip] an open time slot pill: 10:30 AM `SlotPicker.n05`
  - [Chip] an open time slot pill with seats left: 2:00 PM · 6 seats left `SlotPicker.n06`
  - [container] a day group for Tuesday slots `SlotPicker.n07`
  - [heading] the day heading: Tuesday, Nov 4 `SlotPicker.n08`
  - [container] a wrapping row of time slot pills `SlotPicker.n09`
  - [Chip] an open time slot pill: 9:00 AM `SlotPicker.n10`
  - [display] a muted full slot pill `SlotPicker.n11`
  - [text] the full slot time: 11:30 AM `SlotPicker.n12`
  - [Tag] a Full status tag: Full `SlotPicker.n13`
  - [Chip] an open time slot pill with seats left: 4:30 PM · 2 seats left `SlotPicker.n14`
  - [container] a day group for Wednesday slots `SlotPicker.n15`
  - [heading] the day heading: Wednesday, Nov 5 `SlotPicker.n16`
  - [container] a wrapping row of time slot pills `SlotPicker.n17`
  - [Chip] an open time slot pill: 10:00 AM `SlotPicker.n18`
  - [Chip] an open time slot pill: 1:00 PM `SlotPicker.n19`
- Used on: S11.

### TimeInput

Enter and validate a time of day for weekly availability windows.

- Closest existing: Input, FormControl. Why not: Input supports only text, tel, url and email types and has no time parsing, validation, or time affordance.
- Look: A single time-of-day field showing HH:MM with a clock icon, soft radius, Figtree text, halo focus, and inline error like other inputs. Used in pairs for Available from and Available to in the availability form, calm and compact like the time fields of a calendar settings form.
- Width: 160 to 240. Box: fill, content, padding 0, gap 2; column gap 4 align stretch.
  - [text] the field label: Time `TimeInput.n01`
  - [container] the time field box with soft edge and halo focus `TimeInput.n02`
  - [Input] the time field showing HH colon MM with clock icon `TimeInput.n03`
  - [feedback] the inline error message: Enter a valid time, like 09:00. `TimeInput.n05`
- Used on: S10.

## Questions

- Q01 Do the different session types share one availability calendar, so a booked discovery call or design review blocks an overlapping workshop slot, and vice versa? Default: Yes. Booking any session type blocks that time for the other session types, except that additional bookers can still join the same Figma workshop session until it reaches 8 people.
- Q02 Which time zone should bookers see slot times in? Default: The designer's own local time zone is used and shown on the booking page, with no time zone conversion for bookers.

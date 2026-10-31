# NeonBoard: design

Audience: Individuals building personal dashboards to keep notes, counters, checklists, and links together in one private place. Feels bold, futuristic, electric, focused, playful; copy is Short, direct, and encouraging, with light console-style wording that never obscures the task..

- Density comfortable, radius 8px surfaces and 6px controls, focus ring glow, imagery icons.
- Fonts: Inter for text, Space Grotesk for headings, JetBrains Mono for code.
- Logo: the name as a wordmark in Space Grotesk 700, as written, letter spacing 0.06em; #00A7A7 in dark.
- Style neon and squared, dark only; brand hue 195, vivid; page background repeating-linear-gradient(0deg, oklch(0.25 0.021 246) 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, oklch(0.25 0.021 246) 0 1px, transparent 1px 32px), radial-gradient(circle at 18% 0%, oklch(0.25 0.060 195) 0%, transparent 52%), radial-gradient(circle at 88% 12%, oklch(0.25 0.042 294) 0%, transparent 46%), linear-gradient(180deg, oklch(0.20 0.015 246), oklch(0.17 0.009 246)); frame hue 294, balanced.
- Wireframes of every screen at desktop width: `02-design/08-wireframes.html`.

## Palette

### page, dark

| Role | Hex | Contrast |
| ---- | --- | -------- |
| pageBg | `#10171D` |  |
| pageFg | `#E1F1FF` | 15.68:1 on pageBg, 15.81:1 on frameBg |
| pageFgMuted | `#83A6C5` | 7.08:1 on pageBg, 7.14:1 on frameBg |
| frameBg | `#171322` |  |
| divider | `#202D38` | 1.29:1 on pageBg, 1.3:1 on frameBg |
| backdrop | `#0C1013` |  |
| skeleton | `#202D38` | 1.29:1 on pageBg, 1.3:1 on frameBg |
| pageBackground | `repeating-linear-gradient(0deg, oklch(0.25 0.021 246) 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, oklch(0.25 0.021 246) 0 1px, transparent 1px 32px), radial-gradient(circle at 18% 0%, oklch(0.25 0.060 195) 0%, transparent 52%), radial-gradient(circle at 88% 12%, oklch(0.25 0.042 294) 0%, transparent 46%), linear-gradient(180deg, oklch(0.20 0.015 246), oklch(0.17 0.009 246))` |  |

### theme, dark

| Role | Hex | Contrast |
| ---- | --- | -------- |
| bg | `#001B1B` |  |
| fg | `#B2FFFE` | 16.03:1 on pageBg, 16.16:1 on frameBg, 15.89:1 on bg, 13.96:1 on hoverBg |
| fgMuted | `#00B8B9` | 7.3:1 on bg |
| border | `#007F7F` | 3.74:1 on pageBg, 3.77:1 on frameBg, 3.7:1 on bg |
| hoverBg | `#002828` |  |
| accentBg | `#00A7A7` |  |
| accentFg | `#021313` | 6.41:1 on accentBg, 7.74:1 on accentHoverBg |
| accentBorder | `#00A7A7` |  |
| accentHoverBg | `#00B8B9` |  |
| focus | `#00A7A7` | 6.1:1 on pageBg, 6.15:1 on frameBg, 6.04:1 on bg |
| accentFocus | `#B2FFFE` |  |
| shadow | `#021313` |  |

### base, dark

| Role | Hex | Contrast |
| ---- | --- | -------- |
| bg | `#10171D` |  |
| fg | `#E1F1FF` | 15.68:1 on pageBg, 15.81:1 on frameBg, 15.68:1 on bg, 13.84:1 on hoverBg |
| fgMuted | `#83A6C5` | 7.08:1 on bg |
| border | `#56728B` | 3.59:1 on pageBg, 3.62:1 on frameBg, 3.59:1 on bg |
| hoverBg | `#19232B` |  |
| accentBg | `#ABC8E2` |  |
| accentFg | `#10171D` | 10.4:1 on accentBg, 15.68:1 on accentHoverBg |
| accentBorder | `#ABC8E2` |  |
| accentHoverBg | `#E1F1FF` |  |
| focus | `#7496B5` | 5.83:1 on pageBg, 5.88:1 on frameBg, 5.83:1 on bg |
| accentFocus | `#E1F1FF` |  |
| shadow | `#0C1013` |  |

Entity set widget: One block on a dashboard. Its type is note, counter, checklist, or link list, and it has a title, a relative position, a size of small, medium, or large, and settings for its type: plain text for a note, a number and label for a counter, checklist items for a checklist, and titles with web addresses for a link list.

### widget, dark

| Role | Hex | Contrast |
| ---- | --- | -------- |
| bg | `#171227` |  |
| fg | `#EFECFF` | 15.72:1 on bg, 13.99:1 on hoverBg |
| fgMuted | `#A989FF` | 6.69:1 on bg |
| border | `#755AB9` | 3.4:1 on bg |
| hoverBg | `#241B3B` |  |
| accentBg | `#9A79EF` |  |
| accentFg | `#100D19` | 5.81:1 on accentBg, 7.05:1 on accentHoverBg |
| accentBorder | `#9A79EF` |  |
| accentHoverBg | `#A989FF` |  |
| focus | `#9A79EF` | 5.52:1 on bg |
| accentFocus | `#EFECFF` |  |
| shadow | `#100D19` |  |

## Layouts, shells and navigation

- app: header first; container fluid start, padding 6, section gap 6; header sticky, divider; sidebar left 264 wide sticky, divider.
- marketing: header first; container fixed 1120 center, padding 10, section gap 10, full-bleed sections; header sticky, over the hero, none; footer, divider.

Component defaults: Textarea look outline; Tag variant base, size sm, look bordered; Tabs variant default; Switch variant default, size md; MultiSelect look outline; Select look outline; Radio variant default, size md; PopoverButton look rounded ghost; Link variant default, look plain; Input look outline; NumberInput look outline; PasswordInput look outline; SearchInput look outline; FormControl variant default, size md, look outline; Dialog size md; Chip variant default, size sm, look outline rounded; ChipGroup look collapsed; Checkbox variant default, size md; Card variant default, look outline elevated; Button variant default, size md, look rounded; IconButton look rounded ghost; Avatar size md; Accordion look bordered; Collapsible look bordered; Toast status info.

Navigation: Dashboards → S04 (signedIn), Create account → S02 (public), Sign in → S03 (public).

### SH1 app

The frame of every framed app page, from the theme's app layout. Frames S04, S05.

- SH1.r1 top, 64 tall, row gap 3 padding 4 align center justify between: start: NeonBoard wordmark; center: Current dashboard name and saved status; end: Account menu
  - [Truncate] NeonBoard → S04 `SH1.n01`
  - [container · row gap 2 align center justify center] header center group `SH1.n02`
    - [Truncate] Q3 launch board (data Dashboard.name) `SH1.n03`
    - [Input outline · input] Q3 launch board (fills; data Dashboard.name) `SH1.S05.n01`
    - [Tag sm bordered · display] Saved `SH1.n04`
  - [Dropdown · container] "Account menu" `SH1.n05`
- SH1.r2 left, 264 wide, column gap 3 padding 4 align stretch justify between: top: Create button and dashboard list; bottom: Account and sign out
  - [container · column gap 3 align stretch] sidebar top group (fills) `SH1.n06`
    - [Button md rounded · primary-action] New dashboard → S05 (fills) `SH1.n07`
    - [Link plain · navigation] Dashboards → S04 (fills) `SH1.n08`
    - [Link plain · navigation] Q3 launch board → S05 (fills; data Dashboard.name) `SH1.S05.n02`
  - [container · column gap 2 align stretch] sidebar bottom group (fills) `SH1.n09`
    - [container · row gap 2 align center] account row (fills) `SH1.n10`
      - [Avatar md · display] account avatar `SH1.n11`
      - [Truncate] My account (fills) `SH1.n12`
    - [Button md rounded · secondary-action] Sign out → S01 (F04.S01) (fills) `SH1.n13`

### SH2 marketing

The frame of every framed marketing page, from the theme's marketing layout. Frames S01.

- SH2.r1 top, over the page, 64 tall, row gap 4 padding 4 align center justify between: start: NeonBoard wordmark; center: Features and widget types; end: Sign in and Create account
  - [Truncate] NeonBoard → S01 `SH2.n01`
  - [container · row gap 4 align center justify center] a row of section links `SH2.n02`
    - [Link plain] Features → S01 `SH2.n03`
    - [Link plain] Widget types → S01 `SH2.n04`
  - [container · row gap 2 align center] a row of account actions `SH2.n05`
    - [Link plain] Sign in → S03 `SH2.n06`
    - [Button sm rounded · navigation] Create account → S02 (over the defaults: Fits fixed 64px header) `SH2.n07`
- SH2.r2 bottom, content height, row gap 4 padding 6 align center justify between: start: NeonBoard wordmark; center: Private personal dashboards; end: Sign in
  - [Link plain] NeonBoard → S01 `SH2.n08`
  - [text caption] Private personal dashboards `SH2.n09`
  - [Link plain] Sign in → S03 `SH2.n10`

## S01 Landing

/ · marketing screen · shell SH2 · wide width · public · entry

Explain NeonBoard and invite visitors to sign up or sign in to create a dashboard.

States: . Serves: F01.S01, F01.S02, F02.S01, F03.S01, F01.A01. Sections: column gap 10 padding 10 align stretch.
Box S01.b1: column gap 10, fills.

### S01.sec1 NeonBoard (hero, column gap 4 padding 12 align center justify center, in S01.b1, on the brand surface)

Shows headline about building personal dashboards with notes, counters, checklists and link lists, one line of subcopy, and Sign up and Sign in actions over a faint neon grid.

- [h1 display] NeonBoard (F01.S01) `S01.n01`
- [text title] Notes, counters, checklists and link lists in one place. (F01.S01) `S01.n02`
- [container · row gap 2 align center justify center] a row of boot-up actions `S01.n03`
  - [Button md rounded · primary-action] Sign up → S02 (F01.S01, F01.S02, F02.S01) `S01.n04`
  - [Button md rounded · secondary-action] Sign in → S03 (F01.S01, F03.S01, F01.A01) `S01.n05`

### S01.sec2 Widget types strip (feature-grid, grid 4 columns gap 2 align stretch, in S01.b1)

Shows four widget-type features with icons for note, counter, checklist and link list and what each is for.

- [container · column gap 4] a note feature block (F01.S01) (fills) `S01.n06`
  - [media] "Note icon" (32 wide, 32 tall) `S01.n07`
  - [container · column gap 1] a title and description column (fills) `S01.n08`
    - [text subheading] Notes (fills) `S01.n09`
    - [text body] Jot ideas fast. Keep them ready. (fills) `S01.n10`
- [container · column gap 4] a counter feature block (F01.S01) (fills) `S01.n11`
  - [media] "Counter icon" (32 wide, 32 tall) `S01.n12`
  - [container · column gap 1] a title and description column (fills) `S01.n13`
    - [text subheading] Counters (fills) `S01.n14`
    - [text body] Count wins. Watch numbers climb. (fills) `S01.n15`
- [container · column gap 4] a checklist feature block (F01.S01) (fills) `S01.n16`
  - [media] "Checklist icon" (32 wide, 32 tall) `S01.n17`
  - [container · column gap 1] a title and description column (fills) `S01.n18`
    - [text subheading] Checklists (fills) `S01.n19`
    - [text body] List tasks. Tick them done. (fills) `S01.n20`
- [container · column gap 4] a link list feature block (F01.S01) (fills) `S01.n21`
  - [media] "Link list icon" (32 wide, 32 tall) `S01.n22`
  - [container · column gap 1] a title and description column (fills) `S01.n23`
    - [text subheading] Link lists (fills) `S01.n24`
    - [text body] Save links. Jump back in one tap. (fills) `S01.n25`

### S01.sec3 How it works band (feature-grid, grid 3 columns gap 2 padding 3 align stretch, in S01.b1, on the frame surface)

Shows console-style how-it-works steps for create a dashboard, add a widget, and autosave.

- [container · column gap 4] create dashboard step card (F01.S01) (fills) `S01.n26`
  - [text label] > step 01 (fills) `S01.n27`
  - [container · column gap 1] step title and description group (fills) `S01.n28`
    - [text body] Create a dashboard (fills) `S01.n29`
    - [text caption] Name it and hit enter. Your space is live. (fills) `S01.n30`
- [container · column gap 4] add widget step card (F01.S01) (fills) `S01.n31`
  - [text label] > step 02 (fills) `S01.n32`
  - [container · column gap 1] step title and description group (fills) `S01.n33`
    - [text body] Add a widget (fills) `S01.n34`
    - [text caption] Pick a note, counter, checklist, or link list. (fills) `S01.n35`
- [container · column gap 4] autosave step card (F01.S01) (fills) `S01.n36`
  - [text label] > step 03 (fills) `S01.n37`
  - [container · column gap 1] step title and description group (fills) `S01.n38`
    - [text body] Stay autosaved (fills) `S01.n39`
    - [text caption] Type away. Every change saves itself. (fills) `S01.n40`

### S01.sec4 Closing call to action (cta, column gap 4 padding 4 align center justify center, in S01.b1, on the accent surface)

Invites the visitor to create a dashboard with a Create account action.

- [text subheading] Boot up your dashboard in minutes. `S01.n41`
- [Button md rounded · primary-action] Create account → S02 (F01.S02, F02.S01) `S01.n42`

## S02 Sign up

/signup · app screen · shell none · narrow width · public · entry

Create a new member account and sign in.

States: empty, error. Serves: F02.S02, F02.A01, F02.A02, F02.A03. Sections: column gap 6 padding 6 align stretch.
Box S02.b1: column gap 6 align center, fills.

### S02.sec1 Create account (auth-form, column gap 4 align stretch, 400 wide, in S02.b1)

Shows email and password fields with Create account submit and a link to sign in, keeps typed values on inline errors and on failure with retry.

- [h1 title] Create account (fills; states default, empty, error) `S02.n01`
- [Input outline · input] Email (F02.S02) (fills; field FD01; states default, empty, error) `S02.n02`
- [PasswordInput outline · input] Password (F02.S02) (fills; field FD02; states default, empty, error) `S02.n03`
- [Button md rounded · primary-action] Create account → S04 (F02.S02, F02.A01, F02.A02, F02.A03) (fills; states default, empty, error) `S02.n04`
- [Link plain] Already have an account? Sign in → S03 (fills; states default, empty, error) `S02.n05`

## S03 Sign in

/signin · app screen · shell none · narrow width · public · entry

Sign an existing member in to reach dashboards.

States: empty, error. Serves: F03.S02, F03.A01, F03.A02, F03.A03. Sections: column gap 6 padding 6 align stretch.
Box S03.b1: column gap 6 align center, fills.

### S03.sec1 Sign in (auth-form, column gap 4 align stretch, 400 wide, in S03.b1)

Shows email and password fields with Sign in submit and a link to sign up, keeps typed values on inline errors and on failure with retry.

- [h1 title] Sign in (fills; states default, empty, error) `S03.n01`
- [Input outline · input] Email (F03.S02, F03.A01) (fills; field FD01; states default, empty, error) `S03.n02`
- [PasswordInput outline · input] Password (F03.S02, F03.A01) (fills; field FD02; states default, empty, error) `S03.n03`
- [Button md rounded · primary-action] Sign in → S04 (F03.S02, F03.A01, F03.A02, F03.A03) (fills; states default, empty, error) `S03.n04`
- [Link plain · navigation] New here? Sign up → S02 (fills; states default, empty, error) `S03.n05`

## S04 Dashboards

/dashboards · app screen · shell SH1 · wide width · signed in (member) · entry

List all of the member's dashboards by last edited and manage them.

States: empty, error, notFound, denied. Serves: F05.S01, F06.S01, F06.S02, F15.S01, F15.S02, F16.S01, F16.S02, F04.S01, F05.A01, F06.A01, F06.A02, F06.A03, F15.A01, F15.A02, F15.A03, F16.A01, F16.A02, F16.A03, F16.A04. Sections: column gap 6 padding 6 align stretch.
Box S04.b1: column gap 6, fills.
Frame: adds nothing; leaves out SH1.n02, SH1.n03, SH1.n04.

### S04.sec1 Dashboards (page-header, row gap 3 align center justify between, in S04.b1)

Shows the Dashboards title with dashboard count and a Create button that creates an Untitled dashboard.

- [Truncate] Dashboards (fills; states default, empty, error) `S04.n01`
- [text subheading] 3 dashboards (F06.S01, F15.S01, F16.S01) (data Dashboard.name; states default, empty, error) `S04.n02`
- [Button md rounded · primary-action] Create → S05 (F05.S01, F06.S01, F15.S01, F16.S01) (states default, empty, error) `S04.n03`

### S04.sec2 Dashboard cards (cards, column gap 6 align stretch, in S04.b1)

Shows cards for the member dashboards most-recently-edited first with name, last-edited time, open, Duplicate and Delete actions, and empty and error states with Create as next action.

- [container · grid 3 columns gap 4 align stretch] a grid of dashboard cards (F06.S01, F15.S01, F16.S01) (fills) `S04.n04`
  - [container · column gap 4 padding 4 align stretch] a dashboard card (fills) `S04.n05`
    - [Truncate] Morning focus (fills; data Dashboard.name) `S04.n06`
    - [text caption] Edited 5 min ago (fills; data Dashboard.lastEdited) `S04.n07`
    - [container · row gap 2 align center justify between wraps] a row of card actions (fills) `S04.n08`
      - [Button md rounded · navigation] Open → S05 (F06.S01, F06.S02, F06.A02, F06.A03, F15.S01, F16.S01) `S04.n09`
      - [container · row gap 2 align center justify end wraps] a row of icon actions `S04.n10`
        - [IconButton rounded ghost · secondary-action] "Duplicate dashboard" (F15.S02, F15.A02, F15.A03) `S04.n11`
        - [IconButton rounded ghost · destructive-action] "Delete dashboard" → S08 (F16.S02, F16.A02, F16.A03, F16.A04) `S04.n12`
- [container · column gap 4 padding 6 align center] a centred empty state (fills; states empty) `S04.n13`
  - [media] an empty-box icon (48 wide, 48 tall; states empty) `S04.n14`
  - [text body] No dashboards yet — create one to get going. (F06.A01, F15.A01, F16.A01) (states empty) `S04.n15`
  - [Button md rounded · primary-action] Create → S05 (F05.S01, F05.A01) (states empty) `S04.n16`
- [container · column gap 4 padding 6 align center] a centred error state (fills; states error) `S04.n17`
  - [text body] Couldn't load dashboards — create fresh to keep going. (states error) `S04.n18`
  - [Button md rounded · secondary-action] Create → S05 (F05.S01, F05.A01) (states error) `S04.n19`
- [container · column gap 4 padding 6 align center] a centred gone state (fills; states notFound) `S04.n20`
  - [text body] That dashboard is gone — pick another to keep going. (F06.A02, F15.A02, F16.A04) (states notFound) `S04.n21`
  - [Button md rounded · navigation] Back to dashboards → S04 (states notFound) `S04.n22`
- [container · column gap 2 padding 6 align center] a centred locked state (fills; states denied) `S04.n23`
  - [text body] You can't view these dashboards — sign in to keep going. (states denied) `S04.n24`

## S05 Dashboard editor

/dashboards/[dashboardId] · app screen · shell SH1 · full width · signed in (member) · entry

Use and edit one dashboard with autosave for all widget changes.

States: empty, error, notFound, denied. Serves: F05.S01, F06.S01, F06.S02, F07.S01, F08.S01, F08.S02, F08.S03, F09.S01, F09.S02, F09.S03, F10.S01, F10.S02, F10.S03, F10.S04, F11.S01, F11.S02, F11.S03, F11.S04, F12.S01, F12.S02, F12.S03, F13.S01, F13.S02, F14.S01, F14.S02, F15.S01, F16.S01, F04.S01, F05.A01, F06.A01, F06.A02, F06.A03, F08.A01, F08.A02, F08.A03, F08.A04, F08.A05, F08.A06, F08.A07, F09.A01, F09.A02, F09.A03, F09.A04, F10.A01, F10.A02, F10.A03, F10.A04, F10.A05, F10.A06, F10.A07, F11.A01, F11.A02, F11.A03, F11.A04, F11.A05, F11.A06, F11.A07, F12.A01, F12.A02, F12.A03, F12.A04, F12.A05, F13.A01, F13.A02, F13.A03, F14.A01, F14.A02, F14.A03, F15.A01, F16.A01. Sections: column gap 6 padding 6 align stretch.
Box S05.b1: column gap 6, fills.
Box S05.b2 in S05.b1: row gap 6 align stretch, fills.
Box S05.b3 in S05.b1: row gap 6 align stretch, fills.
Box S05.b4 in S05.b2: column gap 6, fills.
Box S05.b5 in S05.b2: column gap 6, fills.
Box S05.b6 in S05.b3: column gap 6, fills.
Box S05.b7 in S05.b3: column gap 6, fills.
Frame: adds SH1.S05.n01, SH1.S05.n02; leaves out SH1.n03.

### S05.sec1 Editor header (page-header, row gap 3 align center wraps, in S05.b1)

Shows inline-editable dashboard name with last-edited time and an Add widget button.

- [container · column gap 4 align stretch] the dashboard name edit group (fills; states default, empty, error) `S05.n01`
  - [Truncate] Morning focus (F05.S01, F05.A01, F06.A01, F08.S01, F09.S01, F10.S01, F11.S01, F12.S01, F13.S01, F14.S01, F15.A01, F16.A01) (fills; data Dashboard.name; states default, empty, error) `S05.n02`
  - [Input outline · input] Dashboard name (F12.S01, F13.S01, F14.S01, F14.S02, F14.A02, F14.A03) (160 wide; field FD03; data Dashboard.name; states default, error) `S05.n03`
- [Truncate] Edited 5 min ago (F06.S01, F14.S01, F15.S01, F16.S01) (96 wide; data Dashboard.lastEdited; states default, empty, error) `S05.n04`
- [Button md rounded · primary-action] Add widget → S06 (F05.S01, F07.S01) (states default, empty, error) `S05.n05`
- [Link plain · navigation] Back to dashboards → S04 (F06.S01, F15.S01, F16.S01, F14.A01) (states default, notFound) `S05.n06`
- [text body] This dashboard is gone. (F14.A01) (fills; states notFound) `S05.n07`

### S05.sec2 Widget board canvas (editor-canvas, column gap 3 padding 3 align stretch, in S05.b1)

Shows the WidgetBoard canvas with faint grid holding WidgetCards in relative order with small, medium and large sizes, move and resize controls, and empty state offering adding a widget.

- [new WidgetBoard · column gap 4 padding 3 align stretch · container] the glowing widget board canvas (F06.S02, F08.S01, F12.S01, F13.S01, F14.S01) (fills, at least 320 tall) `S05.n08`
  - [new WidgetCard · row gap 2 align center justify between wraps · container] Morning launch pad · medium (fills; data Widget.title, Widget.size) `S05.n09`
    - [IconButton rounded ghost · secondary-action] "Move widget" (F12.S02, F12.A03) `S05.n10`
    - [Select outline · input] Size (F12.S01, F12.S03, F12.A04, F12.A05, F13.S01, F14.S01) (160 wide; field FD06; data Widget.size) `S05.n11`
    - [IconButton rounded ghost · destructive-action] "Remove widget" → S07 (F13.S02, F13.A02, F13.A03) `S05.n12`
  - [container · column gap 4 padding 4 align center justify center] an empty board box (F06.A03, F08.A01, F12.A01) (fills; states empty) `S05.n13`
    - [text body] No widgets yet — add your first one! (states empty) `S05.n14`
    - [Button md rounded · primary-action] Add widget → S06 (states empty) `S05.n15`
  - [text body] Dashboard gone — jump back! (F06.A02, F08.A02, F12.A02, F13.A01, F14.A01) (states notFound) `S05.n16`
  - [Link plain · navigation] Back to dashboards → S04 (F08.A03) (states notFound, denied) `S05.n17`
  - [text body] Private board — showing yours instead! (states denied) `S05.n18`
  - [feedback body] Board failed to load — retry soon! (states error) `S05.n19`

### S05.sec3 WidgetBoard (custom, column gap 0 align stretch, in S05.b1)

Arrange a dashboard's widgets by relative order and small/medium/large size on a glowing grid.

- [new WidgetBoard · container] the WidgetBoard (fills) `S05.n20`

### S05.sec4 WidgetCard (custom, column gap 0 align stretch, in S05.b4)

Contain one widget with its title, size and position controls and its type content.

- [new WidgetCard · container] the WidgetCard (fills) `S05.n21`

### S05.sec5 Note widget body (custom, column gap 6 padding 6 align stretch, in S05.b4)

Shows a note widget body with editable title and plain note text up to 5000 characters, autosaved with validation and retry.

- [Input outline · input] Widget title (F08.S01, F08.S02, F08.A04, F08.A05) (fills; field FD05; data Widget.title; states default, error) `S05.n22`
- [Textarea outline · input] Note text (F08.S01, F08.S03, F08.A06, F08.A07) (fills; field FD07; data Widget.text; states default, error) `S05.n23`
- [container · column gap 4 padding 2 align center] centred empty state block (fills; states empty) `S05.n24`
  - [media] empty state illustration (states empty) `S05.n25`
  - [text body] No widgets yet. Add one to get started. (F08.A01) (states empty) `S05.n26`
  - [Button md rounded · primary-action] Add widget → S06 (F08.A01) (states empty) `S05.n27`
- [container · column gap 4 padding 2] not found message block (fills; states notFound) `S05.n28`
  - [text body] Dashboard gone. Pick another dashboard. (F08.A02) (fills; states notFound) `S05.n29`
  - [Link plain · navigation] Go to dashboards → S04 (F08.A02) (states notFound) `S05.n30`
- [container · column gap 4 padding 2] access denied message block (fills; states denied) `S05.n31`
  - [text body] Private dashboard. Back to your dashboards. (F08.A03) (fills; states denied) `S05.n32`
  - [Link plain · navigation] Go to dashboards → S04 (F08.A03) (states denied) `S05.n33`

### S05.sec6 WidgetCard (custom, column gap 0 align stretch, in S05.b5)

Contain one widget with its title, size and position controls and its type content.

- [new WidgetCard · container] the WidgetCard (fills) `S05.n34`

### S05.sec7 Counter widget body (custom, column gap 4 align stretch, in S05.b5)

Shows a counter widget body with editable title and label and number with Increase and Decrease controls that change by 1, autosaved with retry.

- [Input outline · input] Widget title (F09.S01, F09.S02, F09.A02) (fills; field FD05; data Widget.title; states default, error) `S05.n35`
- [container · row gap 2 align center justify between] counter row with label and number (fills; states default, error) `S05.n36`
  - [Input outline · input] Counter label (F09.S01, F09.S02) (fills; field FD08; data Widget.label; states default, error) `S05.n37`
  - [display heading] 8 (F09.S01, F09.S03) (data Widget.number; states default, error) `S05.n38`
- [container · row gap 2 align center wraps] increase and decrease controls row (fills; states default, error) `S05.n39`
  - [IconButton rounded ghost · secondary-action] "Decrease count" (F09.S01, F09.S03) (states default, error) `S05.n40`
  - [IconButton rounded ghost · primary-action] "Increase count" (F09.S01, F09.S03) (states default, error) `S05.n41`
- [Button md rounded · secondary-action] Retry (F09.A03, F09.A04) (states error) `S05.n42`
- [text body] This counter is gone. (F09.A01) (fills; states notFound) `S05.n43`
- [Link plain · navigation] Go to dashboards → S04 (F09.A01) (states notFound) `S05.n44`

### S05.sec8 WidgetCard (custom, column gap 0 align stretch, in S05.b6)

Contain one widget with its title, size and position controls and its type content.

- [new WidgetCard · container] the WidgetCard (fills) `S05.n45`

### S05.sec9 Checklist widget body (custom, column gap 4 align stretch, in S05.b6)

Shows a checklist widget body with editable title, tickable items, and an item text field with Add action, autosaved with validation and retry.

- [Input md outline · input] Widget title (F10.S01, F10.S02, F10.A03, F10.A04) (fills; field FD05; data Widget.title; states default, empty, error) `S05.n46`
- [container · column gap 2 align stretch] checklist items list (F10.S01, F10.S04) (fills; states default, error) `S05.n47`
  - [container · row gap 2 align center] one checklist item row (F10.S01, F10.S04) (fills; states default, error) `S05.n48`
    - [Checkbox md · input] unticked (F10.S01, F10.S04, F10.A07) (data ChecklistItem.ticked; states default, error) `S05.n49`
    - [Truncate] Buy milk (F10.S01) (fills; data ChecklistItem.text; states default, error) `S05.n50`
- [container · row gap 2 align end] new item add row (F10.S03) (fills; states default, empty, error) `S05.n51`
  - [Input md outline · input] Checklist item text (F10.S03, F10.A05) (fills; field FD10; states default, empty, error; over the defaults: shares one size with Add button in same row) `S05.n52`
  - [Button md rounded · primary-action] Add item (F10.S03, F10.A05, F10.A06) (states default, empty, error) `S05.n53`
- [text body] No tasks yet — add your first one below. (F10.A01) (fills; states empty) `S05.n54`
- [text body] This checklist is gone. (F10.A02) (fills; states notFound) `S05.n55`
- [Link plain · navigation] Open dashboard list → S04 (F10.A02) (states notFound) `S05.n56`

### S05.sec10 WidgetCard (custom, column gap 0 align stretch, in S05.b7)

Contain one widget with its title, size and position controls and its type content.

- [new WidgetCard · container] the WidgetCard (fills) `S05.n57`

### S05.sec11 Link list widget body (custom, column gap 4 align stretch, in S05.b7)

Shows a link list widget body with editable title, entries with titles and web addresses that open on choose, and title plus address fields with Add action, autosaved with validation and retry.

- [Input outline · input] Widget title (F11.S01, F11.S02, F11.A03, F11.A04) (fills; field FD05; data Widget.title; states default, empty, error) `S05.n58`
- [container · column gap 2 align stretch] link entries list (fills; states default, error) `S05.n59`
  - [container · row gap 2 align center justify between] one link entry row (fills; states default, error) `S05.n60`
    - [Truncate] Neon design inspiration (F11.S01) (fills; data LinkItem.title; states default, error) `S05.n61`
    - [Link plain · secondary-action] Open (F11.S01, F11.S04, F11.A07) (data LinkItem.url; states default, error) `S05.n62`
- [feedback body] No links yet — add your first one below. (F11.A01) (fills; states empty) `S05.n63`
- [Input outline · input] Link title (F11.S03, F11.A01, F11.A05, F11.A06) (fills; field FD11; data LinkItem.title; states default, empty, error) `S05.n64`
- [Input outline · input] Link web address (F11.S03, F11.A01, F11.A05, F11.A06) (fills; field FD12; data LinkItem.url; states default, empty, error) `S05.n65`
- [Button md rounded · primary-action] Add link (F11.S03, F11.A01, F11.A05, F11.A06) (states default, empty, error) `S05.n66`
- [feedback body] This dashboard or widget is gone. (F11.A02) (fills; states notFound) `S05.n67`
- [Link plain · navigation] Back to dashboards → S04 (F11.A02) (states notFound) `S05.n68`

## S06 Add widget

dialog of S05 · app screen · medium width · signed in (member)

Choose the widget type to add to the dashboard.

States: . Serves: F07.S02, F07.A01, F07.A02, F07.A03. Sections: column gap 5 align stretch.
Box S06.b1: column gap 5, fills.

### S06.sec1 Add widget dialog (form, column gap 4 align stretch, in S06.b1)

Shows selectable type options for note, counter, checklist and link list with Cancel and Add actions, marks missing type as required and offers retry on failure.

- [h2 heading] Add widget (fills) `S06.n01`
- [ChipGroup collapsed · row gap 3 wraps · input] "Widget type" (F07.S02) (fills; field FD04; data Widget.type) `S06.n02`
  - [Chip sm outline rounded · input] Note (F07.S02) `S06.n03`
  - [Chip sm outline rounded · input] Counter (F07.S02) `S06.n04`
  - [Chip sm outline rounded · input] Checklist (F07.S02) `S06.n05`
  - [Chip sm outline rounded · input] Link list (F07.S02) `S06.n06`
- [container · row gap 2 align center justify end] a row of dialog actions (fills) `S06.n07`
  - [Button md rounded · secondary-action] Cancel (F07.A03) `S06.n08`
  - [Button md rounded · primary-action] Add (F07.S02, F07.A01, F07.A02) `S06.n09`

## S07 Remove widget

dialog of S05 · app screen · narrow width · signed in (member)

Confirm permanent removal of one widget.

States: . Serves: STD01.S01, STD01.A01, STD01.A02. Sections: column gap 5 align stretch.
Box S07.b1: column gap 5, fills.

### S07.sec1 Remove widget confirm (custom, column gap 4 align stretch, in S07.b1)

Names the widget to remove, says its checklist items or links go with it, and offers Cancel and permanent Remove actions.

- [h2 heading] Remove "Morning checklist"? (STD01.S01) (fills; data Widget.title) `S07.n01`
- [text subheading] The checklist items or links in “Morning checklist” go with it for good. (STD01.S01) (fills; data Widget.title) `S07.n02`
- [container · row gap 2 align center justify end] a row of confirm actions (fills) `S07.n03`
  - [Button md rounded · secondary-action] Cancel (STD01.A02) `S07.n04`
  - [Button md rounded · destructive-action] Remove (STD01.A01) `S07.n05`

## S08 Delete dashboard

dialog of S04 · app screen · narrow width · signed in (member)

Confirm permanent deletion of one dashboard and its widgets.

States: . Serves: STD01.S01, STD01.A01, STD01.A02. Sections: column gap 5 align stretch.

### S08.sec1 Delete dashboard confirm (custom, column gap 4 align stretch)

Names the dashboard to delete, says all of its widgets go with it, and offers Cancel and permanent Delete actions.

- [container · column gap 1 align stretch] a title and description group (fills) `S08.n01`
  - [h2 heading] Delete “Launch plan”? (STD01.S01) (fills; data Dashboard.name) `S08.n02`
  - [text subheading] All widgets in “Launch plan” will be permanently deleted with it. (STD01.S01) (fills; data Dashboard.name) `S08.n03`
- [container · row gap 2 align center justify end] a row of confirm actions (fills) `S08.n04`
  - [Button md rounded · secondary-action] Cancel (STD01.A02) `S08.n05`
  - [Button md rounded · destructive-action] Delete (STD01.A01) `S08.n06`

## New components

### WidgetBoard

Arrange a dashboard's widgets by relative order and small/medium/large size on a glowing grid.

- Closest existing: CardGroup, FlexScrollArea. Why not: CardGroup has no size-aware responsive grid or faint neon backdrop, and FlexScrollArea has no ordering and sizing logic for widgets.
- Look: A full-width canvas that holds all WidgetCards in relative order on a dark base with a faint cyan grid behind them. It is low-emphasis background for focus, with soft radius, comfortable density, Inter for helper text and JetBrains Mono for timestamps, and subtle neon edge glow; like the mission-control board of a sci-fi console app.
- Width: 640 to fill. Box: fill, content, padding 4, gap 4; column gap 4 padding 4 align stretch.
  - [container] board header row `WidgetBoard.n01`
  - [text] helper text: Drag to reorder. Pick a size. `WidgetBoard.n02`
  - [text] sync timestamp: SYNC 14:32:08 `WidgetBoard.n03`
  - [shape] faint cyan grid with neon edge glow `WidgetBoard.n04`
  - [container] widget grid in relative order `WidgetBoard.n05`
  - [display] small WidgetCard example: Quick note · Small `WidgetBoard.n06`
  - [display] medium WidgetCard example: Launch checklist · Medium `WidgetBoard.n07`
  - [display] small WidgetCard example: 42 ships · Small `WidgetBoard.n08`
  - [display] large WidgetCard example: Star links · Large `WidgetBoard.n09`
  - [container] empty-state block `WidgetBoard.n10`
  - [text] empty message: No widgets yet. Add your first block. `WidgetBoard.n11`
  - [Button] add widget button: Add widget `WidgetBoard.n12`
- Used on: S05.

### WidgetCard

Contain one widget with its title, size and position controls and its type content.

- Closest existing: Card, Section. Why not: Card and Section lack inline title editing, small/medium/large variants, move and resize controls, and neon header treatment.
- Look: A bordered tile with a glowing header row holding editable title, move, resize and remove controls, and a type-specific body for note, counter, checklist or link list. It is medium-emphasis on the dark base with cyan/magenta neon border, soft radius, Space Grotesk title, Inter body and JetBrains Mono for counter figures, comfortable density; like an instrument-panel tile in a spaceship dashboard app.
- Width: 240 to fill. Box: fill, content, padding 4, gap 4; column gap 4 padding 4 align stretch.
  - [shape] a neon cyan to magenta glow strip `WidgetCard.n01`
  - [container] a header row with title and tile controls `WidgetCard.n02`
  - [IconButton] a drag handle to move tile `WidgetCard.n03`
  - [Input] an inline input to rename widget `WidgetCard.n04`
  - [IconButton] a resize control to cycle sizes `WidgetCard.n05`
  - [IconButton] a remove button to delete tile `WidgetCard.n06`
  - [container] a body stack for note counter checklist links `WidgetCard.n07`
  - [text] a short note paragraph: Top up fuel. You've got this. `WidgetCard.n08`
  - [container] a counter row with figure and label `WidgetCard.n09`
  - [text] a big mono counter figure: 42 `WidgetCard.n10`
  - [text] a small counter label: launches logged. Keep going! `WidgetCard.n11`
  - [container] a checklist stack of tasks `WidgetCard.n12`
  - [Checkbox] a ticked checklist task: Calibrate thrusters `WidgetCard.n13`
  - [Checkbox] an unticked checklist task: Plot return course `WidgetCard.n14`
  - [container] a link list stack `WidgetCard.n15`
  - [Link] a neon link to flight manual: Flight manual `WidgetCard.n16`
- Used on: S05.

## Questions

- Q01 Should a counter widget's number have a minimum, maximum, or step other than changing by 1 with no limits? Default: The counter has no minimum or maximum and can be decreased below zero, changing by 1 each time.

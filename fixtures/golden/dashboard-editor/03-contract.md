# NeonBoard: contract

The records the app keeps, the operations its widgets call, and what covers each widget. Every record also has id, createdAt, updatedAt. Sign up, sign in and sign out are built in.

## Entities

### Dashboard

Implements Dashboard.

| Field | Kind | Required |
| ----- | ---- | -------- |
| name | string | yes |
| lastEdited | datetime | no |

### Widget

Implements Widget.

| Field | Kind | Required |
| ----- | ---- | -------- |
| title | string | yes |
| type | enum WidgetType | yes |
| size | enum WidgetSize | yes |
| text | text | no |
| label | string | no |
| number | int | no |
| dashboard | ref Dashboard | yes |

### ChecklistItem

Implements ChecklistItem.

| Field | Kind | Required |
| ----- | ---- | -------- |
| text | string | yes |
| ticked | boolean | yes |
| widget | ref Widget | yes |

### LinkItem

Implements LinkItem.

| Field | Kind | Required |
| ----- | ---- | -------- |
| title | string | yes |
| url | url | yes |
| widget | ref Widget | yes |

## Enums

- WidgetType: note (`note`), counter (`counter`), checklist (`checklist`), link list (`link_list`)
- WidgetSize: small (`small`), medium (`medium`), large (`large`)

## Operations

| Operation | Kind | Entity | Summary | Inputs | Serves |
| --------- | ---- | ------ | ------- | ------ | ------ |
| listDashboards | list | Dashboard | List my dashboards most recently edited first | none | F02.S02, F03.S02, F06.S01, F15.S01, F16.S01 |
| getDashboard | get | Dashboard | Read one dashboard | none | F06.S02, F08.S01, F09.S01, F10.S01, F11.S01, F12.S01, F13.S01, F14.S01 |
| createDashboard | create | Dashboard | Create a dashboard | none | F05.S01, F15.S02 |
| updateDashboard | update | Dashboard | Rename a dashboard and update last-edited time | FD03 Dashboard name as name | F07.S02, F08.S02, F08.S03, F14.S02 |
| deleteDashboard | delete | Dashboard | Delete a dashboard | none | F16.S02 |
| listWidgets | list | Widget | List widgets of a dashboard in order | none | F06.S02, F08.S01, F12.S01 |
| getWidget | get | Widget | Read one widget | none | F09.S01, F10.S01, F11.S01, F13.S01 |
| createWidget | create | Widget | Add a widget of chosen type | FD04 Widget type as type | F07.S02, F15.S02 |
| updateWidget | update | Widget | Update widget title, content, position and size | FD05 Widget title as title, FD07 Note text as text, FD08 Counter label as label, FD06 Widget size as size | F08.S02, F08.S03, F09.S02, F09.S03, F10.S02, F11.S02, F12.S02, F12.S03 |
| deleteWidget | delete | Widget | Remove a widget | none | F13.S02, F16.S02 |
| listChecklistItems | list | ChecklistItem | List items of a checklist widget | none | F10.S01 |
| createChecklistItem | create | ChecklistItem | Add a checklist item | FD10 Checklist item text as text | F10.S03, F15.S02 |
| updateChecklistItem | update | ChecklistItem | Tick or untick a checklist item | none | F10.S04 |
| deleteChecklistItem | delete | ChecklistItem | Delete checklist items with widget | none | F13.S02, F16.S02 |
| listLinkItems | list | LinkItem | List entries of a link list widget | none | F11.S01 |
| createLinkItem | create | LinkItem | Add a link entry | FD11 Link title as title, FD12 Link web address as url | F11.S03, F15.S02 |
| getLinkItem | get | LinkItem | Read one link entry | none | F11.S04 |
| deleteLinkItem | delete | LinkItem | Delete link entries with widget | none | F13.S02, F16.S02 |

## Widgets

### W01 Landing hero (hero)

- Opens other screens or shows fixed content; it calls nothing.

### W02 Widget types strip (feature-grid)

- Opens other screens or shows fixed content; it calls nothing.

### W03 How it works band (feature-grid)

- Opens other screens or shows fixed content; it calls nothing.

### W04 Closing call to action (cta)

- Opens other screens or shows fixed content; it calls nothing.

### W05 Sign up form (auth-form)

- Asks for FD01 Email, which goes to the built-in sign up.
- Asks for FD02 Password, which goes to the built-in sign up.
- At F02.S02, lists Dashboard: listDashboards.

### W06 Sign in form (auth-form)

- Asks for FD01 Email, which goes to the built-in sign in.
- Asks for FD02 Password, which goes to the built-in sign in.
- At F03.S02, lists Dashboard: listDashboards.

### W07 Dashboards header (page-header)

- Shows Dashboard (Dashboard.name), loaded by listDashboards.
- At F05.S01, creates Dashboard: createDashboard.
- At F06.S01, lists Dashboard: listDashboards.
- At F15.S01, lists Dashboard: listDashboards.
- At F16.S01, lists Dashboard: listDashboards.

### W08 Dashboard cards (cards)

- Shows a list of Dashboard (Dashboard.name, Dashboard.lastEdited), loaded by listDashboards.
- At F05.S01, creates Dashboard: createDashboard.
- At F06.S01, lists Dashboard: listDashboards.
- At F06.S02, reads Dashboard and lists Widget: getDashboard, listWidgets.
- At F15.S01, lists Dashboard: listDashboards.
- At F15.S02, creates Dashboard and creates Widget and creates ChecklistItem and creates LinkItem: createDashboard, createWidget, createChecklistItem, createLinkItem.
- At F16.S01, lists Dashboard: listDashboards.
- At F16.S02, deletes Dashboard and deletes Widget and deletes ChecklistItem and deletes LinkItem: deleteDashboard, deleteWidget, deleteChecklistItem, deleteLinkItem.

### W09 Editor header (page-header)

- Shows Dashboard (Dashboard.name, Dashboard.lastEdited), loaded by getDashboard.
- Asks for FD03 Dashboard name, which goes to updateDashboard.
- At F05.S01, creates Dashboard: createDashboard.
- At F06.S01, lists Dashboard: listDashboards.
- At F08.S01, reads Dashboard and lists Widget: getDashboard, listWidgets.
- At F09.S01, reads Dashboard and reads Widget: getDashboard, getWidget.
- At F10.S01, reads Dashboard and reads Widget and lists ChecklistItem: getDashboard, getWidget, listChecklistItems.
- At F11.S01, reads Dashboard and reads Widget and lists LinkItem: getDashboard, getWidget, listLinkItems.
- At F12.S01, reads Dashboard and lists Widget: getDashboard, listWidgets.
- At F13.S01, reads Dashboard and reads Widget: getDashboard, getWidget.
- At F14.S01, reads Dashboard: getDashboard.
- At F14.S02, updates Dashboard: updateDashboard.
- At F15.S01, lists Dashboard: listDashboards.
- At F16.S01, lists Dashboard: listDashboards.

### W10 Widget board canvas (editor-canvas)

- Shows a list of Widget (Widget.title, Widget.size), loaded by listWidgets.
- Asks for FD06 Widget size, which goes to updateWidget.
- At F06.S02, reads Dashboard and lists Widget: getDashboard, listWidgets.
- At F08.S01, reads Dashboard and lists Widget: getDashboard, listWidgets.
- At F12.S01, reads Dashboard and lists Widget: getDashboard, listWidgets.
- At F12.S02, updates Widget: updateWidget.
- At F12.S03, updates Widget: updateWidget.
- At F13.S01, reads Dashboard and reads Widget: getDashboard, getWidget.
- At F13.S02, deletes Widget and deletes ChecklistItem and deletes LinkItem: deleteWidget, deleteChecklistItem, deleteLinkItem.
- At F14.S01, reads Dashboard: getDashboard.

### W11 Note widget body (custom)

- Shows Widget (Widget.title, Widget.text), loaded by listWidgets.
- Asks for FD05 Widget title, which goes to updateWidget.
- Asks for FD07 Note text, which goes to updateWidget.
- At F08.S01, reads Dashboard and lists Widget: getDashboard, listWidgets.
- At F08.S02, updates Widget and updates Dashboard: updateDashboard, updateWidget.
- At F08.S03, updates Widget and updates Dashboard: updateDashboard, updateWidget.

### W12 Counter widget body (custom)

- Shows Widget (Widget.title, Widget.label, Widget.number), loaded by getWidget.
- Asks for FD05 Widget title, which goes to updateWidget.
- Asks for FD08 Counter label, which goes to updateWidget.
- At F09.S01, reads Dashboard and reads Widget: getDashboard, getWidget.
- At F09.S02, updates Widget: updateWidget.
- At F09.S03, updates Widget: updateWidget.

### W13 Checklist widget body (custom)

- Shows a list of ChecklistItem (ChecklistItem.text, ChecklistItem.ticked), loaded by listChecklistItems.
- Shows Widget (Widget.title), loaded by getWidget.
- Asks for FD05 Widget title, which goes to updateWidget.
- Asks for FD10 Checklist item text, which goes to createChecklistItem.
- At F10.S01, reads Dashboard and reads Widget and lists ChecklistItem: getDashboard, getWidget, listChecklistItems.
- At F10.S02, updates Widget: updateWidget.
- At F10.S03, creates ChecklistItem: createChecklistItem.
- At F10.S04, updates ChecklistItem: updateChecklistItem.

### W14 Link list widget body (custom)

- Shows a list of LinkItem (LinkItem.title, LinkItem.url), loaded by listLinkItems.
- Shows Widget (Widget.title), loaded by getWidget.
- Asks for FD05 Widget title, which goes to updateWidget.
- Asks for FD11 Link title, which goes to createLinkItem.
- Asks for FD12 Link web address, which goes to createLinkItem.
- At F11.S01, reads Dashboard and reads Widget and lists LinkItem: getDashboard, getWidget, listLinkItems.
- At F11.S02, updates Widget: updateWidget.
- At F11.S03, creates LinkItem: createLinkItem.
- At F11.S04, reads LinkItem: getLinkItem.

### W15 Add widget dialog (form)

- Shows Widget (Widget.type), typed in by the user and saved by createWidget.
- Asks for FD04 Widget type, which goes to createWidget.
- At F07.S02, creates Widget and updates Dashboard: updateDashboard, createWidget.

### W16 Remove widget confirm (custom)

- Shows Widget (Widget.title), loaded by getWidget.
- Part of STD01, which runs for F13.S02 (deleteWidget, deleteChecklistItem, deleteLinkItem), F16.S02 (deleteDashboard, deleteWidget, deleteChecklistItem, deleteLinkItem).

### W17 Delete dashboard confirm (custom)

- Shows Dashboard (Dashboard.name), loaded by listDashboards.
- Part of STD01, which runs for F13.S02 (deleteWidget, deleteChecklistItem, deleteLinkItem), F16.S02 (deleteDashboard, deleteWidget, deleteChecklistItem, deleteLinkItem).

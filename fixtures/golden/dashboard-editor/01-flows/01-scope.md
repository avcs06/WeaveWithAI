# NeonBoard: scope

NeonBoard is for individuals who want a personal dashboard that gathers notes, counters, checklists, and useful links in one place. A member creates a dashboard, lands directly in its editor, adds and configures widgets, and arranges them by position and size. Every change is saved automatically, and all of the member's dashboards are listed by when they were last edited.

Audience: Individuals who want to build and use their own personal dashboards.

## Roles
- Member (member, signs in): A person who signs in to create, edit, arrange, and revisit their own personal dashboards and widgets.

## Vocabulary
- Dashboard (owned by Member): One personal dashboard owned by a member, containing an ordered set of widgets.
- Widget (owned by Member): One block on a dashboard. Its type is note, counter, checklist, or link list, and it has a title, a relative position, a size of small, medium, or large, and settings for its type: plain text for a note, a number and label for a counter, checklist items for a checklist, and titles with web addresses for a link list.
- ChecklistItem (owned by Member): One item inside a checklist widget, with text and a ticked or unticked state.
- LinkItem (owned by Member): One entry inside a link list widget, with a title and a web address.

## Capabilities
- accounts: Email and password sign up, sign in, and sign out, so a member's saved dashboards are protected and available after a refresh.
- userOwnedData: Each member sees and can change only their own dashboards and the widgets inside them.
- crud: Create, view, edit, rename, duplicate, and delete dashboards; add, configure, rename, resize, and remove widgets; add and edit checklist items and links.
- reorder: Members can change a widget's position relative to the other widgets on the same dashboard.
- publicPages: A public landing page explains NeonBoard and invites visitors to sign up or sign in; dashboards themselves are not public.
- datesDeadlines: Each dashboard records and displays when it was last edited; there are no deadlines.
- roles: One signed-in member role is enough; there are no other roles.

## In scope
- A public landing page that says NeonBoard is for building personal dashboards with notes, counters, checklists, and link lists, and invites the visitor to sign up or sign in to create a dashboard.
- A member can click Create to start a new dashboard and land directly in its editor.
- In the editor, a member can add a note widget with plain text, a counter widget with a number and a label that they can increase or decrease, a checklist widget with items they can tick off and add to, and a link list widget with titles and web addresses.
- After adding a widget, a member can configure its title and the settings for its type: the note text, the counter label and number, the checklist items, or the link titles and web addresses. Links can be opened from the widget.
- A member can rename a widget, change its position relative to the other widgets, resize it between small, medium, and large, and remove it.
- Dashboards have a name and can be renamed, duplicated, and deleted. Deleting a dashboard also deletes all of its widgets.
- A list shows all of a member's dashboards with when each was last edited; a member with no dashboards is offered Create as the next action, and an empty dashboard offers adding a widget as the next action.
- The editor saves changes automatically, so work is still there after a refresh and no manual save step is needed.
- Dashboards are private: a member sees only their own dashboards, and there are no shared or public dashboards.
- The interface uses a dark, glowing, futuristic screen-like look with neon-lit controls and figures and a faint grid behind the widgets, while keeping every widget easy to read and use.

## Assumptions
- A01 (behavior, affects firstSuccess, businessRules): A signed-in member is required before creating a dashboard because dashboards are personal, automatically saved, and shown again after a refresh. First success takes five steps: open the landing page, choose to sign up, submit email and password, click Create, and choose a widget type; the new widget then appears saved in the editor. The only required inputs before that first success are email and password.
- A02 (behavior, affects data, businessRules): Clicking Create makes a dashboard with the default name 'Untitled dashboard' and opens its editor immediately; the member can rename it later, so naming is not required before first success.
- A03 (behavior, affects data, businessRules): Adding a widget creates it with a default title based on its type and sensible empty or zero settings, so it is visible and saved before the member configures it. A widget's default size is medium.
- A04 (behavior, affects businessRules): Widget position is a single relative order among the widgets on one dashboard. Moving a widget changes that order, and removing a widget leaves the remaining widgets in their existing relative order. How the ordered widgets are laid out on screen is left to design.
- A05 (behavior, affects businessRules, data): A counter starts at 0 and each increase or decrease changes its number by 1. Checklist items start unticked, and ticking can be undone by unticking. Checklist item text is required to add an item; a link requires both a title and a web address.
- A06 (behavior, affects businessRules): Duplicating a dashboard copies all of its widgets, titles, type settings, relative positions, and sizes into a new dashboard named with ' copy' added to the original name. Deleting a dashboard permanently deletes that dashboard and all of its widgets; deleting a widget permanently removes only that widget. There is no recovery after deletion.
- A07 (behavior, affects businessRules, data): Last edited is updated whenever the dashboard or any of its widgets, checklist items, counters, or links change, including renaming, reordering, and resizing; merely opening a dashboard does not update it. The editor is also the usable dashboard, so there is no separate view-only mode.

## Questions
- Q01: Should a counter widget's number have a minimum, maximum, or step other than changing by 1 with no limits? Why: The answer changes the counter widget's business rules and what values a member can save. Default: The counter has no minimum or maximum and can be decreased below zero, changing by 1 each time.

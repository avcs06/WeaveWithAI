<!-- Placeholders: density, sectionKinds, copyKinds, sideWidth, dsProse, newComponentBudget. The user message (prompt-ia-input.md) carries 01-scope.json, 01-flows.json, 02-brief.json and the theme's two page layouts. -->

You are the product designer of the app described in the scope, flows and brief below. The brief set its look and the theme framed its pages; now design its information architecture as JSON that matches the schema: the screens and the navigation, the copy deck, the widgets every screen is made of and where each is placed, and the new components the design system lacks. Later calls design each new component, build each widget once and fill each frame, and code assembles the screens from your plan. Nobody revisits it, so decide here what every screen holds, says and shows. You decide structure and words, not boxes.

## Screens

- A screen is a page (with a Next.js route such as `/projects/[projectId]`), a dialog or a drawer (route "", `parent` the page that opens it). IDs: S01, S02, ...
- `kind`: `app` for the task screens of the app, sign in included, built from the design system; `marketing` for public content such as a landing or pricing page, composed visually with a component only where it fits.
- `framed`: true puts a page in its kind's layout below, with that layout's header, sidebars and footer; false gives it no frame, as for sign in. Dialogs and drawers are never framed. A framed page's layout must have a header, a sidebar or a footer.
- `contentWidth`: a page's column inside its layout's container, which it can narrow but never widen: narrow (640) for a form, medium (960) for reading, wide (1280) for a table, full for the whole container. For a dialog or drawer it is its size: narrow small, medium medium, wide and full large.
- `arrangement`: `column` stacks the screen's widgets in reading order; `main-side` puts one main widget beside one side panel {{sideWidth}} wide, such as a record with its context, and places exactly those two.
- `title`: the copy id of the page's title, which its level-1 heading shows; "" when that heading shows a record's own value, such as a book's title, and for a dialog or drawer, whose name is its title.
- `access` (public or signedIn), the `roles` that use it, a `purpose`, and the `states` it shows besides default (loading, empty, error, success, invalid, submitting, denied, notFound, as they apply); its widgets show them.
- `entry`: true for the pages a user can start from: the landing page, home, sign in. Every other page is reached from one of them through the navigation or a control in a widget, and every dialog or drawer is opened by a control on its parent page; say which control in that widget's `content`.
- Access goes both ways. A screen serving a flow of a signed-in role, other than signing up or signing in, is signedIn. A screen whose flows all happen signed out (signing up, signing in, or a role that never signs in) is public.
- Use as few screens as the flows allow. A short create or edit form, up to about 6 fields, can be a dialog; a longer one is a page.

## Navigation

- List the top-level destinations as navigation items, as few as the flows allow for {{density}} density. An item points at a page with a title, and its `label` is that title's copy id, so the item and the page's H1 read the same. An item to a signedIn page is signedIn.
- The layouts draw them: signed-in items in the part of the app layout that holds the navigation, public items in the marketing layout's header. Only list items a layout below has a place for.

## The copy deck

- `copy` holds every string a user reads, once: page titles, headings, text, actions, navigation, field labels, placeholders, empty, error and success lines, and the accessible names of controls without visible text. IDs C001, C002, ...; `kind` is one of: {{copyKinds}}.
- One string, one id. The same action has the same words on every screen, such as Delete book on the book page and in its confirmation, so it is one entry that every widget showing it names. No text is in the deck twice.
- Write it in the brief's voice and name things with the scope's vocabulary. An action starts with a verb and says what it does in at most three words ("Create project"); a heading has at most eight words. No placeholder copy.
- A record's own values, such as a book's title or a price, are data, not copy: a widget shows them through `data`. A sentence around a value names it as a slot: "Delete “{Book.title}”?".

## Widgets

A widget is one block of a screen with one purpose: a page header, a filter bar, a table, a form, an empty state, a side panel, a hero. A part shown on several screens, such as a filter bar on two lists, is one widget placed on each, so it is built once and reads the same. IDs: W01, W02, ...

- `kind`: one of the section kinds below. `name`, `purpose`, and `content`: what it shows and what users can do there, in one or two sentences a designer can build from without the flows, naming each control and what it opens.
- `title`: the copy id of its top heading; "" when it has no heading or its heading shows a record's value.
- `copy`: the copy ids of every string it shows, its title included. The widget's builder shows each one and adds none the deck has.
- `flowSteps`: the steps and alternatives it serves. `fields`: the field ids it takes input for. A widget serving a user step with fields takes every one of them, its form's included (a step's `form` lists more fields in `forms`).
- `data`: the values it shows, as Noun.attribute with the scope's nouns (Project.name).
- `states`: the states it shows besides default, exactly these. A widget showing a list shows loading and error, and empty unless an empty state widget beside it does; a form serving a submission shows invalid, submitting, error and success, unless its submit opens another screen; a widget showing a record reached by its id shows notFound, with a way back.
- `repeat`: the noun whose records its items repeat over, such as Book for a list of books; "" otherwise.
- `newComponents`: the declared new components it uses.
- Keep a widget to about 7 controls and at most 12 inputs; split a longer form.
- A hero has one heading, at most one line of text and at most two actions, and a screen has at most one. Use one only where it helps users understand or act: a landing page, an empty first-use state.

Section kinds:

{{sectionKinds}}

## Placements

Each placement puts a widget on a screen; together they compose it.

- `id`: S04.sec1, S04.sec2, ... on screen S04, with `order` 1, 2, ... in reading order. At most 8 on a page; every screen places at least one widget and every widget is placed.
- `area`: main, or side for the side panel of a main-side screen. A column screen places in main only.
- `surface`: the widget's background: page for most. On a marketing page, frame, brand (the brand's subtle color) or accent (its filled color) set a band apart, such as a tinted hero or a filled call to action; an app screen stays on the page.
- `headingLevel`: the level of the widget's top heading, 1 to 3, or 0 when it has none. A page places exactly one widget at level 1: the one whose title is the page's, or whose heading shows the record the page is about. In reading order a level is at most one below the deepest before it, as 1, 2, 2, 3. A widget keeps one level wherever it is placed; when another screen needs another level, make a second widget. A dialog's or drawer's name is its title, so its widgets have no level-1 heading.
- Each state a screen lists is one of its widgets' states. A screen serving a list shows loading, empty and error; one serving a submission shows invalid, submitting and error.
- Every step and alternative in the flows is served by a widget, and every field of a user step is taken by a widget serving the step. Every app screen serves at least one step.

## Components: the design system first

These components exist and are accessible, keyboard-ready and tested:

{{dsProse}}

On app screens the widgets build from them wherever they fit. When a widget needs something none of them can do, declare a new component in `newComponents`, at most {{newComponentBudget}}: a PascalCase name that is not a design-system name, its purpose, the closest design-system components you considered (`closestExisting`), and why they don't fit (`whyNotExisting`). A later call designs it in full. Every declared component is used by a widget, which lists it in its `newComponents`.

## Report what doesn't work

If a flow step is unclear or can't be designed as written, add a question with your default answer, or an `impossibleSteps` entry naming the step and the reason. Never change behavior silently.

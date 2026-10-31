<!-- The node guide the widget and frame prompts share; prompt-screens.ts fills it and puts it in as {{nodeGuide}}. Placeholders: voice, density, headingSizes. -->

## Each node

- `what`: what it is in a short phrase an engineer maps to a component: "a password input", "a primary button", "the page title", "a row of filter chips". The engineer builds from this phrase.
- `component`: the closest design-system component, or none for a new component, text, a heading, an image or a layout box. An action, a navigation or an input is always a design-system component or a declared new component.
- `size` and `look`: leave both "" so the theme's defaults apply; the whole app follows them. Set one only when this node must differ, to one of the component's sizes or looks, or base for the design system's plain look, and say why in `overrideReason`, such as "navigation in the top bar reads as a link". Both stay "" when `component` is none.
- `newComponent`: the name of a declared new component this node is, or "".
- `box`: width fill, content or fixed (with `widthPx`); height content for a design-system component, whose height the design system sets; `minHeightPx`; `span`, the columns it spans in a grid parent, 1 otherwise.
- `layout`: for a node with children: `direction`, `gap` and `padding` as spacing token keys where 4 means 16px, `columns` 1 to 4 for a grid and 0 otherwise, `align`, `justify` and `wrap`. null for a leaf.
- `headingLevel`: 1 to 4 for a heading, 0 otherwise. A heading's type size comes from its level, {{headingSizes}}; give it that `typeScale`.
- `typeScale` for text: smaller than the heading above it, and the text right under a heading one or two steps smaller than the heading; body for text, label and caption for small print; none for anything that is not text.
- `text`: the copy id of its visible text, and `label` the copy id of the accessible name of a control without visible text, such as an icon button or an input with no visible label, or with ambiguous text. Both name ids, never the words themselves. A control has a text or a label.
- `sample`: a realistic value for a node that shows a record's value, or for the {Noun.attribute} slot in its copy: "The Left Hand of Darkness", "12 books"; "" otherwise.
- `role`: what it does for the user. At most one primary-action in a widget. A destructive action uses the design system's danger variant and asks first, in a dialog that names what is destroyed in one sentence and offers two buttons.
- `field`: for an input, the flow field it edits.
- `data`: the values it shows, as Noun.attribute in the scope's vocabulary (Project.name).
- `flowSteps`: the steps and alternatives it serves. A user step sits on the control the user acts with: an action, a navigation or an input.
- `states`: when it shows; ["default"] if always.
- `navigatesTo`: the screen an action or a navigation opens, or "". A navigation always opens a screen, unless its component changes the view in place (Tab, Tabs, Pagination, Accordion, Collapsible). A dialog or drawer is opened by a node on its parent page.
- The copy is in this voice: {{voice}}.

## Composition

Density is {{density}}.

- On an app screen, build from the design system: a control, a field, a table, a dialog is its component. On a marketing page, compose from headings, text, images and layout boxes, and use a component only where it fits, mainly the interactive ones. Never use a component only because it exists.
- Gaps shrink with depth: blocks inside a widget closer than the widgets on the page, items inside a block closer still. Field to field 16 (4), group of fields to group 24 (6); buttons side by side 8 (2), and a danger button beside the primary further apart; an icon and its text 4 to 10; a title and its description 4, then 12 to 16 to the content; paragraphs 8 to 12. A box never pads less than the gap inside it, and a heading sits closer to what follows than to what precedes it.
- A Card is one of a set, in a list or cards widget; never a card around a form or a single block. A bordered box (Card, Section, Accordion, Popover) never sits inside another, or inside a dialog.
- The rows of a list share a height, 0 to 12 apart as rows or 8 to 16 apart as cards; a row ends in at most three icon buttons. A grid leaves no single item alone in its last row, and its images share one ratio.
- Buttons, fields and chips in one row share a size. Related fields share a row, such as first and last name or city and postcode, at most three to a row; unrelated ones don't. Keep about 7 controls to a widget, and split a form of more than 12 fields.
- A column keeps one left edge, and a ghost button's text lines up with it; a centred block centres whole blocks, with its text sized to its content. Reading text stays under 720 wide. A field is at least 160 wide, a card at least 240. Nothing is wider than the page.
- Leave every control room for its focus ring: at least 6 between it and its neighbours.
- A page's primary action sits at the end of its page header. On an entry page the title and the primary action fit in the first 800px, and a hero is never taller than that.
- An empty state is one icon or illustration, one sentence and one action, centred. A message shown only while loading, submitting or failing comes last in its group, or the node it reports on shows it in place.
- A button says at most three words; a heading at most eight.

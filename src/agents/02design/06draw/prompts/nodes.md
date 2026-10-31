<!-- The node guide the draw, invent and frame prompts share; each prompts/index.ts fills it and puts it in as {{nodeGuide}}. Placeholders: voice, density, headingSizes. -->

## Each node

- `what`: what the node is, in a short phrase an engineer maps to a component, such as "a password input", "a primary button", "the page title" or "a row of filter chips". The engineer builds from this phrase.
- `component`: the closest design-system component.
  - Use none for a new component, text, a heading, an image or a layout box.
  - An action, a navigation or an input is always a design-system component or a declared new component.
- `size` and `look`: "" for both, so the theme's defaults apply. The whole app follows these defaults.
  - Set one only when this node must differ. Set it to one of the component's sizes or looks, or to base for the design system's plain look.
  - When you set one, say why in `overrideReason`, such as "navigation in the top bar reads as a link".
  - Both stay "" when `component` is none.
- `newComponent`: the name of the declared new component this node is. "" otherwise.
- `box`: the node's size in its parent.
  - `width`: fill, content or fixed. A fixed width gives its px in `widthPx`.
  - `height`: content for a design-system component. The design system sets its height.
  - `minHeightPx`: its minimum height.
  - `span`: the columns it spans in a grid parent. 1 otherwise.
- `layout`: how a node with children arranges them. null for a leaf.
  - `direction`: row, column or grid.
  - `gap` and `padding`: spacing token keys, where 4 means 16px.
  - `columns`: 1 to 4 for a grid. 0 otherwise.
  - `align`: where the children sit across the direction.
  - `justify`: where the children sit along the direction.
  - `wrap`: true for a row that wraps when its children do not fit.
- `headingLevel`: the level of a heading.
  - 1 for the top heading. It takes the level of each instance that places the widget.
  - 2 for a heading under it, and so on.
  - 0 for anything that is not a heading.
  - A heading's type size comes from its level: {{headingSizes}}. Code sets it from the instance.
- `typeScale`: the type size of text.
  - body for text. label and caption for small print.
  - none for anything that is not text.
  - Text is smaller than the heading above it.
  - The text right under a heading is one or two steps smaller than the heading.
- `text`: the words the node shows, such as "Add book". They are the same on every instance.
  - A control serving a step says the same words everywhere that step is served.
  - One action keeps one word, such as Save on every form, not Save on one form and Submit on another.
- `label`: the accessible name of a control without visible text, such as an icon button or an input with no visible label. Give one also to a control with ambiguous text.
  - Every control has a `text` or a `label`.
- `slot`: the slot the node stands for. "" otherwise.
  - A node whose words differ by instance names the words slot it shows, such as `title`. Its `text` is "".
  - A container that holds other widgets names its parts slot.
- `sample`: the whole line as it shows, with realistic values, such as "Remove “Dune” for good?" or "9:30 AM · Design review with Maya Shah".
  - Give one for a node that shows a record's value, or whose words hold a {Noun.attribute}.
  - "" when the node shows only fixed words.
- `role`: what the node does for the user.
  - A widget has at most one primary-action.
  - A visual that no component can show, such as a progress ring or a timeline bar, has role shape. Its `what` says what it draws. Its box is fixed or fill in both directions.
  - A destructive action uses the design system's danger variant. It asks first, in a dialog. That dialog names what is destroyed in one sentence and offers two buttons.
- `field`: for an input, the flow field it edits.
- `data`: the values it shows, as Noun.attribute in the scope's vocabulary, such as Project.name.
- `flowSteps`: the ids of the steps and alternatives it serves.
  - A user step sits on the control the user acts with: an action, a navigation or an input.
- `states`: the states in which the node shows. ["default"] if it always shows.
- `navigatesTo`: the screen an action or a navigation opens. "" otherwise.
  - A navigation always opens a screen. The exception is a navigation whose component changes the view in place: Tab, Tabs, Pagination, Accordion or Collapsible.
  - A node on the parent page opens each dialog or drawer.

Write every word in this voice: {{voice}}.

## Composition

The density is {{density}}.

### Components

- On an app screen, build from the design system. Each control, field, table and dialog is a design-system component.
- On a marketing page, compose from headings, text, images and layout boxes. Use a component only where it fits, mainly the interactive ones.
- Never use a component only because it exists.
- A landing page sells the app, so make it rich. Give it headlines, supporting words, images and sections that show what the app does. Keep it simple only when the brief's tone asks for simplicity.

### Gaps

Code sets the gap of each column in a widget or a new component, whatever you write. You choose what each column holds:
- A title and its description: 4px. Put them in a column of their own.
- A header and its content, and content to content, such as field to field: 16px.
- Groups to groups: 24px, in a column that holds two or more groups. A group is a column of two or more nodes, such as one part of a form.
- So a column holds a header and one node, or content, or groups. To put a header above two or more groups, put the groups in a column of their own under the header.
- A list's repeated rows or cards and a column of paragraphs keep the gap you give them.

You set every other gap:
- Buttons side by side: 8px, spacing token key 2. A danger button sits further from the primary button beside it.
- An icon and its text: 4 to 10px.
- Paragraphs: 8 to 12px apart.
- A box pads at least as much as the gap inside it.
- A heading sits closer to what follows it than to what precedes it.

### Cards and bordered boxes

- A Card is one of a set, in a list or cards widget. Never put a card around a form or a single block.
- A large option with a description is a Card in a CardGroup. The CardGroup is the input, with the `field`.
- A short choice is a Radio, a Chip or a Checkbox.
- A bordered box is a Card, Section, Accordion or Popover. A bordered box never sits inside another bordered box, or inside a dialog.

### Lists, rows and grids

- The items of a list are one item repeated. Rows sit 0 to 12px apart. Cards sit 8 to 16px apart.
- Cards side by side sit in a row or grid with `align` stretch, so each line shares one height.
- A row ends in at most 3 icon buttons.
- A grid leaves no single item alone in its last row.
- The images of a grid share one ratio.
- Text that must stay on one line is a Truncate: one line that ends in an ellipsis. Examples are the wordmark in a header of fixed height and a table cell.

### Controls and fields

- Buttons, fields and chips in one row share a size.
- Related fields share a row, such as first and last name, or city and postcode. Put at most 3 fields in a row.
- Put unrelated fields in separate rows.
- A widget has at most 7 controls.
- Split a form of more than 12 fields.
- Leave every control room for its focus ring: at least 6px between it and its neighbours.

### Widths and alignment

- A column keeps one left edge. A ghost button's text lines up with that edge.
- A centred block centres whole blocks, with its text sized to its content.
- Reading text stays under 720px wide.
- A field is at least 160px wide. A card is at least 240px wide.
- Everything fits within the width of the page.

### Pages

- A page's primary action sits at the end of its page header.
- On an entry page, the title and the primary action fit in the first 800px.
- A hero is at most 800px tall.

### States and messages

- An empty state is one icon or illustration, one sentence and one action, centred.
- A message shown only on failure comes last in its group. Or the node it reports on shows it in place.
- The design system shows loading, a field's error and a submit's progress itself. A form's result is a toast. So draw no node for any of them.
- Put the steps of a failed or denied submit on its submit button. Its toast reports them.

### Words

- A button says at most 3 words.
- A heading says at most 8 words.

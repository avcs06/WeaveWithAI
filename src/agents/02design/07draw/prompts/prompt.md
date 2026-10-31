<!-- Placeholders: widgetIds, sideWidth, nodeGuide, dsProse. The user message (prompt-widgets-input.md) carries each widget's definition and placements, the copy deck, the screens, the flow steps served with their fields, the new components the widgets use, the vocabulary and the look. -->

You are the product designer of the app in the input. Its information architecture fixed every screen, the copy deck and the widgets each screen is made of; now build widgets {{widgetIds}}, as JSON that matches the schema: one entry in `widgets` for each, in the order given. Code places each widget on its screens as the IA planned, so build exactly what its definition says, and nothing else.

## Each widget

- `widget`: its id.
- `edge`: what its outer edge is, for the engineer: `bordered`, a box with a border, such as a side panel or a group set apart; `surface`, a tinted background with no border; `text`, no box, its content straight on the page, as a page header, a toolbar or a form usually is; `band`, a full-width band, as a hero or a call to action on a marketing page.
- `layout`: how its top-level nodes are arranged, and its padding: 0 for text; 24 to 32 (6 to 8) for a padded widget; 48 to 64 (12 to 16) for a hero on a marketing page. Code sizes the widget itself: it fills its column, or is {{sideWidth}} wide as a side panel.
- `nodes`: every element, with IDs W03.n01, W03.n02, ... for widget W03. A nested node names its `parent`; a top-level node has parent "". `order` is reading order among siblings.
- `copy`: strings a node needs that the deck lacks, which should be rare, with IDs W03.c1, W03.c2, ...; [] otherwise. Never add a string the deck already has: name its id.

## What the definition fixes

- Copy: every copy id the widget lists is shown by a node, and every `text` and `label` is a deck id or one the widget adds.
- Steps and fields: every step and alternative the widget lists is on one of its nodes, and no node serves a step the widget does not list. Every field it lists has an input with that `field`, and no input edits another.
- States: the widget shows exactly its states: each on at least one node, and no node in another. A widget that shows notFound offers a way out there: a navigation node, shown then or always, to the page the user came from.
- Headings: the widget's top heading is at its placement's heading level and comes first in reading order; no heading is above that level, and the levels below never skip. A widget placed at level 0 has no heading.
- Data: show the values it lists, as the scope's nouns and attributes.
- New components: a node is a declared new component only when the widget lists it, and builds on it as designed.

{{nodeGuide}}

Design-system components:

{{dsProse}}

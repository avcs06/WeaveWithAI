# Layout heuristics catalog

The spacing, alignment and composition rules that separate a page that looks
designed from one that looks generated. Every rule here is accepted (reviewed
2026-10-30) and becomes a rule on the layout skeleton in DS6c; tick it when it
is built. Rules marked prompt only compare words, so they go into the design
prompts and the reviewer guidance instead (FL11). Numbers are px on desktop, taken from the design system's
own spacing: its recipes use 8 most, then 16, 24, 12 and 32, and its
components pad 4 to 24. On phone every number is one spacing step smaller
unless a rule says otherwise. "Skeleton" means the rectangles the
solver computes from the nodes and the inventory boxes (DS6b).

Severity is a suggestion: mandatory rules join the fix rounds, warnings are
recorded.

## A. Spacing hierarchy (proximity)

- [ ] **H-01 Gaps shrink with depth.** Section to section is the largest gap,
      blocks inside a section smaller, items inside a block smaller, label to
      control the smallest. Check: along every nesting chain in the skeleton,
      gap(parent) > gap(child). Mandatory.
- [ ] **H-02 A heading belongs to what follows.** Space above a heading is at
      least 1.5 times the space below it. Check: distance to the previous
      sibling against distance to the next, for every heading node. Mandatory.
- [ ] **H-03 Related pairs use the smallest gaps.** Icon and text, label and
      value, checkbox and label, avatar and name: 4 to 10, as the design
      system's controls do (checkbox 6, button 8, menu and tab 10). Check:
      siblings in a row whose roles pair up have gap 1 to 2.5 on the spacing
      scale. Mandatory.
- [ ] **H-04 Icon to text in one line.** 4 with xs icons, 6 to 8 at sm, 8 to 10 at md,
      and always smaller than the gap between separate items of the row.
      Check: row gap of an icon-text pair against the row's item gap. Mandatory.
- [ ] **H-05 Unrelated groups in a row stand apart.** Toolbar groups are at
      least twice the in-group gap apart, or separated by a divider. Check: a
      row with mixed roles has two gap sizes or a separator node. Warning.
- [ ] **H-06 Padding is never smaller than the gap inside it.** A card or
      dialog with padding 16 has inner gaps of 16 or less. Check: container
      padding against its largest child gap. Mandatory.
- [ ] **H-08 Sections neither touch nor float apart.** 24 to 32 between sections on inner pages, up to 48 on public pages, 16 to 24 on phone;
      more than 64 is too distributed. Check: gaps between top-level
      sections. Mandatory outside the range.
- [ ] **H-09 Form spacing.** Field to field 16, group to group 24. Check:
      gaps around input nodes. Mandatory.
- [ ] **H-10 Lists and tables keep one row rhythm.** Row heights constant; row
      gap 0 with dividers or 8 with cards, never both a divider and a gap.
      Check: rows of a list section share a height and one separation style.
      Mandatory.
- [ ] **H-11 Button groups.** 8 between buttons; a danger button never
      directly beside the primary without extra space or a divider. Check: gap
      between action nodes, and the roles of neighbours. Mandatory.
- [ ] **H-12 Title and description.** 4 between a title and its
      description, 12 to 16 from the description to the content. Check: gaps
      after heading and text nodes in a header group. Warning.
- [ ] **H-13 Paragraph spacing.** Between paragraphs 8 to 12 at body size,
      and less than the gap from a heading to its body. Check: gaps between
      consecutive text nodes. Warning.
- [ ] **H-14 Negative space follows hierarchy.** Hero padding 48 to 64 on
      public pages, section 24 to 32, card 16 to 20, dialog 24, control 4 to
      12, as the design system pads them. Check: padding by container kind.
      Warning.

## B. Alignment

- [ ] **H-15 One left edge per column.** Text, controls and cards in a column
      align on at most two x positions. Check: distinct left edges among the
      children of a column box. Mandatory above two.
- [ ] **H-18 One size per row.** Buttons, fields and chips in one row share a
      size; sm beside md is a defect. Check: size props of row siblings.
      Mandatory.
- [ ] **H-19 Centre whole blocks or nothing.** A centred heading over
      left-aligned body text is a defect. Check: alignment of siblings in a
      column with text. Mandatory.
- [ ] **H-20 Grids stay even.** Equal column widths unless the design says
      otherwise; no orphan in the last row when a different column count
      avoids it. Check: item count against columns. Warning.

## C. Sizing and rhythm

- [ ] **H-25 Measure for reading.** Body text 45 to 90 characters per line; a
      text block at most 640 to 720 wide even in a wide layout. Check: text
      node width against its type size. Warning.
- [ ] **H-26 Minimum widths.** A field at least 160, a button at least twice
      its height, a card at least 240, a dialog as wide as its widest control.
      Check: skeleton widths by node kind. Mandatory.
- [ ] **H-28 First viewport.** The H1 and the primary action inside 1280 by
      800 and 375 by 700 on entry pages; a hero never taller than one
      viewport. Check: rectangles against the viewport. Mandatory.
- [ ] **H-30 Media ratios.** Images in a grid share an aspect ratio from
      16:9, 4:3, 1:1 or 3:4. Check: media node boxes in one section. Warning.

## D. Hierarchy and emphasis

- [ ] **H-31 Heading sizes descend.** A section heading is larger than the
      titles inside it, and a heading sits one or two type steps above the
      text it heads. Check: type scales of heading nodes by depth and against
      their content. Mandatory.
- [ ] **H-35 Empty states are composed.** Icon or illustration, one sentence,
      one action, centred in the content area. Check: the empty state of a
      list section has those three nodes. Mandatory.

## E. Grouping and containers

- [ ] **H-38 Cards for repeated items only.** A card holds one item of a set
      or one option; a page is not a card deck and a form is not a card.
      Check: Card nodes outside list, cards and option sections. Mandatory.
- [ ] **H-39 No box in a box.** Containers nest at most two levels; a card in
      a card, or a bordered box inside a bordered section, is a defect. Check:
      container depth and border on nested containers. Mandatory.
- [ ] **H-42 Related fields share a row.** City and postcode, first and last
      name, start and end; at most three fields in a row; unrelated fields
      never share one. Prompt only: it compares field names.

## F. Responsiveness

- [ ] **H-46 Nothing wider than the viewport** except a table inside its own
      scroll box. Check: rectangle widths at 375. Mandatory.

## G. Copy inside the layout

- [ ] **H-50 Short labels.** Button labels at most three words, headings at
      most eight; table cells truncate rather than wrap. Check: word counts
      and Truncate use in table cells. Warning.
- [ ] **H-53 One word for one action.** The same action has the same label on
      every screen: Save everywhere, not Save here and Submit there. Prompt
      only: it compares action texts across screens.

## H. Tables, lists and data

- [ ] **H-55 Row actions.** At most three visible icon buttons, more go in a
      dropdown; always the last column. Check: action nodes per row. Warning.

## I. Page frame and navigation

- [ ] **H-59 Title matches navigation.** The H1 repeats the navigation item
      that opened the page. Prompt only: it compares the H1 with the
      navigation label.
- [ ] **H-60 Page action in the header.** The screen's primary action sits in
      the page header at the end; secondary actions in a dropdown. Check: the
      primary action node's section kind. Warning.

## J. Dialogs, popovers and toasts

- [ ] **H-63 Confirmations.** One sentence and two buttons; a destructive
      confirmation uses the danger variant and names what is destroyed. Check:
      confirm dialogs' nodes and texts. Mandatory.

## K. States without layout shift

- [ ] **H-65 Every async action has a place for its state.** A submit button
      shows loading in place; a list shows skeleton rows of the row height;
      an inline error has reserved height so fields do not jump. Check: state
      variants of a node share its box. Mandatory.

## L. Focus and hover

- [ ] **H-66 Room for the focus ring.** Every focusable element has clearance
      on all sides for its ring: the project's ring gap plus width plus blur
      (halo 3, offset 4, glow about 10), never less than 6, from the parent's
      padding or its own margin, so the ring is neither clipped by an
      overflow box nor touching a border. Check: for every interactive
      rectangle, the distance to the nearest sibling edge, border and
      clipping ancestor against the clearance. Mandatory.
- [ ] **H-67 Ghost controls align by their text.** A ghost-look control has
      no border or fill until hovered, so its text starts after its own
      padding (8 at sm, 12 at md). Text in the same container gets a matching
      left margin, or the control a negative one, so the text edges align and
      the hover fill still has room. Check: in a column, the text edge of a
      ghost control (its x plus padding) against the left edge of sibling text
      nodes; and the hover fill against H-66 clearance. Mandatory.

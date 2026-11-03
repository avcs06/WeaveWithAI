# UX practices

Rules every screen follows. The product designer writes the screens to them,
the coding agent builds to them, and the reviewers hold the work to them.

## Lists and records

- A list of records shows each record in a table row or a card, even a short list, never as rows of bare text: the row's line or the card's border keeps one record's details together across a wide screen. A table holds records the user scans and compares, such as an admin's orders or products. Cards hold rich records, with a photo, a description or several lines each.
- In a list, the record's name is the link that opens it, and a click anywhere on its row or card opens it too.
- A record shows each fact once, and one status at a time. When two fields say the same thing, such as "8 in stock" and "8 left", show the one the user acts on.
- A list sorted by a field shows that field: a list "newest first" shows each record's date.
- A row's actions are quiet: an icon button with a tooltip for each, or one row menu when there are more than two. Never a filled button on every row.
- A delete on a row is as quiet as the row's other actions. The filled `danger` button belongs to the confirm dialog's Delete only.
- An inline action, in a row or a toolbar, shows an icon alone with a tooltip. An action in a menu shows an icon and its text.

## Actions

- One main action per view, as the primary button. Every other action is secondary, or sits in a menu when there are many.
- An action appears once per view. A frame's action, in the header or the sidebar, is not repeated on the screen inside it.
- Every save confirms with a toast, an in-place edit included, so the user knows it took.
- An empty list shows its add action once, in the empty state. The same action above the list is hidden while the list is empty.
- Sibling actions of equal weight are the same element: two buttons, primary and secondary, or two links. A link beside a button says the link weighs less, as a quiet way out beside the main action does. Never a link and a button for two actions of equal weight, such as sign in and sign up.

## Editing

- A value shown on the page is edited in its place or in a dialog. In place, the value itself becomes the field, with no label and no help text, and nothing else on the page moves. Never a second field added under the value.
- The actions of an in-place edit are icon buttons with tooltips beside the value: edit while viewing, then save and cancel while editing. Never text buttons under the field.
- A page or dialog that edits one record ends with the same verb as the one that adds it, "Save", and its title says what it edits, such as "Edit Spring launch". The view and edit mode below keeps "Done".
- A screen the user comes to look at or use, and can also change, has a view mode and an edit mode: a dashboard, a document, a board, a profile, a settings page, whatever the flows call it. Viewing shows the content and one "Edit" action, and no editing control. Editing shows the editing controls and a "Done" action. Using the content, such as ticking an item or opening a link, is viewing.

## Screens

- The top of a screen holds the breadcrumbs or the way back first, then the title. The page-level actions sit in line with the title, or above it with the breadcrumbs. Nothing else comes before the title.
- A link outside a sentence is `look="plain"`: a way back, a breadcrumb, a navigation item, a footer's links, a link beside a button. Only two links keep the dotted line: a link inside a sentence, and a record's name in a table.
- In a flex row with action buttons, the buttons align to the center only when the rest of the row is one line. When the rest runs to several lines, such as a title with a description, the buttons align to the start or the end of the row.

## Forms

- Every form is a `Form`: it lays out the fields, the form's own error and the actions. Fields take their width from it, 1x by default; a field sets `width` to 0.5x, 0.75x, 1.5x or 2x when its content needs another, and fields in one form share these widths.
- A button that acts on a field's value, such as Send, Apply or Move, goes in that field's `action` slot, in a form or out of one, such as a filter bar or a toolbar. There it lines up with the field's box, not its label. A Select clears with its own clear button: no Clear button beside it.
- The form's main action comes last in its actions, as the primary button. Cancel is secondary, before it.
- A summary of what the main action commits to, such as a total or a count, sits once, above the actions or beside the form.
- A choice with a usual answer starts on it, such as the cheapest delivery or the current month. A choice with no usual answer starts empty and is required.
- A repeated group of fields, such as an item's variants, is one `FormRow` per item with its remove icon button at the row's end, and an Add button under the rows. A list of links, such as a record's photos, is one URL `Input` per link in the same way, never a textarea of links.
- A wrong entry in an optional field shows its error on the field, and clearing the field is the way past it. Never an extra step to go on without it.

## Tables and cards

- A list of records is a `Table` or a `CardList`. A Table for records the user scans and compares; a CardList for rich records, its `layout` set to fit them: `column` for records read one by one, `grid` for records browsed side by side.
- In a Table, the record's name keeps the dotted line, and `onRowClick` follows its link from the whole row. In a CardList, `stretchLink` follows it from the whole card, and the name is `look="plain"`.
- A fixed set in a grid, such as a dashboard's numbers or a landing page's reasons, takes a column count that divides it, such as 2 columns for 4 items. Records in a grid are a `CardList` with `layout="grid"`.

## Frames

- The sidebar's navigation is a `SidebarMenu`: every item has the same padding and hover, the current item is marked, a fixed top and bottom hold what sits above and below the list, such as a logo, a search or a Create button, and the account, and the list between them scrolls.

## Text

- A number the user reads and compares, such as a counter, a total, a statistic or a table's figures, is a `Numeral`. A number inside a sentence stays in the sentence's font, and a date, a time or a phone number stays text.
- Label and value pairs, such as an order's totals or a record's details, are a `DescriptionList`, at a width that keeps each label near its value. A value the user needs to keep, such as a confirmation number, sits in the title or on a line of its own.
- Steps the user follows in order are a numbered `List`, with `ordered`.
- Any text that stays on one line is a `Truncate`, wherever it sits: a heading, a label, a cell, a breadcrumb, a status line. Whether or not its container has a set width, it cuts the text with an ellipsis and a tooltip where the room runs out, and changes nothing where it does not. A flex parent needs `min-w-0`.

## Copy

- Buttons, titles, labels and messages are in sentence case: "Mark as packed", not "Mark as Packed".
- No em dashes: a comma, a colon or two sentences instead.
- A screen speaks its role's words, not the system's: a patient reads "Your visits", not "Appointment records", and a buyer reads "Subtotal", not "Merchandise subtotal".
- Money shows one way everywhere: two decimals, or none when the app's amounts are whole. Never one decimal, such as "902.5".

## Spacing

- Spacing inside a group is smaller than the spacing between groups: a container's gap never exceeds the gap of the container around it.
- A container's padding is at least its own gap.
- Two controls never sit closer than 8px.

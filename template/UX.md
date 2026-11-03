# UX practices

Rules every screen follows. The product designer writes the screens to them.
The coding agent builds to them. The reviewers hold the work to them.

## Lists and records

- A list of records shows each record in a table row or a card, even when the list is short. Never show records as rows of bare text. The row's line or the card's border keeps one record's details together across a wide screen. A table holds records the user scans and compares, such as an admin's orders or products. Cards hold rich records, each with a photo, a description or several lines.
- In a list, the record's name is the link that opens the record. A click anywhere on its row or card opens it too.
- A record shows each fact once. It shows one status at a time. When two fields say the same thing, such as "8 in stock" and "8 left", show the one the user acts on.
- A list sorted by a field shows that field. A list sorted "newest first" shows each record's date.
- A row's actions are quiet. With one or two actions, each is an icon button with a tooltip. With more than two, they go in one row menu. Never put a filled button on every row.
- A delete on a row is as quiet as the row's other actions. Only the confirm dialog's Delete is a filled `danger` button.
- An inline action in a row or a toolbar shows only an icon, with a tooltip. An action in a menu shows an icon and its text.

## Actions

- Each view has one main action, as the primary button. Every other action is secondary. When there are many, they sit in a menu.
- An action appears once per view. A frame's action in the header or the sidebar is not repeated on the screen inside the frame.
- Every save confirms with a toast, so the user knows it took. This includes an in-place edit.
- An empty list shows its add action once, in the empty state. The same action above the list is hidden while the list is empty.
- Sibling actions of equal weight are the same element. They are two buttons, primary and secondary, or two links. A link beside a button says the link weighs less, like a quiet way out beside the main action. Never use a link and a button for two actions of equal weight, such as sign in and sign up.

## Editing

- A value shown on the page is edited in its place or in a dialog. In place, the value itself becomes the field. The field has no label and no help text, and nothing else on the page moves. Never add a second field under the value.
- The actions of an in-place edit are icon buttons with tooltips, beside the value. While viewing, the action is edit. While editing, the actions are save and cancel. Never put text buttons under the field.
- A page or dialog that edits one record ends with "Save", the same verb as the page or dialog that adds it. Its title says what it edits, such as "Edit Spring launch". The view and edit mode below keeps "Done".
- A screen the user comes to look at or use, and can also change, has a view mode and an edit mode. It may be a dashboard, a document, a board, a profile or a settings page, whatever the flows call it. Viewing shows the content and one "Edit" action, with no editing control. Editing shows the editing controls and a "Done" action. Using the content, such as ticking an item or opening a link, counts as viewing.

## Screens

- Every screen but the landing page, `web/app/(routes)/(marketing)/page.tsx` at `/`, starts with a `PageHeader`. It holds the breadcrumbs to the pages above, the title, its description and the page's actions. Nothing comes before it.
- The landing page starts with a `Hero`. A record's screen whose record is gone shows a `NotFound`.
- A link outside a sentence is `look="plain"`. Examples are a way back, a breadcrumb, a navigation item, a footer's links and a link beside a button. Only two links keep the dotted line. They are a link inside a sentence and a record's name in a table.
- In a flex row with action buttons, the buttons align to the center only when the rest of the row is one line. When the rest runs to several lines, such as a title with a description, the buttons align to the start or the end of the row.

## Forms

- Every form is a `Form`. It lays out the fields, the form's own error and the actions. Fields take their width from it, 1x by default. A field sets `width` to 0.5x, 0.75x, 1.5x or 2x when its content needs another width. Fields in one form share these widths.
- A button that acts on a field's value, such as Send, Apply or Move, goes in that field's `action` slot. It goes there in a form or out of one, such as in a filter bar or a toolbar. There the button lines up with the field's box, not its label. A Select clears with its own clear button. Put no Clear button beside it.
- The form's main action comes last in its actions, as the primary button. Cancel is secondary, before it.
- The action that completes a task sits at the end of its row, on the right, after the other actions. Examples are Submit, Place order, and a cart's Checkout outside any form.
- A summary of what the main action commits to, such as a total or a count, appears once. It sits above the actions or beside the form.
- A choice with a usual answer starts on it, such as the cheapest delivery or the current month. A choice with no usual answer starts empty and is required.
- A repeated group of fields, such as an item's variants, is one `FormRow` per item. Each row ends with its remove icon button, and an Add button sits under the rows. A list of links, such as a record's photos, works the same way, with one URL `Input` per link. Never use a textarea of links.
- A wrong entry in an optional field shows its error on the field. Clearing the field is the way past it. Never add an extra step to go on without it.

## Tables and cards

- A list of records is a `Table` or a `CardList`. Use a Table for records the user scans and compares. Use a CardList for rich records, with its `layout` set to fit them. Set `column` for records read one by one, and `grid` for records browsed side by side.
- In a Table, the record's name keeps the dotted line. `onRowClick` follows its link from the whole row. In a CardList, the name is `look="plain"`. `stretchLink` follows its link from the whole card.
- A fixed set in a grid, such as a dashboard's numbers or a landing page's reasons, takes a column count that divides the set. For example, 4 items take 2 columns. Records in a grid are a `CardList` with `layout="grid"`.

## Frames

- The logo is a `PageLogo`, and the account menu is a `UserMenu`. Code places both where the theme puts them. Never build either by hand.
- Sign in and sign up are the template's pages, in a layout of their own. Link to them. Never build them again.
- The sidebar's navigation is a `SidebarMenu`. Every item has the same padding and hover. The current item is marked. A fixed top holds what sits above the list, such as a logo, a search or a Create button. A fixed bottom holds what sits below it, such as the account. The list between them scrolls.

## Text

- Text uses the Typography elements: `Paragraph` for body text, `Caption` for a small muted line, `List` for points, `DescriptionList` for label and value pairs, `Time` for a date, `Code` for code and `Kbd` for a key.
- A number the user reads and compares, such as a counter, a total, a statistic or a table's figures, is a `Numeral`. A number inside a sentence stays in the sentence's font. A date, a time or a phone number stays text.
- Label and value pairs, such as an order's totals or a record's details, are a `DescriptionList`. Give it a width that keeps each label near its value. A value the user needs to keep, such as a confirmation number, sits in the title or on a line of its own.
- Steps the user follows in order are a numbered `List`, with `ordered`.
- A date or a moment shows through `Time`, in the app's one format. A date the user picks is a `DateInput`.
- Any text that stays on one line is a `Truncate`, wherever it sits. The text may sit in a heading, a label, a cell, a breadcrumb or a status line. Where the room runs out, it cuts the text with an ellipsis and a tooltip. Where the room does not run out, it changes nothing. This holds whether or not its container has a set width. A flex parent needs `min-w-0`.

## Copy

- Buttons, titles, labels and messages are in sentence case. Write "Mark as packed", not "Mark as Packed".
- Use a comma, a colon or two sentences instead of an em dash.
- A screen speaks its role's words, not the system's. A patient reads "Your visits", not "Appointment records". A buyer reads "Subtotal", not "Merchandise subtotal".
- Money shows one way everywhere. It has two decimals, or none when the app's amounts are whole. Never show one decimal, such as "902.5".

## Spacing

- Spacing inside a group is smaller than the spacing between groups. A container's gap is at most the gap of the container around it.
- A container's padding is at least its own gap.
- Two controls sit at least 8px apart.

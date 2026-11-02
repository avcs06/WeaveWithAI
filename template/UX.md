# UX practices

Rules every screen follows. The product designer writes the screens to them,
the coding agent builds to them, and the reviewers hold the work to them.

## Lists and records

- In a list, the record's name is the link that opens it, and it looks like a link.
- A row's actions are quiet: an `IconButton` with a tooltip for each, or one row menu when there are more than two. Never a filled button on every row.
- A delete on a row is as quiet as the row's other actions. The filled `danger` button belongs to the confirm dialog's Delete only.
- An inline action, in a row or a toolbar, shows an icon alone with a tooltip. An action in a menu shows an icon and its text.

## Actions

- One main action per view, as the primary button. Every other action is secondary, or sits in a menu when there are many.
- An action appears once per view. A frame's action, in the header or the sidebar, is not repeated on the screen inside it.
- An empty list shows its add action once, in the empty state. The same action above the list is hidden while the list is empty.

## Editing

- A value shown on the page is edited in its place or in a dialog. In place, the value itself becomes the field, with save and cancel, and nothing else on the page moves. Never a second field added under the value.
- A screen where the user reads a document and also changes it has a view mode and an edit mode. Viewing shows the document and one "Edit" action. Editing shows the controls and a "Done" action.

## Forms

- Every form is a `Form`: it lays out the fields, the form's own error and the actions. Fields take their width from it, 1x by default; a field sets `width` to 0.5x, 0.75x, 1.5x or 2x when its content needs another, and fields in one form share these widths.
- A button beside a field goes in the field's `action` slot, so it lines up with the field's box and not with the label.
- The form's main action comes last in its actions, as the primary button. Cancel is secondary, before it.

## Frames

- The sidebar's navigation is a `SidebarMenu`: every item has the same padding and hover, the current item is marked, a fixed top and bottom hold what sits above and below the list, such as a logo, a search or a Create button, and the account, and the list between them scrolls.
- The sidebar fills the height under the header. The header's height and the sidebar's top come from one value.

## Text

- Any text that stays on one line is a `Truncate`, wherever it sits: a heading, a label, a cell, a breadcrumb, a status line. Whether or not its container has a set width, it cuts the text with an ellipsis and a tooltip where the room runs out, and changes nothing where it does not. A flex parent needs `min-w-0`.

## Spacing

- Spacing inside a group is smaller than the spacing between groups: a container's gap never exceeds the gap of the container around it.
- A container's padding is at least its own gap.
- Two controls never sit closer than 8px.

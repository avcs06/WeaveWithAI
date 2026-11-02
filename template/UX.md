# UX practices

Rules every screen follows. The product designer writes the screens to them,
the coding agent builds to them, and the reviewers hold the work to them.

## Lists and records

- In a list, the record's name is the link that opens it, and it looks like a link.
- A row's actions are quiet: an icon button with a tooltip for each, or one row menu when there are more than two. Never a filled button on every row.
- A delete on a row is as quiet as the row's other actions. The filled `danger` button belongs to the confirm dialog's Delete only.
- An inline action, in a row or a toolbar, shows an icon alone with a tooltip. An action in a menu shows an icon and its text.

## Actions

- One main action per view, as the primary button. Every other action is secondary, or sits in a menu when there are many.
- An action appears once per view. A frame's action, in the header or the sidebar, is not repeated on the screen inside it.
- An empty list shows its add action once, in the empty state. The same action above the list is hidden while the list is empty.
- Sibling actions of equal weight are the same element: two buttons, primary and secondary, or two links. A link beside a button says the link weighs less, as a quiet way out beside the main action does. Never a link and a button for two actions of equal weight, such as sign in and sign up.

## Editing

- A value shown on the page is edited in its place or in a dialog. In place, the value itself becomes the field, with no label and no help text, and nothing else on the page moves. Never a second field added under the value.
- The actions of an in-place edit are icon buttons with tooltips beside the value: edit while viewing, then save and cancel while editing. Never text buttons under the field.
- A screen the user comes to look at or use, and can also change, has a view mode and an edit mode: a dashboard, a document, a board, a profile, a settings page, whatever the flows call it. Viewing shows the content and one "Edit" action, and no editing control. Editing shows the editing controls and a "Done" action. Using the content, such as ticking an item or opening a link, is viewing.

## Screens

- The top of a screen holds the breadcrumbs or the way back first, then the title. The page-level actions sit in line with the title, or above it with the breadcrumbs. Nothing else comes before the title.
- A link that works as a control, such as a breadcrumb, a way back or a navigation item, is `plain`. The dotted line is for a link inside text.
- In a flex layout, items align to the center when each is one line, such as a row of action buttons. When an item runs to several lines, such as a list, a form or a group of reasons, the layout aligns to the start, or to the end when that suits it, never to the center.

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

# Select — design contract

A choice from a list of options. The trigger box comes from
[FormField](FormField.md), the menu's behavior from [Dropdown](Dropdown.md) and
its look from [Menu](Menu.md). Shared rules are in [packages/ui/AGENTS.md](../packages/ui/AGENTS.md).

One component covers two dimensions of modes: single or multiple selection, and
client or server search.

## Props

```ts
type SelectSelection =
  | {
      multiple?: false;
      value: string;
      onChange: (value: string, option: SelectOptionData | undefined) => void;
    }
  | {
      multiple: true;
      value: readonly string[];
      onChange: (values: string[], options: SelectOptionData[]) => void;
    };

type SelectSearch = {
  search?: string;
  onSearchChange?: (text: string) => void;
} & (
  | { searchable?: boolean; onSearch?: never }
  | { onSearch: (text: string) => void; searchable?: never }
);

type SelectProps = FormFieldOwnProps &
  SelectSelection &
  SelectSearch & {
    children: ReactNode;
    allowClear?: boolean;
    renderTrigger?: (trigger: {
      selected: SelectOptionData[];
      open: boolean;
    }) => ReactNode;
    onBlur?: () => void;
  };

type SelectOptionProps = DisabledState & {
  value: string;
  label: string;
  children?: ReactNode;
  [key: string]: unknown;
};

type SelectOptionData = { value: string; label: string; [key: string]: unknown };
```

- Controlled only: `value` and `onChange` are required, and there is no
  `defaultValue`.
- Single: `''` means nothing selected and shows the placeholder.
  `onChange(value, option)` passes the chosen option's data.
- Multiple: choosing an option toggles it. `onChange(values, options)` passes
  the new values in selection order and each value's option data in the same
  order. A value no option has described comes as `{ value, label: value }`,
  the way the trigger shows it.
- Client search: with `searchable`, a search field filters the options by label,
  case-insensitively, as the user types.
- Server search: with `onSearch`, Select never filters. It calls
  `onSearch(text)` after a 300ms pause in typing, the same debounce as
  [SearchInput](Input.md), and the parent renders the matching options as
  children. `loading` shows the spinner while results load.
- The search text is controlled when `search` is given: the field shows
  `search`, and each change calls `onSearchChange(text)`. Without `search`,
  Select keeps the text itself and still calls `onSearchChange`. `onSearch`
  stays the server callback after the pause.
- Unlike other controls, `loading` doesn't disable a Select:
  `disableWhileLoading` defaults to `false`, so the user can keep typing while
  results load.
- With `allowClear`, the user can clear the selection while something is
  selected: `onChange('', undefined)` in single mode, `onChange([], [])` in
  multiple. How clearing is presented and reached needs to be handled.
- Works with `Controller` as FormField describes: `{...field}` is all it needs.

## Options are config

`Select.Option` renders nothing where it is placed. It is a config component:
while mounted, it gives the Select its props, and Select renders the menu from
them. The children are the only way to give a Select options; there is no
`options` prop.

An option's own `children` are the content of its row in the menu; without
children, the row shows the `label`. The `label` is what the trigger shows and
what search matches.

- The menu lists the mounted options in the order of their `Select.Option`
  elements, also after options are added or removed.
- Any other prop given to a `Select.Option` becomes part of its option data,
  next to `value` and `label`, and reaches `onChange` with it. `children` and
  the disabled state are not option data.
- A selected value keeps its label and option data after its option disappears
  (filtered out, or missing from new server results).
- A selected value no option has ever described shows the value as its label.
- The first render, on the server too, already has every option: the trigger
  shows the selected labels.

## Trigger

- The FormField box, with FormField's sizes, variants, status, looks, icons,
  add-ons, spinner and tooltip.
- The trigger is the focusable element: a `combobox` with FormField's
  `controlProps`, accessible per AGENTS.md.
- Placeholder `base.fgMuted`. Default placeholder text: "Select {label}", or
  "Select" without a label.
- Single: the selected label, truncated to one line with the full text in a
  tooltip.
- Multiple: each selected value is an `xs` closable [Tag](../packages/ui/src/Tag),
  4px apart (`spacing.1`), wrapping. The size's height becomes the trigger's
  minimum height, and the trigger grows downward. Tags never get
  wider than the trigger. Closing a tag deselects its value, except when the
  Select is disabled. The tags' close buttons are not tab stops.
- `renderTrigger` replaces what the box shows (the placeholder, the selected
  label or the tags) with what it returns for the current selection and open
  state; `selected` is empty when nothing is selected. The box, the chevron, the
  search field and the keyboard behavior stay.
- Content is top-aligned. It ends with a 20px Lucide `ChevronDown` in
  `base.fgMuted`, centered in a box as tall as the line height, at the bottom
  of the trigger, or at the top when there is a right icon or add-on.

## Search field

The search field is inside the trigger, never in the menu. It is shown while the
menu is open, in client mode with `searchable` and always in server mode.

- Single: it takes the selected label's place; the selected label is its
  placeholder (or "Search" with nothing selected).
- Multiple: it follows the last tag.
- Its accessible name is "Search {label}" (or "Search").
- When the menu closes, the search text clears, through `onSearchChange('')`
  when it is controlled. In server mode a non-empty search that clears calls
  `onSearch('')` at once.

## Menu

- Dropdown's menu behavior with Menu's look; focus moves between the search
  field and the options as Keyboard and focus describes. Its width equals the
  trigger's, aligned to the trigger's start edge.
- A `listbox` of `option`s, accessible per AGENTS.md. Each option is a
  `Dropdown.Item`, and a selected option is a `selected` MenuItem, so it shows
  the success check at the end.
- Options use the Dropdown and AGENTS.md disabled rules: a disabled option is
  skipped by navigation, can't be chosen, and shows its reason in its tooltip.
- The menu's empty and loading states (no options, no matches, results
  loading) need to be handled.
- In server mode, selected values missing from the current results aren't
  listed in the menu, but they stay selected: choosing another option never
  drops them from `value`.

## Keyboard and focus

Exactly one element shows focus at a time: the trigger box shows the focus ring
while the trigger or its search field has focus, and an option shows the
highlight while it has focus. While focus is in the menu, the box keeps its open
look but shows no ring.

- Closed: the trigger is the Select's only tab stop. Enter, Space or ArrowDown,
  or a click, opens the menu. With a search field, a printable key opens the
  menu and types into the search field.
- Opening moves focus to the search field when there is one, otherwise to the
  selected option (the first selected one in multiple mode) or the first enabled
  option.
- From the search field, Tab or ArrowDown moves focus to the selected option if
  it is listed, otherwise to the first enabled option. Shift+Tab moves focus
  back to the trigger, and the menu stays open.
- From the trigger while open, Tab moves focus to the search field, or to the
  options when there is no search field.
- In the options, ArrowUp and ArrowDown move between enabled options, Home and
  End go to the first and last. Shift+Tab from an option, or ArrowUp on the
  first, moves focus back to the search field, or to the trigger without one.
- With a search field, a printable key pressed in the options moves focus to the
  search field and types there. Without one, it is typeahead.
- Enter or Space on an option, or a click, chooses it. Single: the value is
  selected, the menu closes and focus returns to the trigger. Multiple: the
  value toggles, the menu stays open and focus stays on the option.
- Multiple: Backspace in an empty search field deselects the last value.
- Escape closes the menu and focuses the trigger. Tab from any option
  closes the menu and moves on to the next element after the Select. A click
  outside closes the menu without moving focus.
- `onBlur` runs once when focus leaves the Select entirely, never while it moves
  between the trigger, the search field and the options.

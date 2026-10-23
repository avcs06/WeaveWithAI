# Dropdown — design contract

Dropdown is a menu's behavior: opening and closing, positioning, focus,
keyboard navigation, typeahead and activation, all from Radix `DropdownMenu`.
Its look comes from [Menu](Menu.md): every Radix part is rendered with `asChild`
onto the matching Menu part. Shared rules are in [packages/ui/AGENTS.md](../packages/ui/AGENTS.md).

This document fixes the public contract; the examples are supported usage.

## Root props

```ts
type DropdownProps = DisabledState & {
  children: ReactElement;
  menu: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  align?: 'start' | 'end';
};
```

`DisabledState` is the one from `packages/ui/src/utils`.

`children` is always one trigger element that forwards refs, events and
attributes. The menu content is named by the trigger. `modal` defaults to
`true` and `align` to `end`.

`menu` is the menu's content, rendered as authored inside the Menu shell. To
render a list, map it to Dropdown parts in `menu`. Fragments and wrapper
components work; Dropdown never inspects or flattens its content. An empty
`menu` is valid and renders an empty menu.

## Compound API

```ts
type DropdownItemProps = Omit<MenuItemProps, 'onSelect'> &
  DisabledState & {
    textValue?: string;
    onSelect?: (event: Event) => void;
  };

type DropdownGroupProps = MenuGroupProps & {
  label?: string;
};

type DropdownSeparatorProps = MenuSeparatorProps;

type DropdownSubMenuProps = {
  children: ReactElement<DropdownItemProps, typeof Dropdown.Item>;
  menu: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};
```

Dropdown draws nothing itself: each part is a Menu part with menu behavior
added, so its props are the Menu part's props plus that behavior, never a second
definition of the look.

- `Dropdown.Item` is a `MenuItem`. It takes every MenuItem prop (children are
  the row's content; the icons, add-ons, `selected` and `nested` are
  MenuItem's) and adds `onSelect`, the disabled state, and `textValue`.
  `textValue` is the text typeahead matches; it is required when the children
  aren't plain text. Icons are decorative; custom content holds no other
  interactive controls.
  A `role` replaces `menuitem` (Select presents its rows as `option`s); keyboard
  behavior stays the same.
- `Dropdown.Group` is a `MenuGroup`. It takes every MenuGroup prop and adds
  `label`, drawn as a `MenuLabel` that labels the group.
- `Dropdown.Separator` is a `MenuSeparator`.
- A submenu's content is a `Menu`.

Item and SubMenu forward refs to their interactive rows; Group and Separator
forward refs to their DOM elements. Use these parts, not bare Menu parts, inside
a Dropdown: a bare `MenuItem` has the look but no menu behavior.

SubMenu: `children` is the trigger and `menu` is the nested content.

- The trigger must be exactly one `Dropdown.Item`. Anything else throws an error
  in development saying the SubMenu trigger has to be a `Dropdown.Item`.
- SubMenu sets `nested` on the trigger, so it shows the chevron at the end. The
  trigger's icons and add-ons stay the caller's.
- The trigger's content, icons, add-ons, disabled state and reason belong on
  that Item, not on SubMenu.
- The trigger opens the submenu instead of selecting or closing the root menu,
  and behaves as one accessible submenu trigger, with no nested menuitems or
  extra focus stops. Its `onSelect` never runs.
- `open`, `defaultOpen` and `onOpenChange` follow the usual controlled and
  uncontrolled semantics.

## Interaction and accessibility

Menus support roving focus, typeahead, pointer interaction, Escape and outside
dismissal, and focus restoration. Activating an enabled item
closes the menu unless its `onSelect` event is default-prevented; `onSelect`
runs exactly once.

Submenus keep pointer grace and keyboard entry and exit. Escape and arrow
keys return focus correctly through nested menus. Submenus stay within the
viewport.

Disabled state follows AGENTS.md. Disabled items are skipped by navigation, and
disabled submenus can't open.

A disabled root blocks the trigger and renders no open content, even when
controlled with `open={true}`. It keeps the caller's controlled value; when
re-enabled, that value governs again. An open submenu that becomes disabled
hides under the same rule. Closing a menu never restores focus to an element
that can no longer take focus.

The root's reason tooltip wraps the trigger without adding a focusable wrapper.

## Examples

```tsx
type Action = { id: string; title: string; run: (event: Event) => void };
const actions: readonly Action[] = [
  { id: 'rename', title: 'Rename', run: rename },
  { id: 'copy', title: 'Copy link', run: copyLink },
];

<Dropdown
  menu={actions.map((action) => (
    <Dropdown.Item key={action.id} onSelect={action.run}>
      {action.title}
    </Dropdown.Item>
  ))}
>
  <Button variant="base">Actions</Button>
</Dropdown>;
```

```tsx
<Dropdown
  menu={
    <>
      <Dropdown.Item onSelect={rename}>Rename</Dropdown.Item>
      <Dropdown.Separator />
      <Dropdown.SubMenu
        menu={
          <>
            <Dropdown.Group label="Links">
              <Dropdown.Item leftIcon={<Link />} onSelect={copyLink}>
                Copy link
              </Dropdown.Item>
            </Dropdown.Group>
            <Dropdown.Separator />
            <Dropdown.Item disabledWithReason="You need permission to invite people">Invite people</Dropdown.Item>
          </>
        }
      >
        <Dropdown.Item>Share</Dropdown.Item>
      </Dropdown.SubMenu>
    </>
  }
>
  <Button variant="base">Actions</Button>
</Dropdown>
```

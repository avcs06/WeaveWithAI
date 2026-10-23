# Menu — design contract

Menu is the look of every menu-like surface. Dropdown and Select render their
content with it, and a later Popover will too. It has no behavior of its own: no
opening, positioning, focus, keyboard handling or selection logic. The component
that uses it supplies that through a Radix primitive and renders Menu's parts as
the primitive's elements, so the primitive keeps all of its Radix behavior and
takes Menu's look.

Token names refer to `tokens.ts` and `colors.ts`. Shared rules are in
[packages/ui/AGENTS.md](../packages/ui/AGENTS.md).

## Parts

Exported from `@packages/ui/Menu`:

| Part | Look of |
|---|---|
| `Menu` | the shell around a menu's content |
| `MenuItem` | one row |
| `MenuGroup` | a set of related rows |
| `MenuLabel` | a group's heading |
| `MenuSeparator` | a line between groups |

Every part forwards its ref and every other prop to its root element, so a Radix
part renders it with `asChild`. Roles, ARIA attributes and data attributes
come from the Radix part; Menu adds none and overrides none.

```ts
type MenuProps = ComponentPropsWithRef<'div'> & {
  header?: ReactNode;
  footer?: ReactNode;
};

type MenuItemProps = ComponentPropsWithRef<'div'> &
  Pick<IconAddonProps, 'leftIcon' | 'rightIcon' | 'leftAddOn' | 'rightAddOn'> & {
    selected?: boolean;
    nested?: boolean;
  };

type MenuGroupProps = ComponentPropsWithRef<'div'>;
type MenuLabelProps = ComponentPropsWithRef<'div'>;
type MenuSeparatorProps = ComponentPropsWithRef<'div'>;
```

`IconAddonProps` is the one from `packages/ui/src/utils`.

## Shell

- Width 220–360px, capped by the viewport. Narrow-view safety takes precedence
  over the minimum width. A component may set another width (Select matches its
  trigger).
- Max height `min(420px, 100vh - 48px)`, and never taller than the space
  available where it opens.
- Vertical padding `spacing.2` 8px, radius `radius.surface` 8px, background
  `base.bg`.
- Thin `base.divider` ring plus a drop shadow, `boxShadow.dropdown` by default.
  A surface using Menu, such as a later Popover, can give it another shadow
  without changing Menu.
- Order: header, list, footer. Header and footer are optional and stay outside
  the list. The list scrolls within the shell's max height, and the header and
  footer stay in view.
- A 1px `base.divider` line below the header and above the footer, only when the
  list has content; vertical margin 4px.
- The layer (`zIndex.dropdown`) and placement belong to the component using Menu.

## Rows

- Inset `spacing.1.5` 6px horizontally from the shell's edges.
- Padding `spacing.2` 8px vertically, `spacing.2.5` 10px horizontally.
- Larger custom content grows the row; it is never clipped to a fixed height.
- Radius `radius.control` 6px.
- `fontSize.label` 13px, `lineHeight.3.5` 14px, regular 400. Add-on text is
  medium 500 at the same size.
- Parts, left to right: the left icon or add-on, the label, the right add-on or
  icon, then the check and the chevron. Icons and add-ons follow the slot rules
  in AGENTS.md: on each side, the icon wins over the add-on. Parts sit
  `spacing.2.5` 10px apart; icon boxes are 16px.
- The label truncates to one line, with the full label in a tooltip when cut.
- Hover, keyboard highlight and an open submenu use `base.hoverBg`, 120ms ease.
- `selected` shows a 16px Lucide `Check` in `success.accentBg` at the end and
  sets `data-selected`.
- `nested` shows a 16px Lucide `ChevronRight` at the end, for a row that opens a
  submenu.
- Disabled: text `base.fg` mixed 50% into `base.bg`, default cursor, no hover
  background.

## Groups, labels and separators

- Rows in a group sit `spacing.0.5` 2px apart; groups sit `spacing.1.5` 6px apart.
- `MenuLabel`: mono, `fontSize.micro` 11px, `lineHeight.3` 12px, regular,
  uppercase, `base.fgMuted`, padding 8px vertically and 16px horizontally.
- `MenuSeparator`: 1px `base.divider`, vertical margin 4px.

## Customization

Following AGENTS.md: the header, list, footer and each row's parts carry
`data-slot`. Menu is portalled by the components that use it, so they expose its
class as a `menuClassName` prop.

# Button — design contract

Design specification for a fresh implementation. Token names refer to `tokens.ts` and `colors.ts`.

## Sizes

Height comes from padding + line height; the border never adds to it.

| Size           | Height | Padding Y         | Padding X        | Font size                  | Line height                  | Icon                       | Gap                |
| -------------- | ------ | ----------------- | ---------------- | -------------------------- | ---------------------------- | -------------------------- | ------------------ |
| `sm` (default) | 32px   | `spacing.1.5` 6px | `spacing.2` 8px  | `fontSize.body` 14px       | `lineHeight.body` 20px       | `iconSize.body` 16px       | `spacing.2` 8px    |
| `md`           | 40px   | `spacing.2` 8px   | `spacing.3` 12px | `fontSize.subheading` 16px | `lineHeight.subheading` 24px | `iconSize.subheading` 18px | `spacing.2.5` 10px |
| `icon-xs`      | 24px   | `spacing.1` 4px   | `spacing.1` 4px  | —                          | 0                            | `iconSize.body` 16px       | 0                  |
| `icon-sm`      | 32px   | 7px               | 7px              | —                          | 0                            | `iconSize.subheading` 18px | 0                  |
| `icon-md`      | 40px   | `spacing.2` 8px   | `spacing.2` 8px  | —                          | 0                            | `iconSize.heading` 24px    | 0                  |

`icon-sm` uses a raw 7px so it matches `sm`'s 32px height.

## Shape and type

- Radius: `radius.control` 6px; `rounded` uses `radius.full`.
- Font: `fontFamily.ui`, `fontWeight.medium` 500, no wrapping, no text selection.
- Icons take the text color.
- Transition: background, color and box-shadow at 140ms ease.

## Content

- Width fits the content, never wider than its container.
- Label fills the space between the icons and is left-aligned.
- Icons, add-ons and the loading spinner follow the slot rules in [shared visual rules](Dropdown-foundations.md).
- `tooltip` shows on hover; with a disabled reason it shows both, 8px apart (`spacing.2`).

## Wrappers

| Component        | Look                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| `IconButton`     | Sizes `xs`, `sm` (default), `md` map to `icon-xs`, `icon-sm`, `icon-md`; the child is the icon |
| `DropdownButton` | `base` variant by default, `ChevronDown` as the right icon                                     |
| `PopoverButton`  | `base` variant by default, `ChevronsUpDown` as the right icon                                  |
| `PlainButton`    | No button look at all: behavior only, styles come from the child                               |

`overrideTokens` sets the button's own size and color values inline for one-off cases.

## Colors

Hover and active/focus-visible share the same background.

| Variant   | Text             | Background       | Hover / active bg     | Border                       | Focus                   |
| --------- | ---------------- | ---------------- | --------------------- | ---------------------------- | ----------------------- |
| `default` | `accentFg`       | `accentBg`       | `accentHoverBg`       | `accentBorder`               | accent focus ring       |
| `base`    | `base.fg`        | `base.bg`        | `base.hoverBg`        | `base.border`                | base focus ring         |
| `ghost`   | `base.fg`        | transparent      | `base.hoverBg`        | none; `base.border` on hover | base focus ring         |
| `danger`  | `error.accentFg` | `error.accentBg` | `error.accentHoverBg` | `error.accentBorder`         | error accent focus ring |

## Disabled

- Every color is mixed 50% into `base.bg`, so it looks like 50% opacity without stacking layers.
- No hover or active change, no focus ring, default cursor.
- `ghost` stays transparent with no border.

## Shared (from `packages/styles`)

- Border: 0.75px, drawn as an inset box-shadow.
- Focus ring: set project-wide by `tokens.focusRing` (`halo` is the default: 3px ring, accent at 20%).

## Public API

Export `Button`, `IconButton`, `DropdownButton`, `PopoverButton`, `PlainButton`
and their public prop types from `@packages/ui/Button`.

`Button` forwards an `HTMLButtonElement` ref and standard button attributes,
events, ARIA attributes and data attributes. Default `type` is `button`.

Additional props:

- `size`: `sm | md | icon-xs | icon-sm | icon-md`, default `sm`.
- `variant`: `default | base | ghost | danger`, default `default`.
- `rounded`: boolean, default false.
- `leftIcon`, `rightIcon`, `leftAddOn`, `rightAddOn`: React nodes.
- `tooltip`: React node.
- `loading`, `disableWhileLoading`, `readOnly`: booleans; default false.
- `readOnlyReason`, `loadingReason`: optional nonempty strings.
- Mutually exclusive `disabled` and `disabledReason`, as specified below.
- `overrideTokens`: a typed partial of the button's own size/color token
  assignments, applied to this instance using vanilla-extract variables. Export
  the token type; do not accept arbitrary CSS properties as token overrides.

`IconButton` accepts `xs | sm | md` for size, defaults to `sm`, and otherwise
shares Button behavior. It requires an accessible name through `aria-label` or
`aria-labelledby`; a tooltip is not a substitute for a name.
`DropdownButton` and `PopoverButton` share Button props and allow explicit
variant/rightIcon overrides of their defaults.

`PlainButton` uses one child element through Radix Slot, forwards its ref and
behavior props, and applies no visual button recipe. For a non-button child,
provide role, tab order and Enter/Space activation without duplicate clicks.
Button wrappers remain compatible with Radix `asChild` triggers.

## Polymorphic rendering with as

Button and IconButton accept `as`, defaulting to `"button"`. Support both
`as="a"` and `as={Link}` with Link imported from `next/link`. Share the same
visual recipes, sizes, loading, slots, tooltips and disabled behavior across
render targets.

Export generic `ButtonProps<C>` and `IconButtonProps<C>` types, defaulting C to
`"button"`. Infer target-specific props and ref types from as. Preserve required
Next.js Link href and navigation props; anchor/Link refs are HTMLAnchorElement,
while default refs are HTMLButtonElement. Do not widen props/ref to any.
Infer C from `as` alone, so
unrelated props cannot silently change the inferred render target. Include all
respective target props, with shared Button API props taking precedence. Custom component required props remain required;
unsupported props and incorrect refs must be type errors. Without as, accept
native button props only. Only the default button target receives a default
type="button".

```tsx
<Button as={Link} href="/settings" prefetch={false}>Settings</Button>
<Button as="a" href="https://example.com" target="_blank" rel="noreferrer">
  Website
</Button>
<IconButton as={Link} href="/settings" aria-label="Settings">
  <Settings aria-hidden="true" />
</IconButton>
<IconButton as="a" href="/help" aria-label="Help">
  <HelpCircle aria-hidden="true" />
</IconButton>
```

Render the chosen target directly. Keep anchor semantics: no wrapping button,
role="button", or synthesized Space activation. Preserve Next.js navigation,
modified clicks, new tabs, context menus and forwarded navigation props. Icon
variants retain their accessible-name requirement and replace their icon with
a spinner during loading without losing that name.

Effective disabled follows the shared rules. Block click/navigation handlers,
set aria-disabled/data-disabled and tabIndex=-1. Disabled native anchors omit
href. A disabled Link target renders a non-navigable anchor with shared styles
and anchor ref so no alternate navigation path bypasses disabling. Keep reason
tooltips available. Strip target-specific navigation props from that fallback.

## Disabled contract and event composition

```ts
type DisabledState = { disabledReason: string; disabled?: never } | { disabled?: boolean; disabledReason?: never };
```

Prefer `disabledReason` when a reason can be communicated; `disabled` is for an
intentional absence of a reason. Reject both props together and empty reasons
in development. This exclusivity overrides the general conventions for these
components.

Effective disabled is true for disabled, a disabled reason, readOnly, a
read-only reason, loading with disableWhileLoading, or a loading reason.
Loading alone does not disable. Reason precedence is disabled, read-only,
loading. Block pointer and keyboard activation before calling consumer handlers
or Radix trigger handlers. Forward unrelated events normally.

Do not set native disabled: expose aria-disabled/data-disabled, use tabIndex=-1,
prevent activation and keep hover tooltip access. Disabled submit buttons must
not submit. Enabled buttons preserve native submit/reset behavior.

Merge refs rather than replacing the caller's or Radix's ref. Preserve Radix
state attributes. `data-state="open"` keeps the focused/active visual treatment
while a Dropdown or Popover is open. Composed event handlers respect
preventDefault and invoke consumer handlers once.

## Accessible content

Decorative icons/spinners are hidden from assistive technology. Loading exposes
aria-busy and retains a meaningful accessible name. Text remains visible when
icons are replaced by the spinner. Tooltip content combines normal content and
reason with an 8px gap.

## Required comment for silent disabling

Prefer disabledReason, which explains the unavailable action to the user.
When using a disabled value that can be true, require a nearby source comment
explaining why a user-facing reason is intentionally omitted. This is enforced
by a repository ESLint rule, not a component prop or TypeScript type.

Use the marker `disabled-justification:` followed by a nonempty explanation.
For JSX, put the comment immediately before the disabled attribute:

```tsx
<Button
  // disabled-justification: The surrounding panel already explains unavailability.
  disabled={isUnavailable}
>
  Save
</Button>
```

For data contracts, put the comment immediately before the disabled property:

```ts
const item: DropdownItemData = {
  type: 'item',
  key: 'save',
  label: 'Save',
  // disabled-justification: The surrounding panel already explains unavailability.
  disabled: isUnavailable,
};
```

Require the comment for true and boolean expressions; omitted disabled and
literal false are exempt. Line/block comments are accepted immediately before
the attribute/property. Empty explanations are invalid.

No justification property is added to the public API. Comments are developer
information only and do not affect rendering or disabled behavior. TypeScript
continues to enforce disabled/disabledReason exclusivity.

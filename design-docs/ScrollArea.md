# ScrollArea — design contract

Design specification for a fresh implementation. Token names refer to `tokens.ts` and `colors.ts`.

- Scrollbar 14px thick (`spacing.3.5`) with 4px padding (`spacing.1`), so the thumb is 6px; transparent track and corner.
- Thumb: round (`radius.full`), `base.border`; `base.fgMuted` on hover.
- Vertical and horizontal scrollbars look the same.
- Scrollbars show only when the content overflows.

## Sizing

- ScrollArea takes height, min height and max height on its root. The viewport fills the root and inherits its max height, so a max-height-only area scrolls instead of growing.
- Content fills the available viewport height when appropriate.
- Vertical-only content wraps within the available width instead of expanding the area sideways.

## FlexScrollArea

Fills whatever space is left in a flex column parent, with no fixed height, and scrolls the rest.

- Root: `overflow: hidden`, `position: relative`, flex column, `flex: 1`, `min-height: 0`.
- Viewport: `flex: 1`, `min-height: 0`, plus the same inherited max height and inner-div fixes as ScrollArea.
- `min-height: 0` on both is what stops the flex item from growing to its content's height. Without it nothing scrolls.
- The parent must be a flex column with a bounded height.

## Public API

Use `@radix-ui/react-scroll-area`. Export `ScrollArea`, `FlexScrollArea` and
public prop types from `@packages/ui/ScrollArea`.

```ts
type ScrollAreaProps = Omit<
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>,
  "children" | "type"
> & {
  children: React.ReactNode;
  orientation?: "vertical" | "horizontal" | "both";
  viewportRef?: React.Ref<HTMLDivElement>;
  viewportClassName?: string;
  onViewportScroll?: React.UIEventHandler<HTMLDivElement>;
};
```

Default orientation is vertical. Forward the component ref to Root; viewportRef
points to the actual scrolling viewport. Root receives className/style and
sizing constraints. FlexScrollArea has the same public props.
Scrollbars appear only for overflowing enabled axes, with a corner when both
scrollbars are present.

## Content and scrolling contract

onViewportScroll receives the real viewport event. A max-height-only root
shrinks to short content and scrolls tall content. Vertical mode does not
introduce horizontal growth; horizontal/both modes preserve horizontal overflow.
FlexScrollArea consumes remaining space in a bounded flex-column parent.
Focused menu items scroll into view; Dropdown header/footer remain outside the
scrolling list and within the constrained shell.

## Accessibility

Preserve wheel, touch, native keyboard scrolling and Radix thumb dragging.
Provide an accessible region name when the standalone viewport is a keyboard
stop. Avoid an unnecessary extra tab stop in a Dropdown; Radix menu roving focus
owns navigation there. Preserve visible focus when the viewport is focusable.

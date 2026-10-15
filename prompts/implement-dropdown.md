Implement Button, ScrollArea and Dropdown from:

- design-docs/Dropdown-foundations.md
- design-docs/Button.md
- design-docs/ScrollArea.md
- design-docs/Dropdown.md

Preserve the documented APIs, behavior and styles. Reuse existing utilities,
tokens, icons, Tooltip and Truncate.

Use Radix Dropdown Menu and Scroll Area primitives. Preserve Radix focus,
keyboard, submenu, collision and event-cancellation behavior. Button and
IconButton must infer target-specific props and refs from as, including
Next.js Link and native anchors.

FlexScrollArea implementation:
- Requires a bounded flex-column parent.
- Root: overflow:hidden, position:relative, flex column, flex:1, min-height:0.
- Viewport: flex:1, min-height:0, inherits max-height.
- Radix's inner content wrapper gets height:100%.
- Vertical-only mode: inner wrapper uses display:block !important and
  width:100%, preventing unintended horizontal growth.
- Express flex layout through permitted Tailwind utilities.
- Regular ScrollArea must also scroll with only max-height specified.

Implement the documented disabled-justification comment lint rule, including
typed data objects, aliases and spreads; add no justification prop.

Complete exports, recipes and affected consumer updates.

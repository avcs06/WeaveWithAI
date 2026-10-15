# Button, Dropdown and ScrollArea — shared visual rules

Read this with [Button](Button.md), [Dropdown](Dropdown.md) and
[ScrollArea](ScrollArea.md). Those documents contain the design contracts;
no conversation history is needed. Component-specific API decisions take
precedence over general conventions.

## Design and styling

Use `@packages/styles/tokens.css` and existing focus-ring/theme utilities.
Neutral/status palettes remain consistent; only theme colors vary by project.
Additional entity-specific palettes belong under entity; a missing general
color belongs under neutral. Avoid hardcoded palette values. Preserve explicit
measurements in the component specs when no existing token matches.

Do not restate global typography such as UI font family. Explicit mono headings
are intentional overrides. Use existing or Lucide icons, hidden from assistive
technology when decorative.

Layout uses Tailwind utilities: flex-row-gap-_ / flex-col-gap-_ (not bare flex),
alignment, grid, gaps, padding, margins and sizes. No Tailwind variants, arbitrary
values or negative classes. Each class string is at most 50 characters, and each
element receives at most two strings. Other styles use colocated vanilla-extract
and tokens. In .css.ts, display/flex/alignment properties are allowed only inside
media queries. Phone breakpoint is max-width:639px. Fit a 320px viewport.

Button icon/add-on behavior: icon wins over add-on on the same side; add-ons are
outermost. Dropdown has independent icon/slot props and renders all supplied
parts; its documented slot order takes precedence over Button's add-on rules.

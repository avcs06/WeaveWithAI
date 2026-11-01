# Agent rules

## Colors

- `base`, status, and the surface's `divider`, `backdrop` and `skeleton` stay the same in every project.
- Only primary and the surface page colors (`pageBg`, `frameBg`, `pageFg`, `pageFgMuted`) change per project.
- A project that needs additional color sets like secondary, or entity specific adds them under `entity`.
- Color sets (`primary`, `base`, status, entity) are for controls and containers. The page uses `surface.pageBg` and `surface.frameBg` (header and footer); only sections use `surface.pageFg` and `surface.pageFgMuted`.
- If a usage case has no matching color, add it to `surface`.

## Keyboard and accessibility

Every page is checked in a browser for these.

- Every control works by keyboard. Tab reaches it in reading order, its focus shows, and focus never gets stuck.
- Buttons act on Enter and Space. Use a design-system button or a native `button`, never a clickable `div`.
- A dialog closes on Escape and gives focus back to the control that opened it.
- Every control has an accessible name: its visible label, or `aria-label` when it shows only an icon.
- Text has a contrast of at least 4.5:1, or 3:1 for large text.
- Click and touch targets are at least 24 by 24 px.
- axe finds no serious or critical violation.

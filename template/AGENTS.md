# Agent rules

## Colors

- `base`, status, and the surface's `divider`, `backdrop` and `skeleton` stay the same in every project.
- Only primary and the surface page colors (`pageBg`, `frameBg`, `pageFg`, `pageFgMuted`) change per project.
- A project that needs additional color sets like secondary, or entity specific adds them under `entity`.
- Color sets (`primary`, `base`, status, entity) are for controls and containers. The page uses `surface.pageBg` and `surface.frameBg` (header and footer); only sections use `surface.pageFg` and `surface.pageFgMuted`.
- If a usage case has no matching color, add it to `surface`.

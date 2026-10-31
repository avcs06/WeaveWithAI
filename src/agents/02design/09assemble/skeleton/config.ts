// The layout solver's limits: the viewport it solves at and the estimates it
// sizes text, fields and table rows with (DS6b).

/** The viewport the layout skeleton is solved at: desktop only for the MVP. */
export const VIEWPORT = { width: 1280, height: 800 } as const;

/** Average glyph width in em for UI sans faces at 13 to 16px; enough to count wrapped lines, not to set type. */
export const CHAR_WIDTH_EM = 0.55;

/** The width of a field that sizes to its content, which a field never does on its own. */
export const FIELD_WIDTH_PX = 320;

/** How narrow a filling block may get in a wrapping row before it moves to its own line: the card minimum of H-26. */
export const FILL_BASIS_PX = 240;

/** Rows a table shows in the skeleton: a short first page. */
export const TABLE_ROWS = 5;

/** A leaf with no height anywhere: one md control. */
export const UNKNOWN_HEIGHT_PX = 40;

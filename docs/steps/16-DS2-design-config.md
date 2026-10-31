# 16 · DS2 Design config

Phase 3 · 20 min · Depends: F1 · Decisions: D3.5 A, D3.10 A · Spec:
specs/design.md "Screens", "New components", "Brief"

## Goal

The fixed vocabularies and limits the design stage uses, in one file each,
so prompts, schemas and validators read the same lists.

## What this step does

1. **The fixed vocabularies in one file**: screen templates, section kinds,
   node roles, states, allowed HTML tags, the tags the design system
   supersedes (and by which component), and the limits (new-component
   budget, inputs per section, grid columns).
2. **The font allowlists** with each family's Google Fonts import name and
   available weights, so the theme can only pick fonts that build.

After this step the schema, prompts and validators read the same lists
instead of each keeping a copy.

## Implementation details

### 1. `src/agents/02design/config.ts`

```ts
export const SCREEN_TEMPLATES = [...] as const;   // from the spec
export const SECTION_KINDS = [...] as const;
export const NODE_ROLES = [...] as const;
export const STATES = [...] as const;
export const ELEMENT_TAGS = [...] as const;
export const SUPERSEDED_TAGS: Record<string, string> = {
  button: 'Button', a: 'Link', input: 'Input', select: 'Select',
  textarea: 'Textarea', label: 'FormControl', table: 'Table',
};
export const LIMITS = {
  newComponents: 5,            // DESIGN-006
  inputsPerSection: 12,        // DESIGN-014 mandatory
  inputsWarnAt: 8,
  interactivePerSection: 7,    // warning
  sectionsPerPage: 8,          // warning
  gridColumnsMax: 4,           // DESIGN-022
  nearNameDistance: 2,         // DESIGN-005 warning
} as const;
export const DENSITY_SIZES = { compact: 'sm', comfortable: 'md', spacious: 'lg' } as const; // control size hint for page shells
```

### 2. `src/agents/02design/01brief/fonts.ts`

```ts
export type FontDef = { family: string; importName: string; weights: string[] };
export const UI_FONT_DEFS: FontDef[] = [
  { family: 'Inter', importName: 'Inter', weights: ['400', '500', '600', '700'] },
  { family: 'Manrope', importName: 'Manrope', weights: [...] },
  { family: 'DM Sans', importName: 'DM_Sans', weights: [...] },
  { family: 'IBM Plex Sans', importName: 'IBM_Plex_Sans', weights: [...] },
  { family: 'Source Sans 3', importName: 'Source_Sans_3', weights: [...] },
  { family: 'Work Sans', importName: 'Work_Sans', weights: [...] },
  { family: 'Plus Jakarta Sans', importName: 'Plus_Jakarta_Sans', weights: [...] },
];
export const DISPLAY_FONT_DEFS: FontDef[] = [ Fraunces, Playfair_Display, Space_Grotesk, Sora, Outfit, Lora, DM_Serif_Display ];
export const MONO_FONT: FontDef = { family: 'JetBrains Mono', importName: 'JetBrains_Mono', weights: ['400', '500', '600', '700'] };
export const UI_FONTS = UI_FONT_DEFS.map((f) => f.family) as [string, ...string[]];
export const DISPLAY_FONTS = DISPLAY_FONT_DEFS.map((f) => f.family) as [string, ...string[]];
```

`importName` is the `next/font/google` export (spaces to underscores).
`DM Serif Display` has weight 400 only; `Playfair Display` 400 to 900;
check each family's available weights on Google Fonts and list only what
exists, or `next build` fails in step 36.

## Done when

```sh
pnpm typecheck
```

## Watch out

- These lists feed `z.enum`; keep them tuples (`as const` or the cast).
- Change a list here and the schema, prompts and validators follow; never
  duplicate a list in a stage file.

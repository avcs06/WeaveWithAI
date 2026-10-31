import { z } from 'zod';
import { type Inventory, spacingKeys } from '../../../ds/inventory';
import { SECTION_KINDS, STATES } from '../config';

// The catalog (DS23): one call for the whole app, which sees every screen, so
// a widget that screens share is defined once. A definition says what a
// widget holds and its coarse layout, never its nodes; widths only, as
// heights follow content.

export function makeCatalogSchema(inv: Inventory) {
  const spacing = z
    .enum(spacingKeys(inv))
    .describe('A spacing token key. 4 means 16px');
  const Part = z.object({
    row: z.number().int().describe('The row it sits in, 1 for the top row'),
    name: z.string(),
    minWidthPx: z
      .number()
      .int()
      .describe('Its minimum width in px, from the table of possible boxes'),
    text: z
      .enum(['ellipsis', 'wrap', 'none'])
      .describe(
        'ellipsis: text that stays on one line. wrap: text that may wrap. none: a part that is not text',
      ),
  });
  const Slot = z.object({
    name: z
      .string()
      .describe('Its name in camelCase, such as title, description or body'),
    kind: z
      .enum(['words', 'parts'])
      .describe(
        'words: each instance writes the words for it, such as a title. parts: instances of widgets or components go in it',
      ),
    holds: z.string(),
    minWidthPx: z.number().int(),
    maxWidthPx: z
      .number()
      .int()
      .describe('Its widest width in px. 0 to fill the widget'),
  });
  const Widget = z.object({
    id: z.string().describe('W01, W02, ...'),
    name: z.string(),
    kind: z.enum(SECTION_KINDS),
    holds: z
      .string()
      .describe('What it shows and what users can do there, in one or two sentences'),
    flowSteps: z
      .array(z.string())
      .describe('The ids of the steps and alternatives it serves'),
    data: z
      .array(z.string())
      .describe('The values it shows, as Noun.attribute, such as Book.title'),
    states: z
      .array(z.enum(STATES))
      .describe('The states it shows beyond the ones its steps require. [] for none'),
    containsHeading: z.boolean(),
    repeat: z
      .string()
      .describe('The noun whose records its items repeat over, such as Book for a list of books. "" otherwise'),
    newComponents: z
      .array(z.string())
      .describe('The names of the new components it holds inside it'),
    slots: z.array(Slot),
    layout: z.object({
      parts: z.array(Part).describe('Its parts, each with the row it sits in'),
      gap: spacing,
      padding: spacing,
    }),
    maxWidthPx: z
      .number()
      .int()
      .describe('Its widest width in px. 0 to fill what it is given'),
  });
  const ComponentWidths = z.object({
    name: z.string(),
    minWidthPx: z.number().int(),
    maxWidthPx: z
      .number()
      .int()
      .describe('Its widest width in px. 0 to fill what it is given'),
  });
  const ScreenParts = z.object({
    screen: z.string(),
    parts: z
      .array(z.string())
      .describe('The widgets and new components it is made of, as widget ids and component names'),
    frameSteps: z
      .array(z.string())
      .describe('The steps of this screen that its frame serves, such as sign out. [] for none'),
  });
  const Catalog = z.object({
    widgets: z.array(Widget),
    components: z.array(ComponentWidths),
    screens: z.array(ScreenParts),
  });
  return { Catalog, Widget };
}

type CatalogSchemas = ReturnType<typeof makeCatalogSchema>;

export type Catalog = z.infer<CatalogSchemas['Catalog']>;

export type CatalogWidget = z.infer<CatalogSchemas['Widget']>;

/** The catalog's keyed lists, for patch fixes (F16). */
export const CATALOG_KEYS = { widgets: 'id', components: 'name', screens: 'screen' };

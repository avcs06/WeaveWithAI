import { z } from 'zod';
import type { Inventory } from '../../../ds/inventory';
import { Question } from '../../01flows/schema';
import {
  AREAS,
  ARRANGEMENTS,
  CONTENT_WIDTHS,
  COPY_KINDS,
  SCREEN_KINDS,
  SECTION_KINDS,
  STATES,
  SURFACES,
} from '../config';
import { makeScreensSchema } from '../schema';

// The IA call's shapes (DS23): the copy deck, the widget definitions and each
// screen's composition, with no boxes. Text is never written twice: a node
// names a copy id, so one string reads the same on every screen.

export const Copy = z.object({
  id: z
    .string()
    .describe('C001, C002, ...; a string a widget call adds is W03.c1'),
  kind: z.enum(COPY_KINDS),
  text: z.string(),
});

export type Copy = z.infer<typeof Copy>;

export const Widget = z.object({
  id: z.string().describe('W01, W02, ...'),
  name: z.string(),
  kind: z.enum(SECTION_KINDS),
  purpose: z.string(),
  content: z
    .string()
    .describe('What it shows and lets users do, in one or two sentences'),
  title: z.string().describe('Copy id of its top heading; "" when it has none'),
  copy: z.array(z.string()).describe('Copy ids of every string it shows'),
  flowSteps: z.array(z.string()).describe('Step and alternative ids it serves'),
  fields: z
    .array(z.string())
    .describe(
      'Field ids it takes input for; every field of a user step it serves',
    ),
  data: z.array(z.string()).describe('Values it shows, as Noun.attribute'),
  states: z
    .array(z.enum(STATES))
    .describe('States it shows besides default; it shows exactly these'),
  repeat: z
    .string()
    .describe('The noun whose records its items repeat over; ""'),
  newComponents: z
    .array(z.string())
    .describe('Declared new components it uses, by name'),
});

export type Widget = z.infer<typeof Widget>;

export const Placement = z.object({
  id: z.string().describe('S04.sec1, S04.sec2, ... in reading order'),
  screen: z.string(),
  order: z.number().int(),
  widget: z.string(),
  area: z
    .enum(AREAS)
    .describe('main, or side for the side panel of a main-side screen'),
  surface: z
    .enum(SURFACES)
    .describe(
      'Its background: page for most; frame, brand or accent set a band apart on a marketing page',
    ),
  headingLevel: z
    .number()
    .int()
    .describe(
      "The level of the widget's top heading, 1 to 3, the same wherever the widget is placed; 0 when it has none",
    ),
});

export type Placement = z.infer<typeof Placement>;

/** The IA call's shapes over an inventory: the screens, the copy deck, the widgets and their placements. */
export function makeArchitectSchemas(inv: Inventory) {
  const { NewComponent } = makeScreensSchema(inv);

  const Screen = z.object({
    id: z.string().describe('S01'),
    name: z.string(),
    type: z.enum(['page', 'dialog', 'drawer']),
    route: z
      .string()
      .describe(
        'Next.js route for pages, e.g. /projects/[projectId]; "" otherwise',
      ),
    parent: z
      .string()
      .describe('Page that opens this dialog or drawer; "" for pages'),
    kind: z.enum(SCREEN_KINDS),
    framed: z
      .boolean()
      .describe(
        "True for a page in its kind's layout; false for sign in, dialogs and drawers",
      ),
    contentWidth: z.enum(CONTENT_WIDTHS),
    arrangement: z
      .enum(ARRANGEMENTS)
      .describe(
        'column stacks its widgets; main-side puts one main widget beside one side panel',
      ),
    title: z
      .string()
      .describe(
        'Copy id of the page title its level-1 heading shows; "" when that heading shows a record\'s value, or for a dialog or drawer',
      ),
    access: z.enum(['public', 'signedIn']),
    roles: z.array(z.string()),
    purpose: z.string(),
    entry: z
      .boolean()
      .describe('True for pages a user can start from: landing, home, sign in'),
    states: z
      .array(z.enum(STATES))
      .describe('States the screen shows; its widgets show them'),
  });

  const Declaration = NewComponent.pick({
    name: true,
    purpose: true,
    closestExisting: true,
    whyNotExisting: true,
  });

  const Ia = z.object({
    navigation: z.object({
      items: z.array(
        z.object({
          label: z
            .string()
            .describe(
              "Copy id of the item's text: the title of the page it opens",
            ),
          screen: z.string(),
          access: z.enum(['public', 'signedIn']),
        }),
      ),
    }),
    copy: z
      .array(Copy)
      .describe(
        'Every visible string once: titles, headings, text, actions, field labels, empty and error lines',
      ),
    screens: z.array(Screen),
    widgets: z.array(Widget),
    placements: z.array(Placement),
    newComponents: z
      .array(Declaration)
      .describe('Declared only; a later call designs each'),
    questions: z.array(Question),
    impossibleSteps: z.array(
      z.object({ step: z.string(), reason: z.string() }),
    ),
  });

  return { Ia, Screen, Declaration };
}

type ArchitectSchemas = ReturnType<typeof makeArchitectSchemas>;

export type WidgetIa = z.infer<ArchitectSchemas['Ia']>;

export type WidgetScreen = z.infer<ArchitectSchemas['Screen']>;

import { z } from 'zod';
import { SURFACES } from '../config';

// The screen layouts (DS23): one call per page with the dialogs and drawers
// it opens. Each screen is a box tree of rows and columns holding instances;
// an instance places a widget or a new component, in a box or in another
// instance's slot. Spacing between them is the theme's section gap, so the
// call picks none.

const Size = {
  size: z
    .enum(['content', 'fill', 'fixed'])
    .describe('Its width. content: as wide as its content. fill: a share of the space left. fixed: widthPx wide'),
  share: z.number().int().describe('When size is fill, its share of the space left: 1, 2 and so on. 1 otherwise'),
  widthPx: z.number().int().describe('Its width in px when size is fixed. 0 otherwise'),
};

export const ScreenBox = z.object({
  id: z.string().describe('S04.b1, S04.b2, ...'),
  parent: z.string().describe('The box it sits in; "" at the top'),
  order: z.number().int(),
  direction: z.enum(['row', 'column']),
  ...Size,
  align: z
    .enum(['start', 'center', 'end', 'stretch'])
    .describe('Across its direction: start where content follows; stretch for a row of cards'),
});

export const Instance = z.object({
  id: z.string().describe('S04.p1, S04.p2, ...'),
  places: z.string().describe('The widget id or new component name it places'),
  in: z
    .string()
    .describe('Where it sits: a box id such as S04.b1, "" for the top of the screen, or a parts slot of another instance such as S04.p2/body'),
  order: z.number().int(),
  ...Size,
  height: z
    .enum(['fill', 'free'])
    .describe('free: as tall as its content. fill: the height its parent leaves, for a parent of bounded height such as a dialog'),
  surface: z
    .enum(SURFACES)
    .describe('Its background: page for most; frame, brand or accent set a band apart on a marketing page'),
  headingLevel: z
    .number()
    .int()
    .describe("The level of its widget's top heading, 1 to 3, when the widget contains a heading. 0 otherwise"),
  slots: z
    .array(z.object({ name: z.string(), text: z.string() }))
    .describe('The words for each words slot of its widget, such as title and description'),
});

export const ScreenLayout = z.object({
  screen: z.string(),
  boxes: z.array(ScreenBox),
  instances: z.array(Instance),
});

/** One call's answer: the layouts of a page and the dialogs and drawers it opens. */
export const ScreenLayouts = z.object({ screens: z.array(ScreenLayout) });

export type ScreenBox = z.infer<typeof ScreenBox>;
export type Instance = z.infer<typeof Instance>;
export type ScreenLayout = z.infer<typeof ScreenLayout>;
export type ScreenLayouts = z.infer<typeof ScreenLayouts>;

/** A call's keyed lists, for patch fixes (F16): a fix sends a screen's layout whole. */
export const SCREEN_KEYS = { screens: 'screen' };

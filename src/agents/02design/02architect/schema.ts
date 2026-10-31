import { z } from 'zod';
import type { Inventory } from '../../../ds/inventory';
import { Question } from '../../01flows/schema';
import { CONTENT_WIDTHS, SCREEN_KINDS, STATES } from '../config';
import { makeScreensSchema } from '../schema';

/**
 * The architect's plan (DS23, user 2026-10-31): the creative call. It plans
 * the screens, their steps, composition and frame changes in prose, the
 * navigation, and the new components' look; no blocks and no layout. Access,
 * roles, required states and most alternatives follow from the steps, so a
 * processing step fills them (`process.ts`).
 */
export function makeArchitectSchema(inv: Inventory) {
  const { NewComponent } = makeScreensSchema(inv);
  const Screen = z.object({
    id: z.string().describe('S01, S02, ...'),
    name: z.string(),
    type: z.enum(['page', 'dialog', 'drawer']),
    route: z
      .string()
      .describe('A page\'s own route, such as /projects/[projectId]. "" for a dialog or drawer'),
    parent: z
      .string()
      .describe('The page that opens this dialog or drawer. "" for a page'),
    kind: z.enum(SCREEN_KINDS),
    framed: z
      .boolean()
      .describe("True for a page that sits in its kind's layout. False for sign in, and for every dialog and drawer"),
    contentWidth: z.enum(CONTENT_WIDTHS),
    title: z
      .string()
      .describe(
        'A page\'s title: the words its level-1 heading and its navigation item show. "" when the heading shows a record\'s value, and for a dialog or drawer',
      ),
    purpose: z.string(),
    entry: z
      .boolean()
      .describe('True for a page a user can start from, such as the landing page, home and sign in'),
    flowSteps: z.array(z.string()).describe('The ids of the steps it serves'),
    states: z
      .array(z.enum(STATES))
      .describe('The states it shows beyond the ones its steps require. [] for none'),
    composition: z
      .string()
      .describe('What the screen is made of and how it is arranged, in prose'),
    frame: z
      .string()
      .describe(
        'How its frame differs from its layout\'s default, in prose. "" when the frame is the default',
      ),
  });
  const NavigationItem = z.object({
    screen: z.string(),
    slot: z
      .string()
      .describe(
        'The part and slot of the layout that draws it. One of header.start, header.center, header.end, sidebar.top, sidebar.bottom, extraSidebar.top, extraSidebar.bottom, footer.start, footer.center or footer.end',
      ),
  });
  const Component = NewComponent.pick({
    name: true,
    purpose: true,
    closestExisting: true,
    whyNotExisting: true,
  }).extend({
    description: z
      .string()
      .describe(
        "What it shows, what it is for, how much it stands out, and how it should feel and look. Use the theme's terms: the color set, the radius, the font and the density. Give one reference",
      ),
  });
  const Plan = z.object({
    screens: z.array(Screen),
    navigation: z.array(NavigationItem),
    alternativesElsewhere: z
      .array(z.object({ alternative: z.string(), screen: z.string() }))
      .describe('Each alternative that shows on one screen only while other screens also serve its step, with that one screen. [] for none'),
    newComponents: z.array(Component),
    questions: z.array(Question),
    impossibleSteps: z.array(
      z.object({ step: z.string(), reason: z.string() }),
    ),
  });
  return { Plan, Screen, Component };
}

type PlanSchemas = ReturnType<typeof makeArchitectSchema>;

export type Plan = z.infer<PlanSchemas['Plan']>;

export type PlanScreen = z.infer<PlanSchemas['Screen']>;

export type PlannedComponent = z.infer<PlanSchemas['Component']>;

/** The plan's keyed lists, for patch fixes (F16). */
export const PLAN_KEYS = {
  screens: 'id',
  navigation: 'screen',
  alternativesElsewhere: 'alternative',
  newComponents: 'name',
  questions: 'id',
  impossibleSteps: 'step',
};

import { z } from 'zod';

// The design is prose: every screen, dialog and frame is what the user sees and does there, in reading order. The coding
// agent lays it out with the design system; only ids, routes and links are structure.

/** What one place shows in another situation: an empty list, a record that is gone, the result of a save. */
export const Alternative = z.object({
  when: z
    .string()
    .describe(
      'The situation: "the user has no dashboards yet", "the dashboard was deleted"',
    ),
  steps: z
    .array(z.string())
    .describe(
      'What the user sees and can do in that situation, in reading order, one sentence each',
    ),
});

export const Frame = z.object({
  id: z.string().describe('FR01, FR02, ...'),
  name: z.string().describe('"App frame", "Public site frame"'),
  purpose: z.string().describe('Which screens sit in it and why'),
  steps: z
    .array(z.string())
    .describe(
      'What the frame shows and lets the user do around every screen inside it, in reading order, one sentence each',
    ),
  alternatives: z
    .array(Alternative)
    .describe('The frame on a phone, signed out, and other situations'),
});

export const Screen = z.object({
  id: z.string().describe('S01, S02, ...'),
  route: z
    .string()
    .describe(
      'The URL path, kebab-case, with a [param] for a record: "/", "/dashboards", "/dashboards/[dashboardId]"',
    ),
  title: z.string().describe('The title the user reads at the top of the page'),
  purpose: z
    .string()
    .describe('Why the user comes here and what they leave with, one or two sentences'),
  roles: z.array(z.string()).describe('Role ids from the scope that use it'),
  frame: z.string().describe('The id of the frame it sits in'),
  flows: z
    .array(z.string())
    .describe('Ids of the flows with a step on this screen'),
  steps: z
    .array(z.string())
    .describe(
      'Everything the user sees and can do here, in reading order, one sentence each',
    ),
  alternatives: z
    .array(Alternative)
    .describe(
      'Other situations this screen shows; loading and a failed load are left to the code',
    ),
});

export const Dialog = z.object({
  id: z.string().describe('D01, D02, ...'),
  title: z.string(),
  purpose: z.string().describe('The short task it holds, one sentence'),
  openedFrom: z
    .array(z.string())
    .describe('Ids of the screens with a step that opens it'),
  flows: z
    .array(z.string())
    .describe('Ids of the flows with a step in this dialog'),
  steps: z
    .array(z.string())
    .describe(
      'Everything the user sees and can do in it, in reading order, ending with where each way out leads',
    ),
  alternatives: z.array(Alternative),
});

export const Architecture = z.object({
  frames: z.array(Frame),
  screens: z.array(Screen),
  dialogs: z.array(Dialog),
});

export type Alternative = z.infer<typeof Alternative>;
export type Frame = z.infer<typeof Frame>;
export type Screen = z.infer<typeof Screen>;
export type Dialog = z.infer<typeof Dialog>;
export type Architecture = z.infer<typeof Architecture>;

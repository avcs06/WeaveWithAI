import type { Theme } from '../02theme/build';
import type { ModelNode } from '../07draw/schema';
import type { SECTION_KINDS } from '../config';
import type { NodeLayout } from '../schema-boxes';
import type { NewComponent, Screens } from '../schema';
import { designNode } from './nodes';
import { resolveScreens } from './resolve';

// One widget or new component on a page of its own (DS23), for its call's
// node and layout checks: one section of a fixed width and of the widget's
// kind, holding the nodes under the ids the call wrote, so every issue names
// what the call can see.

/** The page a call's nodes sit on alone: its kind, the section kind they stand in, and the components it may hold. */
export type AlonePage = {
  kind: 'app' | 'marketing';
  section: (typeof SECTION_KINDS)[number];
  components: NewComponent[];
};

const STACK = {
  direction: 'column',
  gap: '0',
  padding: '0',
  columns: 0,
  align: 'stretch',
  justify: 'start',
  wrap: false,
} as const;

/** `id` alone at `widthPx` wide, or filling a full page at 0, its top heading at level 1. */
export function widgetPage(
  id: string,
  nodes: ModelNode[],
  layout: NodeLayout,
  { kind, section: sectionKind, components }: AlonePage,
  widthPx: number,
  theme: Theme,
): Screens {
  const section = `${id}.sec1`;
  const resolved = resolveScreens(
    {
      navigation: { items: [] },
      screens: [
        {
          id,
          name: id,
          type: 'page',
          route: `/${id}`,
          parent: '',
          kind,
          framed: false,
          contentWidth: 'full',
          layout: { ...STACK, gap: '', padding: '' },
          access: 'public',
          roles: [],
          purpose: '',
          entry: false,
          states: [],
          flowSteps: [],
        },
      ],
      sections: [
        {
          id: section,
          screen: id,
          order: 1,
          kind: sectionKind,
          title: id,
          purpose: '',
          box: {
            width: widthPx ? 'fixed' : 'fill',
            widthPx,
            height: 'content',
            heightPx: 0,
            minHeightPx: 0,
            span: 1,
          },
          layout,
          surface: 'page',
          flowSteps: [],
          in: '',
          share: 1,
        },
      ],
      newComponents: components,
      questions: [],
      impossibleSteps: [],
    },
    nodes.map((node) =>
      designNode(node, { id: node.id, section, parent: node.parent }, kind, {
        level: 1,
        words: new Map(),
      }),
    ),
    theme,
  );
  return { ...resolved, boxes: [], frameChanges: [] };
}

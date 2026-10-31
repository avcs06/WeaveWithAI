import type { Theme } from '../02theme/build';
import type { PageLayout } from '../02theme/schema';
import { layoutShells, SHELL_IDS } from '../02theme/shells';
import type { DesignNode, Ia, Screens } from '../schema';

// The theme applied to the assembled design (DS4a): a framed page takes its
// kind's shell, a page's padding and section gap come from its layout, and a
// node's empty size or look takes the component's default.

/**
 * Nodes with an empty size or look set to the theme's default. `base` stays as
 * written: it asks for the design system's plain look over the theme's, which
 * the coding stage must still see.
 */
export function withDefaults(nodes: DesignNode[], theme: Theme): DesignNode[] {
  return nodes.map((node) => {
    const preset = theme.defaults[node.component] ?? {};
    const size = (node.size || (preset.size ?? '')) as DesignNode['size'];
    return { ...node, size, look: node.look || (preset.look ?? '') };
  });
}

/** The IA and every call's nodes as `02-design/09-assemble.json`, with the theme's layouts and defaults applied. */
export function resolveScreens(
  ia: Ia,
  nodes: DesignNode[],
  theme: Theme,
): Screens {
  const shells = layoutShells(theme.layouts);
  const framed = new Set(shells.map((shell) => shell.id));
  const screens = ia.screens.map((screen) => {
    const { main } = theme.layouts[screen.kind];
    const page = screen.type === 'page';
    const shell = SHELL_IDS[screen.kind];
    return {
      ...screen,
      shell: page && screen.framed && framed.has(shell) ? shell : '',
      layout: {
        ...screen.layout,
        // DESIGN-023 asks a dialog or drawer for its own gap and padding.
        gap: page ? main.sectionGap : screen.layout.gap || '0',
        padding: page ? main.padding : screen.layout.padding || '0',
      },
    };
  });
  const container = ({ main }: PageLayout) => ({
    container: main.container,
    maxWidthPx: main.maxWidthPx,
    align: main.align,
  });
  return {
    ...ia,
    screens,
    containers: {
      app: container(theme.layouts.app),
      marketing: container(theme.layouts.marketing),
    },
    shells,
    nodes: withDefaults(nodes, theme),
  };
}

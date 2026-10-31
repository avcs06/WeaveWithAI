import type { Inventory } from '../../../ds/inventory';
import type { Theme } from '../02theme/build';
import { layoutShells, SHELL_IDS } from '../02theme/shells';
import { CONTENT_WIDTH_PX, DIALOG_GAP, DIALOG_SIZE } from '../config';
import { NO_PADDING, sizes } from '../09assemble/skeleton/boxes';
import { VIEWPORT } from '../09assemble/skeleton/config';
import type { Planned } from '../03architect/process';

type Sized = Pick<Planned, 'type' | 'kind' | 'framed' | 'contentWidth'>;

/** The width a screen gives its content, as the solver works it out: a page's column inside its frame and container, less its padding; a dialog's or drawer's body. */
export function contentWidth(screen: Sized, theme: Theme, inv: Inventory): number {
  const s = sizes(inv, []);
  if (screen.type !== 'page') {
    const size = DIALOG_SIZE[screen.contentWidth];
    const dialog = s.byName.get('Dialog')?.box ?? {};
    const [, right, , left] = dialog[`${size}/body`]?.padding ?? NO_PADDING;
    return Math.max(0, (dialog[size]?.width ?? 0) - left - right);
  }
  const { main } = theme.layouts[screen.kind];
  const shell = screen.framed
    ? layoutShells(theme.layouts).find((x) => x.id === SHELL_IDS[screen.kind])
    : undefined;
  let free = VIEWPORT.width;
  for (const region of shell?.regions ?? [])
    if (!region.overlay && (region.place === 'left' || region.place === 'right'))
      free -= region.box.widthPx;
  const box = main.container === 'fixed' ? Math.min(main.maxWidthPx, free) : free;
  const target =
    screen.contentWidth === 'full' ? box : Math.min(CONTENT_WIDTH_PX[screen.contentWidth], box);
  return Math.max(0, Math.min(target, box - 2 * s.spacing(main.padding)));
}

/** The gap between a screen's boxes and instances: the theme's section gap on a page, the dialog gap otherwise. */
export function gapOf(screen: Pick<Planned, 'type' | 'kind'>, theme: Theme, inv: Inventory): number {
  const s = sizes(inv, []);
  return s.spacing(screen.type === 'page' ? theme.layouts[screen.kind].main.sectionGap : DIALOG_GAP);
}

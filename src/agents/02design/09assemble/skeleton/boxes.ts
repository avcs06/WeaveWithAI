import { CHAR_WIDTH_EM, FIELD_WIDTH_PX, TABLE_ROWS, UNKNOWN_HEIGHT_PX } from './config';
import type { Box, Inventory, InventoryComponent } from '../../../../ds/inventory';
import type { DesignNode, NewComponent } from '../../schema';

// What the inventory, the declared new components and the type scale say
// about one node, for the layout solver (layout.ts). Pure lookups.

export type Padding = [number, number, number, number];
export type Height = {
  height: number;
  from: string;
  estimated: boolean;
  lines: number;
};
/** What a container adds around its children: padding, and a band above them (a header, a tab list). */
export type Chrome = { padding: Padding; band: number; estimated: boolean };

export type Sizes = {
  byName: Map<string, InventoryComponent>;
  newComponents: Map<string, NewComponent>;
  spacing: (key: string) => number;
  type: (scale: string) => { size: number; line: number };
};

const px = (value: string | undefined) => Number.parseFloat(value ?? '') || 0;

export function sizes(inv: Inventory, newComponents: NewComponent[]): Sizes {
  const token = (name: string) =>
    inv.tokens.find((t) => t.name === name)?.value;
  return {
    byName: new Map(inv.components.map((c) => [c.name, c])),
    newComponents: new Map(newComponents.map((c) => [c.name, c])),
    spacing: (key) => px(token(`spacing.${key}`)),
    type: (scale) => ({
      size: px(token(`fontSize.${scale === 'none' ? 'body' : scale}`)),
      line: px(token(`lineHeight.${scale === 'none' ? 'body' : scale}`)),
    }),
  };
}

export const NO_PADDING: Padding = [0, 0, 0, 0];

/** The box keys to try for a node: its size, the component's default size, `default`. */
function keys(component: InventoryComponent, size: string): string[] {
  const fallback = component.defaults?.size;
  return [size, fallback, 'default'].filter(
    (key): key is string => typeof key === 'string' && key !== '',
  );
}

function entry(
  component: InventoryComponent,
  size: string,
  pick: (box: Box) => number | undefined,
): { key: string; value: number } | undefined {
  for (const key of keys(component, size)) {
    const value = component.box?.[key] && pick(component.box[key]);
    if (value) return { key, value };
  }
  return undefined;
}

/** A field draws a label, a box and help text; its box part has a height but no fixed width. */
function isField(component: InventoryComponent): boolean {
  return Object.entries(component.box ?? {}).some(
    ([key, box]) => /(^|\/)box$/.test(key) && box.width === undefined,
  );
}

export function textWidth(text: string, scale: string, s: Sizes): number {
  return text.length * s.type(scale).size * CHAR_WIDTH_EM;
}

export function textHeight(
  text: string,
  scale: string,
  width: number,
  s: Sizes,
): Height {
  const lines = Math.max(
    1,
    Math.ceil(
      textWidth(text, scale, s) /
        Math.max(width, s.type(scale).size * CHAR_WIDTH_EM) -
        1e-9,
    ),
  );
  return {
    height: lines * s.type(scale).line,
    from: `text ${lines} line${lines === 1 ? '' : 's'}`,
    estimated: true,
    lines,
  };
}

/** The width a leaf wants: the inventory's, a field's default, or its text plus the control's padding. */
export function leafWidth(
  node: DesignNode,
  s: Sizes,
): { width: number; estimated: boolean } {
  const declared = s.newComponents.get(node.newComponent)?.box;
  if (declared?.width === 'fixed')
    return { width: declared.widthPx, estimated: false };
  const component = s.byName.get(node.component);
  const fixed = component && entry(component, node.size, (b) => b.width);
  if (fixed) return { width: fixed.value, estimated: false };
  if ((component && isField(component)) || !node.text)
    return { width: FIELD_WIDTH_PX, estimated: true };
  let width = textWidth(node.text, node.typeScale, s);
  if (component) {
    const key = keys(component, node.size)[0] ?? 'default';
    const [, right, , left] = component.box?.[key]?.padding ?? NO_PADDING;
    // A checkbox, radio or switch puts its control beside the label.
    const control =
      component.box?.[`${key}/box`] ?? component.box?.[`${key}/track`];
    const gap = component.box?.[key]?.gap ?? 0;
    width += left + right + (control?.width ? control.width + gap : 0);
  }
  return { width, estimated: true };
}

/** A field without its own height (MultiSelect): FormControl's whole field with this box's minimum in place of its box. */
function grownField(
  component: InventoryComponent,
  size: string,
  s: Sizes,
): Height | undefined {
  const form = s.byName.get('FormControl')?.box;
  for (const key of keys(component, size)) {
    const min = component.box?.[`${key}/box`]?.minHeight;
    const whole = form?.[key]?.height;
    const box = form?.[`${key}/box`]?.height;
    if (min && whole && box)
      return {
        height: whole - box + min,
        from: `inventory ${component.name} ${key} field, box at least ${min}`,
        estimated: false,
        lines: 0,
      };
  }
  return undefined;
}

/** A design-system component's height from the inventory, in the order the spec gives. */
function inventoryHeight(node: DesignNode, s: Sizes): Height | undefined {
  const component = s.byName.get(node.component);
  if (!component) return undefined;
  const found = (key: string, height: number, note = ''): Height => ({
    height,
    from: `inventory ${component.name} ${key}${note}`,
    estimated: false,
    lines: 0,
  });
  // A field with no visible label is its box alone.
  if (isField(component) && !node.text) {
    for (const key of keys(component, node.size)) {
      const height = component.box?.[`${key}/box`]?.height;
      if (height) return found(`${key}/box`, height, ' (no visible label)');
    }
  }
  const whole = entry(component, node.size, (b) => b.height);
  if (whole) return found(whole.key, whole.value);
  const grown = grownField(component, node.size, s);
  if (grown) return grown;
  const part = keys(component, node.size)
    .map((key) => [key, component.box?.[`${key}/box`]?.height] as const)
    .find(([, height]) => height);
  if (part?.[1]) return found(`${part[0]}/box`, part[1]);
  return undefined;
}

/** A table's header and a short first page of its measured rows. */
function rowsHeight(node: DesignNode, s: Sizes): Height | undefined {
  const box = s.byName.get(node.component)?.box;
  const header = box?.header?.height;
  const row = box?.row?.height;
  if (!header || !row) return undefined;
  return {
    height: header + TABLE_ROWS * row,
    from: `inventory ${node.component} header and ${TABLE_ROWS} rows`,
    estimated: true,
    lines: 0,
  };
}

/**
 * A leaf's height: a measured inventory height wins even over a fixed one
 * (DESIGN-002 warns about the difference), then fixed, declared, rows, text.
 */
export function leafHeight(node: DesignNode, width: number, s: Sizes): Height {
  const declared = s.newComponents.get(node.newComponent)?.box;
  let result = inventoryHeight(node, s) ??
    (node.box.height === 'fixed'
      ? { height: node.box.heightPx, from: 'fixed', estimated: false, lines: 0 }
      : undefined) ??
    (declared?.height === 'fixed'
      ? {
          height: declared.heightPx,
          from: `declared ${node.newComponent}`,
          estimated: false,
          lines: 0,
        }
      : undefined) ??
    rowsHeight(node, s) ??
    (node.text || node.typeScale !== 'none'
      ? textHeight(node.text, node.typeScale, width, s)
      : undefined) ?? {
      height: UNKNOWN_HEIGHT_PX,
      from: `no height, ${UNKNOWN_HEIGHT_PX} assumed`,
      estimated: true,
      lines: 0,
    };
  const component = s.byName.get(node.component);
  const min = Math.max(
    node.box.minHeightPx,
    declared?.minHeightPx ?? 0,
    (component && entry(component, node.size, (b) => b.minHeight)?.value) ?? 0,
  );
  if (min > result.height)
    result = {
      ...result,
      height: min,
      from: `${result.from}, raised to min ${min}`,
    };
  return result;
}

const pad = (box: Box | undefined): Padding => box?.padding ?? NO_PADDING;

/** A design-system leaf's own padding at its size, e.g. a Button's 6 8. */
export function leafPadding(node: DesignNode, s: Sizes): Padding {
  const component = s.byName.get(node.component);
  if (!component) return NO_PADDING;
  const key = keys(component, node.size).find((k) => component.box?.[k]);
  return pad(key === undefined ? undefined : component.box?.[key]);
}

/** What a design-system or new component draws around the child nodes it holds. */
export function chrome(node: DesignNode, s: Sizes): Chrome {
  const declared = s.newComponents.get(node.newComponent)?.box;
  if (declared) {
    const all = s.spacing(declared.padding);
    return { padding: [all, all, all, all], band: 0, estimated: false };
  }
  const box = s.byName.get(node.component)?.box ?? {};
  switch (node.component) {
    case 'Card':
    case 'Popover':
      return { padding: pad(box.default), band: 0, estimated: false };
    case 'Section':
      // The header shows only with a title; the section's gap parts it from the content.
      return {
        padding: pad(box.default),
        band: node.text
          ? (box.header?.height ?? 0) + (box.default?.gap ?? 0)
          : 0,
        estimated: false,
      };
    case 'Accordion': {
      // One open item: the header band includes the item's top padding.
      const padding = pad(box.header);
      return {
        padding,
        band: (box.header?.height ?? 0) - padding[0],
        estimated: false,
      };
    }
    case 'Tabs':
      // The gap between the tab list and the panel is not measured.
      return {
        padding: pad(box.panel),
        band: box.list?.height ?? 0,
        estimated: true,
      };
    case 'Dialog': {
      const size = node.size || 'md';
      return {
        padding: pad(box[`${size}/body`]),
        band: box[`${size}/header`]?.height ?? 0,
        estimated: false,
      };
    }
    default:
      return { padding: NO_PADDING, band: 0, estimated: false };
  }
}

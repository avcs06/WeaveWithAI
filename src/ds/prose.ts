import type { Box, Inventory, InventoryComponent } from './inventory';

/** `helpText` reads as `help text`. */
const words = (name: string) =>
  name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();

function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.split(/(?<=[^\s][.!?])\s+(?=[A-Z`])/)[0] ?? '';
}

function dims({ height, width, minHeight }: Box): string {
  let text = '';
  if (height !== undefined && width !== undefined)
    text =
      height === width ? `${height} square` : `${width} wide and ${height} tall`;
  else if (height !== undefined) text = `${height} tall`;
  else if (width !== undefined) text = `${width} wide`;
  if (minHeight === undefined) return text;
  return text ? `${text}, at least ${minHeight}` : `at least ${minHeight} tall`;
}

/** Padding as CSS writes it: one value when all sides match, two for block and inline. */
function spacing({ padding, gap }: Box): string[] {
  const parts: string[] = [];
  if (padding) {
    const [top, right, bottom, left] = padding;
    const sides =
      top === bottom && right === left
        ? top === right
          ? [top]
          : [top, right]
        : padding;
    parts.push(`padding ${sides.join(' ')}`);
  }
  if (gap !== undefined) parts.push(`gap ${gap}`);
  return parts;
}

/** A part of a state (`sm+error/box`) equal to the same part without it (`sm/box`). */
function repeated(box: Record<string, Box>, key: string): boolean {
  const base = key.replace(/\+[^/]*/, '');
  return (
    base !== key &&
    key.includes('/') &&
    JSON.stringify(box[base]) === JSON.stringify(box[key])
  );
}

/** `sm/box` reads as `sm box`, `sm+error` as `sm with error`, `default` says nothing. */
function boxes(box: Record<string, Box>): string {
  return Object.entries(box)
    .filter(([key]) => !repeated(box, key))
    .map(([key, value]) => {
      const label =
        key === 'default'
          ? ''
          : `${key.replace(/\//g, ' ').replace(/\+/g, ' with ')} `;
      const said = [dims(value), ...spacing(value)].filter(Boolean);
      return `${label}${said.join(', ')}`;
    })
    .join('; ');
}

function facts(component: InventoryComponent): string[] {
  const lines: string[] = [];
  const variants = Object.entries(component.variants).map(([prop, values]) => {
    const fallback = component.defaults?.[prop];
    const suffix = fallback === undefined ? '' : ` (default ${fallback})`;
    return `${prop} ${values.join('|')}${suffix}`;
  });
  if (variants.length) lines.push(`Variants: ${variants.join('; ')}.`);
  if (component.looks) {
    const [fallback] = component.looks;
    const named = component.looks
      .filter(Boolean)
      .map((look) => (look === fallback ? `${look} (default)` : look));
    lines.push(`Looks: ${named.join(', ')}${fallback === '' ? '; default none' : ''}.`);
  }
  if (component.slots?.length)
    lines.push(`Shows: ${component.slots.map(words).join(', ')}.`);
  if (component.contains?.length)
    lines.push(`Contains: ${component.contains.join(', ')}.`);
  if (component.box) lines.push(`Boxes: ${boxes(component.box)}.`);
  return lines;
}

function block(component: InventoryComponent, indent: string): string[] {
  return [
    `${indent}${component.name}: ${firstSentence(component.description)}`,
    ...facts(component).map((line) => `${indent}  ${line}`),
  ];
}

/**
 * The inventory for a prompt: one block per component, the facts a design
 * needs on short lines, subcomponents indented under the one they belong to.
 */
export function inventoryProse(inv: Inventory): string {
  const byCategory = new Map<string, InventoryComponent[]>();
  for (const component of inv.components)
    byCategory.set(component.category, [
      ...(byCategory.get(component.category) ?? []),
      component,
    ]);
  const lines: string[] = [];
  for (const [category, members] of [...byCategory].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const main = members.find((c) => c.name === category) ?? members[0];
    if (!main) continue;
    const rest = members
      .filter((c) => c !== main)
      .sort((a, b) => a.name.localeCompare(b.name));
    lines.push(...block(main, ''), ...rest.flatMap((c) => block(c, '  ')));
  }
  return lines.join('\n');
}

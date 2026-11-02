import type { Inventory, InventoryComponent } from './inventory';

function firstSentence(text: string): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.split(/(?<=[^\s][.!?])\s+(?=[A-Z`])/)[0] ?? '';
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
  // The theme fits a header or footer to a default-size button; it needs no other size.
  if (component.name === 'Button' && component.box)
    lines.push(
      `Heights: ${Object.entries(component.box)
        .map(([size, box]) => `${size} ${box.height}`)
        .join(', ')}.`,
    );
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

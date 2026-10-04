import type { ComponentDoc } from 'react-docgen-typescript';

import type { ComponentProp } from '../../types.js';

/** Parses a prop's printed type as a pure string-literal union, e.g. `"a" | "b"` — this is what makes it "variant-like". */
function stringUnionValues(type: string): string[] | undefined {
  const literals: string[] = [];
  for (const part of type.split('|').map((p) => p.trim())) {
    const match = /^'([^']*)'$/.exec(part) ?? /^"([^"]*)"$/.exec(part);
    if (!match) return undefined;
    literals.push(match[1] ?? '');
  }
  return literals.length > 0 ? literals : undefined;
}

/**
 * A prop inherited from an intersected native type (`ButtonHTMLAttributes`,
 * `AriaAttributes`, ...) reports a `parent` pointing into `node_modules`
 * (React's own `.d.ts`) — vs. `undefined` or a project file for a prop the
 * component actually declares itself. Without this filter, `variantProps`
 * fills up with every inherited attribute that happens to also be a
 * literal union (`type`, `translate`, `popover`, assorted `aria-*`), not
 * just the ones the design system defines — confirmed against a real
 * component whose `ButtonProps` intersects `ButtonHTMLAttributes`.
 */
function isOwnProp(prop: ComponentDoc['props'][string]): boolean {
  return !prop.parent?.fileName.includes('/node_modules/');
}

export function toProps(props: ComponentDoc['props']): ComponentProp[] {
  return Object.values(props)
    .filter(isOwnProp)
    .map((prop) => {
      // `raw` carries the original type text (e.g. a resolved `keyof typeof X` union);
      // `name` alone collapses those to the unhelpful literal `"enum"`.
      const type = prop.type.raw ?? prop.type.name;
      return {
        name: prop.name,
        type,
        required: prop.required,
        default: prop.defaultValue?.value !== undefined ? String(prop.defaultValue.value) : undefined,
        description: prop.description || undefined,
        allowedValues: stringUnionValues(type),
      };
    });
}

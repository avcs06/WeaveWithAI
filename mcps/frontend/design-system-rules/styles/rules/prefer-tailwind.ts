import type { ObjectExpression } from '@babel/types';

import type { Finding, Rule, TailwindEquivalent } from '../../../types.js';
import type { StyleObject } from '../../styles-adapter.js';

type Candidate = { className: string; entries: [string, string][]; order: number };
const indexes = new WeakMap<TailwindEquivalent[], Map<string, Candidate[]>>();

function getIndex(equivalents: TailwindEquivalent[]): Map<string, Candidate[]> {
  const cached = indexes.get(equivalents);
  if (cached) return cached;
  const index = new Map<string, Candidate[]>();
  equivalents.forEach(({ className, declarations }, order) => {
    const entries = Object.entries(declarations);
    const first = entries[0];
    if (!first) return;
    const key = `${first[0]}\0${first[1]}`;
    let candidates = index.get(key);
    if (!candidates) index.set(key, (candidates = []));
    candidates.push({ className, entries, order });
  });
  indexes.set(equivalents, index);
  return index;
}

function checkTailwindEquivalents(object: ObjectExpression, equivalents: TailwindEquivalent[]): Finding[] {
  if (!equivalents.length) return [];
  const index = getIndex(equivalents);
  const findings: Finding[] = [];
  const values = new Map<string, { value: string | number; node: ObjectExpression['properties'][number] }>();
  for (const property of object.properties) {
    if (property.type !== 'ObjectProperty' || property.computed) continue;
    const key =
      property.key.type === 'Identifier'
        ? property.key.name
        : property.key.type === 'StringLiteral'
          ? property.key.value
          : undefined;
    if (!key) continue;
    const value = property.value;
    if (value.type === 'ObjectExpression') {
      if (!['selectors', '@media', '@supports', '@container', '@layer'].includes(key))
        findings.push(...checkTailwindEquivalents(value, equivalents));
    } else if (value.type === 'StringLiteral' || value.type === 'NumericLiteral') {
      values.set(key, { value: value.value, node: property });
    } else if (value.type === 'TemplateLiteral' && !value.expressions.length) {
      values.set(key, { value: value.quasis[0]?.value.cooked ?? '', node: property });
    }
  }
  const reported = new Set<string>();
  const candidates: Candidate[] = [];
  for (const [key, { value }] of values) {
    const normalized =
      typeof value === 'number'
        ? ['zIndex', 'flexGrow', 'flexShrink'].includes(key)
          ? String(value)
          : `${value}px`
        : value;
    const matches = index.get(`${key}\0${normalized}`);
    if (matches) candidates.push(...matches);
  }
  candidates.sort((a, b) => a.order - b.order);
  for (const { className, entries } of candidates) {
    if (
      !entries.length ||
      !entries.every(([key, expected]) => {
        const value = values.get(key)?.value;
        if (typeof value === 'string') return value === expected && !value.includes('!important');
        if (typeof value !== 'number') return false;
        return (
          (['zIndex', 'flexGrow', 'flexShrink'].includes(key) ? String(value) : `${value}px`) === expected
        );
      })
    )
      continue;
    if (entries.every(([key]) => reported.has(key))) continue;
    const node = values.get(entries[0]![0])!.node;
    findings.push({
      rule: 'prefer-tailwind',
      severity: 'error',
      surface: 'vanilla-extract',
      line: node.loc?.start.line ?? 0,
      column: (node.loc?.start.column ?? 0) + 1,
      message: `Use the allowed Tailwind class "${className}" instead of these equivalent vanilla-extract declarations.`,
      suggestion: className,
    });
    entries.forEach(([key]) => reported.add(key));
  }
  return findings;
}

/** A declaration set an allowed Tailwind class expresses exactly must use that class instead. */
export const preferTailwind: Rule<StyleObject> = ({ object, policy }) =>
  checkTailwindEquivalents(object, policy.tailwindEquivalents ?? []);

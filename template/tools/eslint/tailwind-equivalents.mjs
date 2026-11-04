import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const resolveConfig = require('tailwindcss/resolveConfig');
const { createContext } = require('tailwindcss/lib/lib/setupContextUtils');
const { generateRules } = require('tailwindcss/lib/lib/generateRules');

export function createTailwindEquivalents(allowedClasses) {
  const context = createContext(
    resolveConfig({
      presets: [require('../../tailwind.preset.cjs')],
      content: [],
    }),
  );
  const equivalents = [];
  for (const className of allowedClasses) {
    const rules = [...generateRules(new Set([className]), context)].map(
      ([, rule]) => rule,
    );
    if (rules.length !== 1 || rules[0].type !== 'rule') continue;
    const declarations = {};
    let supported = true;
    for (const node of rules[0].nodes) {
      if (
        node.type !== 'decl' ||
        node.important ||
        node.prop.startsWith('--')
      ) {
        supported = false;
        break;
      }
      const property = node.prop.replace(/-([a-z])/g, (_, letter) =>
        letter.toUpperCase(),
      );
      declarations[property] = node.value;
    }
    if (supported && Object.keys(declarations).length)
      equivalents.push({ className, declarations });
  }
  return equivalents;
}

const unitless = new Set(['zIndex', 'flexGrow', 'flexShrink']);

export function matchesCssValue(property, value, expected) {
  if (typeof value === 'string')
    return value === expected && !value.includes('!important');
  if (typeof value !== 'number') return false;
  return (unitless.has(property) ? String(value) : `${value}px`) === expected;
}

export function indexEquivalents(equivalents) {
  const index = new Map();
  equivalents.forEach(({ className, declarations }, order) => {
    const entries = Object.entries(declarations);
    if (!entries.length) return;
    const key = `${entries[0][0]}\0${entries[0][1]}`;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push({ className, entries, order });
  });
  return index;
}

export function equivalentCandidates(index, values) {
  const candidates = [];
  for (const [property, { value }] of values) {
    const normalized =
      typeof value === 'number'
        ? unitless.has(property)
          ? String(value)
          : `${value}px`
        : value;
    const matches = index.get(`${property}\0${normalized}`);
    if (matches) candidates.push(...matches);
  }
  return candidates.sort((a, b) => a.order - b.order);
}

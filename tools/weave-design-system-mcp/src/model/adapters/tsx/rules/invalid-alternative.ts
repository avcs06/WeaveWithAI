import { basename, dirname, relative } from 'node:path';

import type { ComponentContract, Rule } from '../../../types.js';
import { position } from '../../ast.js';
import type { JsxAttribute, JsxElement, JsxImport } from '../../tsx-adapter.js';

/** One parsed `@invalidAlternative` selector, e.g. `button`, `div.flex` or `Input[type="password"]`. */
interface AlternativeMatcher {
  /** Tag name as written (`input` is the element, `Input` a component), or `undefined` for a selector with no tag (`.flex`). */
  tag?: string;
  /** Classes that must *all* be present on the element. Empty means the tag alone is enough. */
  classNames: string[];
  /**
   * Attributes that must *all* be present; one with a `value` must be set to
   * that literal — exactly, or containing it with `contains`, ignoring case
   * with `ignoreCase`.
   */
  attributes: { name: string; value?: string; contains?: boolean; ignoreCase?: boolean }[];
  /** The declaration as written, for the finding's message. */
  source: string;
  /** The design system component that supersedes this. */
  owner: string;
}

/** Invalid alternatives indexed for lookup, built once per design system. */
export interface InvalidAlternativeOwners {
  /** Package imports superseded by a design-system component. */
  byImport: Map<string, string>;
  /** Lowercased tag -> matchers naming that tag. */
  byTag: Map<string, AlternativeMatcher[]>;
  /** Matchers naming classes but no tag, so they apply to any element. */
  anyTag: AlternativeMatcher[];
  /** Owner -> its component folder (or file); code inside it implements the owner and may use what it supersedes. */
  ownerScopes: Map<string, string>;
}

/** `import('package')`: everything imported from that package. */
const IMPORT_DECLARATION = /^import\(\s*(['"])([^'"]+)\1\s*\)$/;
const SELECTOR_TAG = /^[A-Za-z][A-Za-z0-9_-]*/;
/**
 * One `.class` (a `-[...]` arbitrary value stays part of it) or
 * `[name]` / `[name="value"]` / `[name*="value"]` segment, optionally ending in
 * ` i` to ignore case.
 */
const SELECTOR_PART =
  /\.((?:-\[[^\]]*\]|[^.[\]\s])+)|\[\s*([A-Za-z_][\w:.-]*)\s*(?:(\*?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s"']+)))?(?:\s+(i))?\s*\]/y;

/**
 * Parses one declaration into a matcher. The syntax is the familiar CSS
 * shape — a tag, then any number of `.class` and `[attribute]` segments:
 *
 *   `button`                  any <button>
 *   `MuiButton`               another library's component
 *   `div.flex`                a <div> carrying the class "flex"
 *   `div.flex.gap-2`          a <div> carrying both classes
 *   `.flex`                   any element carrying "flex"
 *   `Input[type="password"]`  the Input component with type="password"
 *   `input[disabled]`         an <input> with a disabled attribute
 *   `Input[placeholder*="search" i]`
 *                             an Input whose placeholder contains "search",
 *                             in any case
 *
 * Tags are case-sensitive, as in JSX: `input` is the native element and
 * `Input` a component. An attribute value only matches a literal written on
 * the element. The classes are plain literals the author wrote; nothing here
 * knows or cares about a utility-class convention, and matching works
 * whether or not `classNames` is configured.
 */
function parseAlternative(source: string, owner: string): AlternativeMatcher | undefined {
  const text = source.trim().replace(/[<>]/g, '');
  const tag = SELECTOR_TAG.exec(text)?.[0];
  const classNames: string[] = [];
  const attributes: AlternativeMatcher['attributes'] = [];

  SELECTOR_PART.lastIndex = tag?.length ?? 0;
  while (SELECTOR_PART.lastIndex < text.length) {
    const part = SELECTOR_PART.exec(text);
    if (!part) return undefined; // not a selector this check can act on
    if (part[1]) classNames.push(part[1]);
    else
      attributes.push({
        name: part[2]!,
        value: part[4] ?? part[5] ?? part[6],
        contains: part[3] === '*=',
        ignoreCase: part[7] === 'i',
      });
  }

  if (!tag && classNames.length === 0 && attributes.length === 0) return undefined;
  return { tag, classNames, attributes, source: text, owner };
}

/** How a matcher reads back in a message: `<button>`, `<div className="flex">` or `<Input type="password">`. */
function describeMatcher(matcher: AlternativeMatcher): string {
  const parts = [matcher.tag ?? '*'];
  if (matcher.classNames.length) parts.push(`className="${matcher.classNames.join(' ')}"`);
  for (const { name, value, contains } of matcher.attributes)
    parts.push(value === undefined ? name : contains ? `${name} containing "${value}"` : `${name}="${value}"`);
  return `<${parts.join(' ')}>`;
}

function addMatcher(owners: InvalidAlternativeOwners, matcher: AlternativeMatcher): void {
  if (!matcher.tag) {
    owners.anyTag.push(matcher);
    return;
  }
  const existing = owners.byTag.get(matcher.tag);
  if (existing) existing.push(matcher);
  else owners.byTag.set(matcher.tag, [matcher]);
}

/**
 * Flattens every component's invalid alternatives into one index, so
 * checking a JSX tag costs a hash lookup plus a scan of only the matchers
 * that name that tag, however many components declare however many
 * alternatives.
 *
 * Built once per design system rather than per `validate` call.
 */
export function buildInvalidAlternativeOwners(components: ComponentContract[]): InvalidAlternativeOwners {
  const owners: InvalidAlternativeOwners = {
    byTag: new Map(),
    anyTag: [],
    byImport: new Map(),
    ownerScopes: new Map(),
  };

  for (const component of components) {
    if (component.filePath) {
      // A barrel speaks for its whole folder; any other file only for itself.
      const isBarrel = /^index\.[cm]?[jt]sx?$/.test(basename(component.filePath));
      owners.ownerScopes.set(component.name, isBarrel ? dirname(component.filePath) : component.filePath);
    }
    for (const source of component.invalidAlternatives) {
      const importSource = IMPORT_DECLARATION.exec(source)?.[2];
      if (importSource) {
        owners.byImport.set(importSource, component.name);
        continue;
      }
      const matcher = parseAlternative(source, component.name);
      if (matcher) addMatcher(owners, matcher);
    }
  }

  return owners;
}

/** Is `filePath` inside the owner's own implementation, which has to use what it supersedes? */
function isOwnerFile(owners: InvalidAlternativeOwners, owner: string, filePath: string | undefined): boolean {
  const scope = owners.ownerScopes.get(owner);
  return Boolean(filePath && scope && !relative(scope, filePath).startsWith('..'));
}

/** Present, and — when the matcher names a value — set to a literal equal to it, or containing it. */
function attributeMatches(
  attribute: JsxAttribute | undefined,
  { value, contains, ignoreCase }: AlternativeMatcher['attributes'][number],
): boolean {
  if (!attribute) return false;
  if (value === undefined) return true;
  if (attribute.value === undefined) return false;
  const [actual, wanted] = ignoreCase ? [attribute.value.toLowerCase(), value.toLowerCase()] : [attribute.value, value];
  return contains ? actual.includes(wanted) : actual === wanted;
}

const specificity = (matcher: AlternativeMatcher) => matcher.classNames.length + matcher.attributes.length;

/**
 * The best matcher for an element, or `undefined`. "Best" is the most
 * specific: the matcher naming more classes and attributes wins, so
 * `div.flex` beats a bare `div` and the reader is pointed at the
 * closer-fitting component.
 */
function bestMatch(
  tag: string,
  classes: Set<string> | undefined,
  attributes: Map<string, JsxAttribute>,
  owners: InvalidAlternativeOwners,
  filePath: string | undefined,
): AlternativeMatcher | undefined {
  const candidates = [...(owners.byTag.get(tag) ?? []), ...owners.anyTag];

  let best: AlternativeMatcher | undefined;
  for (const matcher of candidates) {
    // A component naming itself would be a config mistake, but reporting it
    // would be worse — it would tell the reader to replace `X` with `X`.
    if (matcher.owner === tag) continue;
    if (isOwnerFile(owners, matcher.owner, filePath)) continue;
    if (matcher.classNames.some((name) => !classes?.has(name))) continue;
    if (matcher.attributes.some((expected) => !attributeMatches(attributes.get(expected.name), expected))) continue;

    if (!best || specificity(matcher) > specificity(best)) {
      best = matcher;
    }
  }
  return best;
}

/**
 * Reaching for a raw `<button>`, a `<div className="flex">`, or some other
 * library's Button, when the design system has a component for exactly that
 * is the "wrong implementation" case — the component exists precisely so
 * this doesn't happen. Always an error: the component declares this an
 * invalid alternative to itself.
 *
 * Runs for every tag, not just lowercase ones: what a component supersedes
 * can be a native element or another component, and both are equally wrong
 * to reach for.
 */
export const invalidAlternativeElement: Rule<JsxElement> = ({ node, tag, classes, attributes, owners, filePath }) => {
  const match = bestMatch(tag, classes, attributes, owners, filePath);
  if (!match) return [];

  const used = describeMatcher({ ...match, tag });
  return [
    {
      rule: 'invalid-alternative',
      severity: 'error',
      surface: 'jsx',
      ...position(node),
      message: `Use the ${match.owner} component instead of ${used} — ${match.owner} declares ${match.source} an invalid alternative to itself.`,
      suggestion: match.owner,
    },
  ];
};

/** Importing a package a component declares superseded, e.g. `import('@radix-ui/react-tabs')`. */
export const invalidAlternativeImport: Rule<JsxImport> = ({ node, owners, designSystem, filePath }) => {
  const owner = owners.byImport.get(node.source.value);
  // Composing a superseded package is the design system's own job; only its consumers are pointed at the owner.
  if (!owner || designSystem || isOwnerFile(owners, owner, filePath)) return [];
  return [
    {
      rule: 'invalid-alternative',
      severity: 'error',
      surface: 'jsx',
      ...position(node),
      message: `Use the ${owner} component instead of importing directly from ${node.source.value}.`,
      suggestion: owner,
    },
  ];
};

import { basename, dirname, relative } from 'node:path';

import type { Node } from '@babel/types';

import type { ComponentContract, Finding, Rule } from '../../../types.js';
import { position } from '../../ast.js';
import type { JsxElement, JsxImport } from '../../tsx-adapter.js';

/** `.class` and `[attribute]` tests that must *all* hold. */
interface Compound {
  /** Classes that must all be present on the element. */
  classNames: string[];
  /**
   * Attributes that must all be present; one with a `value` must be set to
   * that literal — exactly, or containing it with `contains`, ignoring case
   * with `ignoreCase`.
   */
  attributes: { name: string; value?: string; contains?: boolean; ignoreCase?: boolean }[];
}

/** One parsed element selector, e.g. `button`, `div.flex`, `Input[type="password"]` or `a:not([href])`. */
interface AlternativeMatcher extends Compound {
  /**
   * Tag name as written (`input` is the element, `Input` a component,
   * `Form.Item` a member of one), or `undefined` for a selector with no tag
   * (`.flex`).
   */
  tag?: string;
  /** `:not(…)` parts: the element matches only when the code shows none of them holds. */
  not: Compound[];
  /** The declaration as written, for the finding's message. */
  source: string;
  /** The design system component that supersedes this. */
  owner: string;
}

/** One parsed `import('…')` declaration. */
interface ImportMatcher {
  /** Names one package, with no `*`; it wins over a wildcard covering the same package. */
  exact: boolean;
  /** Whether a module specifier falls under it, exactly or through its `*` wildcards. */
  matches: (specifier: string) => boolean;
  /** The named exports it covers (`default` for a default export), or `undefined` for the whole package. */
  names?: Set<string>;
  source: string;
  owner: string;
}

/** Invalid alternatives indexed for lookup, built once per design system. */
export interface InvalidAlternativeOwners {
  /** Packages, or named exports of them, superseded by a design-system component. Several owners may share a package. */
  imports: ImportMatcher[];
  /** Tag -> matchers naming that tag. */
  byTag: Map<string, AlternativeMatcher[]>;
  /** Matchers naming classes but no tag, so they apply to any element. */
  anyTag: AlternativeMatcher[];
  /** Owner -> its component folder (or file); code inside it implements the owner and may use what it supersedes. */
  ownerScopes: Map<string, string>;
  /** Declarations this check can't act on, one line each, for a config check to fail on. */
  diagnostics: string[];
}

/** `import('package')`, optionally followed by `{A, B}`: only those named exports of it. */
const IMPORT_DECLARATION = /^import\(\s*(['"])([^'"]+)\1\s*\)\s*(?:\{([^}]*)\})?$/;
const EXPORT_NAME = /^[A-Za-z_$][\w$]*$/;
/** A tag: `input`, `Input`, or a member of a component such as `Form.Item` (a capitalized segment; a lowercase one is a class). */
const SELECTOR_TAG = /^(?:[A-Z][\w-]*(?:\.[A-Z]\w*)*|[a-z][\w-]*)/;
/**
 * One `.class` (a `-[...]` arbitrary value stays part of it),
 * `[name]` / `[name="value"]` / `[name*="value"]` segment, optionally ending in
 * ` i` to ignore case, or `:not(…)` holding classes and attributes.
 */
const SELECTOR_PART =
  /\.((?:-\[[^\]]*\]|(?!:not\()[^.[\]\s])+)|\[\s*([A-Za-z_][\w:.-]*)\s*(?:(\*?=)\s*(?:"([^"]*)"|'([^']*)'|([^\]\s"']+)))?(?:\s+(i))?\s*\]|:not\(([^()]*)\)/y;
/** Attributes whose values HTML compares in any case. */
const CASE_INSENSITIVE = new Set(['type', 'role', 'inputMode', 'popover']);

/** Reads `.class`, `[attribute]` and, where `not` is given, `:not(…)` parts into `into`; `false` if any part isn't one. */
function parseParts(text: string, into: Compound, not?: Compound[]): boolean {
  const part = new RegExp(SELECTOR_PART.source, 'y');
  while (part.lastIndex < text.length) {
    const match = part.exec(text);
    if (!match) return false;
    if (match[1]) into.classNames.push(match[1]);
    else if (match[2])
      into.attributes.push({
        name: match[2],
        value: match[4] ?? match[5] ?? match[6],
        contains: match[3] === '*=',
        ignoreCase: match[7] === 'i',
      });
    else {
      const negated: Compound = { classNames: [], attributes: [] };
      const inner = match[8]!.trim();
      if (!not || !inner || !parseParts(inner, negated)) return false;
      not.push(negated);
    }
  }
  return true;
}

/**
 * Parses one declaration into a matcher, or `undefined` when it isn't one.
 * The syntax is the familiar CSS shape — a tag, then any number of `.class`,
 * `[attribute]` and `:not(…)` segments:
 *
 *   `button`                  any <button>
 *   `MuiButton`               another library's component
 *   `Form.Item`               a member of another library's component
 *   `div.flex`                a <div> carrying the class "flex"
 *   `div.flex.gap-2`          a <div> carrying both classes
 *   `.flex`                   any element carrying "flex"
 *   `Input[type="password"]`  the Input component with type="password"
 *   `input[disabled]`         an <input> with a disabled attribute
 *   `Input[placeholder*="search" i]`
 *                             an Input whose placeholder contains "search",
 *                             in any case
 *   `a:not([href])`           an <a> with no href
 *
 * Tags are case-sensitive, as in JSX: `input` is the native element and
 * `Input` a component. An attribute value matches a literal written on the
 * element: a string, number or boolean, an expression-free template, either
 * branch of a conditional, or a key of a spread object literal. The classes
 * are plain literals the author wrote; nothing here knows or cares about a
 * utility-class convention, and matching works whether or not `classNames`
 * is configured.
 */
function parseAlternative(source: string, owner: string): AlternativeMatcher | undefined {
  const text = source.trim().replace(/[<>]/g, '');
  const tag = SELECTOR_TAG.exec(text)?.[0];
  const matcher: AlternativeMatcher = { tag, classNames: [], attributes: [], not: [], source: text, owner };

  if (!parseParts(text.slice(tag?.length ?? 0), matcher, matcher.not)) return undefined;
  if (!tag && matcher.classNames.length === 0 && matcher.attributes.length === 0) return undefined;
  return matcher;
}

/** `import('*\/components/ui/button')` matches under any alias or relative prefix; `import('@radix-ui/react-*')` any package of the scope. */
function specifierMatcher(pattern: string): (specifier: string) => boolean {
  if (!pattern.includes('*')) return (specifier) => specifier === pattern;
  const anyPrefix = pattern.startsWith('*/');
  const body = (anyPrefix ? pattern.slice(2) : pattern)
    .split('*')
    .map((piece) => piece.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  const regExp = new RegExp(`^${anyPrefix ? '(?:.*/)?' : ''}${body}$`);
  return (specifier) => regExp.test(specifier);
}

function describeCompound({ classNames, attributes }: Compound): string[] {
  const parts = classNames.length ? [`className="${classNames.join(' ')}"`] : [];
  for (const { name, value, contains } of attributes)
    parts.push(
      value === undefined ? name : contains ? `${name} containing "${value}"` : `${name}="${value}"`,
    );
  return parts;
}

/** How a matcher reads back in a message: `<button>`, `<div className="flex">` or `<a> without href`. */
function describeMatcher(matcher: AlternativeMatcher): string {
  const element = `<${[matcher.tag ?? '*', ...describeCompound(matcher)].join(' ')}>`;
  const without = matcher.not.map((compound) => describeCompound(compound).join(' '));
  return without.length ? `${element} without ${without.join(' or ')}` : element;
}

/** How a message names the owner: `the Button component`, `the useController hook`. */
function describeOwner(owner: string): string {
  if (/^use[A-Z0-9]/.test(owner)) return `the ${owner} hook`;
  return /^[A-Z]/.test(owner) ? `the ${owner} component` : owner;
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

/** Why a declaration can't be read, for the diagnostic. */
function unreadable(source: string): string {
  if (source.startsWith('@')) return "write a package as import('…')";
  if (source.startsWith('import'))
    return "expected import('package') or import('package'){Name, …} with export names";
  return 'expected a tag, then .class, [attribute] and :not(…) parts';
}

/**
 * Flattens every component's invalid alternatives into one index, so
 * checking a JSX tag costs a hash lookup plus a scan of only the matchers
 * that name that tag, however many components declare however many
 * alternatives.
 *
 * Built once per design system rather than per `validate` call. A
 * declaration it can't read, or one a second owner repeats, becomes a
 * diagnostic instead of being dropped.
 */
export function buildInvalidAlternativeOwners(components: ComponentContract[]): InvalidAlternativeOwners {
  const owners: InvalidAlternativeOwners = {
    imports: [],
    byTag: new Map(),
    anyTag: [],
    ownerScopes: new Map(),
    diagnostics: [],
  };
  const declaredBy = new Map<string, string>();

  // The first owner of a declaration is the one a finding names.
  const claim = (key: string, owner: string, source: string): boolean => {
    const first = declaredBy.get(key);
    if (first && first !== owner) {
      owners.diagnostics.push(
        `${owner}: @invalidAlternative ${source} is also declared by ${first}, which wins`,
      );
      return false;
    }
    declaredBy.set(key, owner);
    return true;
  };

  for (const component of components) {
    if (component.filePath) {
      // A barrel speaks for its whole folder; any other file only for itself.
      const isBarrel = /^index\.[cm]?[jt]sx?$/.test(basename(component.filePath));
      owners.ownerScopes.set(component.name, isBarrel ? dirname(component.filePath) : component.filePath);
    }
    for (const source of component.invalidAlternatives) {
      const imported = IMPORT_DECLARATION.exec(source);
      const names = imported?.[3]
        ?.split(',')
        .map((name) => name.trim())
        .filter(Boolean);
      const matcher = imported ? undefined : parseAlternative(source, component.name);
      if (
        (!imported && !matcher) ||
        (names && !(names.length && names.every((name) => EXPORT_NAME.test(name))))
      ) {
        owners.diagnostics.push(
          `${component.name}: @invalidAlternative ${source} can't be read: ${unreadable(source)}`,
        );
        continue;
      }

      if (matcher) {
        if (claim(matcher.source, component.name, source)) addMatcher(owners, matcher);
        continue;
      }
      const specifier = imported![2]!;
      const unclaimed = (names ?? ['*']).filter((name) =>
        claim(`import('${specifier}'){${name}}`, component.name, source),
      );
      if (!unclaimed.length) continue;
      owners.imports.push({
        exact: !specifier.includes('*'),
        matches: specifierMatcher(specifier),
        names: names && new Set(unclaimed),
        source,
        owner: component.name,
      });
    }
  }

  return owners;
}

/** Is `filePath` inside the owner's own implementation, which has to use what it supersedes? */
function isOwnerFile(owners: InvalidAlternativeOwners, owner: string, filePath: string | undefined): boolean {
  const scope = owners.ownerScopes.get(owner);
  return Boolean(filePath && scope && !relative(scope, filePath).startsWith('..'));
}

/** Whether an attribute test holds: `true`, `false`, or `undefined` when the code doesn't say (a computed value, or a spread of unknown props). */
function attributeHolds(element: JsxElement, test: Compound['attributes'][number]): boolean | undefined {
  const attribute = element.attributes.get(test.name);
  if (!attribute) return element.openSpread ? undefined : false;
  if (test.value === undefined) return true;

  const ignoreCase = test.ignoreCase || CASE_INSENSITIVE.has(test.name);
  const fold = (value: string) => (ignoreCase ? value.toLowerCase() : value);
  const wanted = fold(test.value);
  const holds = attribute.values.some((value) =>
    test.contains ? fold(value).includes(wanted) : fold(value) === wanted,
  );
  return holds || (attribute.complete ? false : undefined);
}

/** Whether every test of a compound holds, with the same three answers as `attributeHolds`. */
function compoundHolds(element: JsxElement, compound: Compound): boolean | undefined {
  if (compound.classNames.some((name) => !element.classes?.has(name))) return false;
  let known = true;
  for (const test of compound.attributes) {
    const holds = attributeHolds(element, test);
    if (holds === false) return false;
    if (holds === undefined) known = false;
  }
  return known || undefined;
}

const weight = ({ classNames, attributes }: Compound) => classNames.length + attributes.length;

/**
 * Classes and attributes the element has, then those it lacks, then the
 * tag: `span[onClick]` beats `[role="button"]`, which beats `span`, and
 * `input[type="password"]` beats `input:not([type="hidden"])`.
 */
function moreSpecific(a: AlternativeMatcher, b: AlternativeMatcher): boolean {
  const rank = (matcher: AlternativeMatcher) => [
    weight(matcher),
    matcher.not.reduce((total, compound) => total + weight(compound), 0),
    matcher.tag ? 1 : 0,
  ];
  const [first, second] = [rank(a), rank(b)];
  const differs = first.findIndex((value, index) => value !== second[index]);
  return differs !== -1 && first[differs]! > second[differs]!;
}

/**
 * The best matcher for an element, or `undefined`. "Best" is the most
 * specific, so `div.flex` beats a bare `div` and the reader is pointed at
 * the closer-fitting component; between equals, the first declared.
 */
function bestMatch(element: JsxElement): AlternativeMatcher | undefined {
  const { tag, owners, filePath } = element;
  const candidates = [...(owners.byTag.get(tag) ?? []), ...owners.anyTag];

  let best: AlternativeMatcher | undefined;
  for (const matcher of candidates) {
    // A component naming itself would be a config mistake, but reporting it
    // would be worse — it would tell the reader to replace `X` with `X`.
    if (matcher.owner === tag) continue;
    if (isOwnerFile(owners, matcher.owner, filePath)) continue;
    if (compoundHolds(element, matcher) !== true) continue;
    if (matcher.not.some((compound) => compoundHolds(element, compound) !== false)) continue;

    if (!best || moreSpecific(matcher, best)) {
      best = matcher;
    }
  }
  return best;
}

function finding(node: Node, owner: string, used: string, declared?: string): Finding {
  return {
    rule: 'invalid-alternative',
    severity: 'error',
    surface: 'jsx',
    ...position(node),
    message: `Use ${describeOwner(owner)} instead of ${used}${declared ? ` — ${owner} declares ${declared} an invalid alternative to itself` : ''}.`,
    suggestion: owner,
  };
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
 * to reach for. Only the owner's own folder may use what it supersedes;
 * every other file, other design-system components included, is pointed at
 * the owner.
 */
export const invalidAlternativeElement: Rule<JsxElement> = (element) => {
  const match = bestMatch(element);
  if (!match) return [];
  return [finding(element.node, match.owner, describeMatcher({ ...match, tag: element.tag }), match.source)];
};

/**
 * Bringing in a package a component declares superseded, e.g.
 * `import('@radix-ui/react-tabs')`, or one of its exports named by
 * `import('@mui/material'){Button}` — in the import and wherever the file
 * renders or reads that export.
 */
export const invalidAlternativeImport: Rule<JsxImport> = ({
  node,
  source,
  uses,
  owners,
  importException,
  filePath,
}) => {
  // Only the owner's own folder may import what it supersedes, and the files
  // the config names as exceptions.
  if (importException) return [];
  const candidates = owners.imports
    .filter((matcher) => matcher.matches(source) && !isOwnerFile(owners, matcher.owner, filePath))
    .sort((a, b) => Number(b.exact) - Number(a.exact));

  const whole = candidates.find((matcher) => !matcher.names);
  if (whole) return [finding(node, whole.owner, `importing directly from ${source}`)];
  return uses.flatMap(({ name, node: use }) => {
    const named = candidates.find((matcher) => matcher.names?.has(name));
    if (!named) return [];
    return [
      finding(
        use,
        named.owner,
        name === 'default' ? `the default export of ${source}` : `${name} from ${source}`,
      ),
    ];
  });
};

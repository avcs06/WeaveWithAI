import type { Issue, Severity } from './issues';

export type Rule<I> = {
  id: string;
  severity: Severity;
  check: (input: I) => Issue[];
};
export type Fail = (message: string, at?: string) => Issue;

/** One validator rule: id, severity and a pure check. `fail` builds an issue that carries both. */
export function defineRule<I>(
  id: string,
  severity: Severity,
  check: (input: I, fail: Fail) => Issue[],
): Rule<I> {
  const fail: Fail = (message, at) => issue(id, severity, message, at);
  return { id, severity, check: (input) => check(input, fail) };
}

export function runRules<I>(rules: readonly Rule<I>[], input: I): Issue[] {
  return rules.flatMap((rule) => rule.check(input));
}

export function issue(
  rule: string,
  severity: Severity,
  message: string,
  at?: string,
): Issue {
  return at === undefined
    ? { rule, severity, message }
    : { rule, severity, message, at };
}

export const isCamel = (text: string): boolean =>
  /^[a-z][a-zA-Z0-9]*$/.test(text);
export const isPascal = (text: string): boolean =>
  /^[A-Z][a-zA-Z0-9]*$/.test(text);

/** The keys that occur more than once, each listed once, in first-seen order. */
export function duplicates<T>(
  items: readonly T[],
  key: (item: T) => string,
): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const item of items) {
    const k = key(item);
    if (seen.has(k)) repeated.add(k);
    seen.add(k);
  }
  return [...repeated];
}

import type { Expression } from '@babel/types';

import type { Finding, Rule, TailwindPolicy } from '../types.js';
import { position } from './ast.js';
import * as classNameStrings from './classnames/class-name-strings.js';
import { classListLimit } from './classnames/rules/class-list-limit.js';
import { forbiddenClass } from './classnames/rules/forbidden-class.js';
import { layoutOnly } from './classnames/rules/layout-only.js';
import { restrictedSyntax } from './classnames/rules/restricted-syntax.js';
import { unknownClass } from './classnames/rules/unknown-class.js';

/**
 * This file is a pure dispatcher — it contains no utility-class-convention
 * code of its own. Reading classes off a value lives under `classnames/`,
 * and every check is a rule under `classnames/rules/`, listed below. Class
 * names are always Tailwind; supporting another convention (Bootstrap,
 * whatever) means another set of rules — never touching the TSX adapter,
 * which only ever calls `check` and `classNameTokens`.
 */

/** What a className rule sees: one element's `className` value. */
export interface ClassNameValue {
  value: Expression;
  policy: TailwindPolicy;
  /** Design-system files may use only layout utilities, with no class-list limits. */
  designSystem: boolean;
}

/** A rule for one class at a time, returning the finding's rule and message when it objects. */
export type ClassRule = (
  className: string,
  subject: ClassNameValue,
) => { rule: string; message: string } | undefined;

/**
 * Each known scenario is one file under `classnames/rules/`, listed in the
 * registry it applies to. Every class goes through `classRules` in order and
 * is reported only by the first that objects; `valueRules` see the whole value.
 */
const classRules: ClassRule[] = [restrictedSyntax, forbiddenClass, layoutOnly, unknownClass];
const valueRules: Rule<ClassNameValue>[] = [classListLimit];

export function check(policy: TailwindPolicy, value: Expression, designSystem = false): Finding[] {
  const subject: ClassNameValue = { value, policy, designSystem };
  const strings: string[] = [];
  classNameStrings.collectClassNameStrings(value, strings);

  const findings: Finding[] = [];
  for (const str of strings) {
    for (const className of str.trim().split(/\s+/).filter(Boolean)) {
      for (const rule of classRules) {
        const objection = rule(className, subject);
        if (!objection) continue;
        findings.push({ ...objection, severity: 'error', surface: 'tailwind', ...position(value) });
        break;
      }
    }
  }
  return [...findings, ...valueRules.flatMap((rule) => rule(subject))];
}

/** The individual class names an element carries, across every string its `className` could produce. */
export function classNameTokens(value: Expression): Set<string> {
  return classNameStrings.classNameTokens(value);
}

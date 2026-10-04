import type { Expression } from '@babel/types';

import type { Finding, Rule } from '../../../types.js';
import { position } from '../../ast.js';
import type { ClassNameValue } from '../../classname-adapter.js';

const MOVE_TO_VANILLA_EXTRACT =
  'Move the styles to vanilla-extract; display, flex and alignment stay in Tailwind.';

/**
 * The class lists an element always carries: the value itself when it is a
 * static string, or a helper call's static string arguments. Strings behind
 * a condition, and variables, are not counted.
 */
function staticClassLists(node: Expression): string[] {
  const staticString = (value: Expression): string | undefined => {
    if (value.type === 'StringLiteral') return value.value;
    if (value.type === 'TemplateLiteral' && !value.expressions.length) return value.quasis[0]?.value.cooked ?? '';
    return undefined;
  };
  const value = staticString(node);
  if (value !== undefined) return [value];
  if (node.type !== 'CallExpression') return [];
  return node.arguments.flatMap((arg) => {
    const argValue = arg.type === 'SpreadElement' || arg.type === 'ArgumentPlaceholder' ? undefined : staticString(arg);
    return argValue === undefined ? [] : [argValue];
  });
}

/**
 * Outside design-system files, a static class list may be only so long and an
 * element may carry only so many of them; past that the styles belong in
 * vanilla-extract.
 */
export const classListLimit: Rule<ClassNameValue> = ({ value, policy, designSystem }) => {
  if (designSystem) return [];
  const maxLength = policy.maxClassListLength ?? 50;
  const maxLists = policy.maxClassListsPerElement ?? 2;
  const finding = (message: string): Finding => ({
    rule: 'tailwind-class-list-limit',
    severity: 'error',
    surface: 'tailwind',
    ...position(value),
    message,
  });

  const findings: Finding[] = [];
  const lists = staticClassLists(value);
  for (const list of lists) {
    const length = list.trim().split(/\s+/).join(' ').length;
    if (length > maxLength) {
      findings.push(
        finding(`This class list is ${length} characters; the maximum is ${maxLength}. ${MOVE_TO_VANILLA_EXTRACT}`),
      );
    }
  }
  if (lists.length > maxLists) {
    findings.push(
      finding(
        `This element has ${lists.length} static class lists; the maximum is ${maxLists}. ${MOVE_TO_VANILLA_EXTRACT}`,
      ),
    );
  }
  return findings;
};

import type { Severity } from '../core/issues';

/** One rendered-check result: the rule, how bad, what is wrong and where. */
export type Finding = {
  rule: string;
  severity: Severity;
  message: string;
  element?: string;
};

export const finding = (
  rule: string,
  severity: Severity,
  message: string,
  element?: string,
): Finding =>
  element === undefined
    ? { rule, severity, message }
    : { rule, severity, message, element };

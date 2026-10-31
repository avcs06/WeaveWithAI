import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { IaInput } from './design-helpers';

/**
 * DESIGN-021 · warning
 * Every app screen serves at least one flow step; marketing pages are exempt.
 * Pass: the book page serving F05.
 * Fail: a settings page serving nothing.
 */
export const rule = defineRule<IaInput>(
  'DESIGN-021',
  'warning',
  ({ ia }, fail) =>
    ia.screens
      .filter((s) => s.kind === 'app' && !s.flowSteps.length)
      .map((s) =>
        fail(
          `${s.id} serves no flow step; say which steps it serves or drop it.`,
          s.id,
        ),
      ),
);

import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { IaInput } from './helpers';

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
          `${s.id} is an app screen with no flow steps. Every app screen serves at least one flow step. Marketing pages are exempt. Add the steps ${s.id} serves to its flowSteps, or drop ${s.id}.`,
          s.id,
        ),
      ),
);

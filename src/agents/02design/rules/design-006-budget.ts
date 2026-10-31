import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { NEW_COMPONENT_BUDGET } from '../config';
import type { IaInput } from './helpers';

/**
 * DESIGN-006 · warning
 * At most five new components on app screens; marketing pages are visual first and not counted.
 * Pass: one new component.
 * Fail: six used on app screens.
 */
export const rule = defineRule<IaInput>(
  'DESIGN-006',
  'warning',
  ({ ia }, fail) => {
    const app = new Set(
      ia.screens.filter((s) => s.kind === 'app').map((s) => s.id),
    );
    const counted = ia.newComponents.filter((c) =>
      c.usedOn.some((id) => app.has(id)),
    );
    return counted.length > NEW_COMPONENT_BUDGET
      ? [
          fail(
            `App screens use ${counted.length} new components: ${counted.map((c) => c.name).join(', ')}. App screens use at most ${NEW_COMPONENT_BUDGET} new components. Marketing pages do not count. Replace ${counted.length - NEW_COMPONENT_BUDGET} of them with design-system components where those fit.`,
          ),
        ]
      : [];
  },
);

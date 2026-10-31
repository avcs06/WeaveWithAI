import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import { ACTIONS, type IaInput, type NodesInput } from './design-helpers';

/**
 * DESIGN-013 · mandatory
 * At most one hero per screen; a hero has one heading, at most one text and at most two actions.
 * Pass: the landing hero: a title, a line, Sign up and Sign in.
 * Fail: the same hero with a third button.
 */
export const iaRule = defineRule<IaInput>(
  'DESIGN-013',
  'mandatory',
  ({ ia }, fail) =>
    ia.screens.flatMap((screen) => {
      const heroes = ia.sections.filter(
        (s) => s.screen === screen.id && s.kind === 'hero',
      );
      return heroes.length > 1
        ? [
            fail(
              `${screen.id} has ${heroes.length} heroes; a screen has one at most.`,
              screen.id,
            ),
          ]
        : [];
    }),
);

export const nodesRule = defineRule<NodesInput>(
  'DESIGN-013',
  'mandatory',
  ({ nodes, ia }, fail) => {
    const issues: Issue[] = [];
    for (const hero of ia.sections.filter((s) => s.kind === 'hero')) {
      const own = nodes.filter((node) => node.section === hero.id);
      if (!own.length) continue;
      const headings = own.filter((node) => node.role === 'heading').length;
      const texts = own.filter((node) => node.role === 'text').length;
      const actions = own.filter(
        (node) => ACTIONS.has(node.role) || node.role === 'navigation',
      ).length;
      if (headings !== 1 || texts > 1 || actions > 2)
        issues.push(
          fail(
            `The hero ${hero.id} has ${headings} headings, ${texts} texts and ${actions} actions; a hero has one heading, at most one text and two actions.`,
            hero.id,
          ),
        );
    }
    return issues;
  },
);

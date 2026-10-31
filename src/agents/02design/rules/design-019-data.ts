import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { NodesInput } from './helpers';

/**
 * DESIGN-019 · mandatory
 * Data entries are Noun.attribute with a noun of the scope's vocabulary.
 * Pass: Book.title.
 * Fail: Novel.title.
 */
const SHAPE = /^([A-Z][A-Za-z0-9]*)\.([a-z][A-Za-z0-9]*)$/;

export const rule = defineRule<NodesInput>(
  'DESIGN-019',
  'mandatory',
  ({ nodes, ctx }, fail) => {
    const issues: Issue[] = [];
    const nouns = new Set(ctx.scope.vocabulary.map((v) => v.noun));
    for (const node of nodes)
      for (const entry of node.data) {
        const noun = SHAPE.exec(entry)?.[1];
        if (!noun || !nouns.has(noun))
          issues.push(
            fail(
              `${node.id} shows ${entry}; data is Noun.attribute with a noun of the vocabulary (${[...nouns].join(', ')}).`,
              node.id,
            ),
          );
      }
    return issues;
  },
);

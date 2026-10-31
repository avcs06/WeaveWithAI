import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { CatalogInput, NodesInput } from './helpers';

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
              `${node.id} shows ${entry}, which is not Noun.attribute with a noun of the vocabulary. Each data entry is a noun of the vocabulary, a dot, and an attribute that starts with a lowercase letter. The nouns are ${[...nouns].join(', ')}. Change ${entry} in the data of ${node.id} to that form.`,
              node.id,
            ),
          );
      }
    return issues;
  },
);

/** The catalog's widgets: the values each shows. */
export const catalogRule = defineRule<CatalogInput>(
  'DESIGN-019',
  'mandatory',
  ({ catalog, ctx }, fail) => {
    const nouns = new Set(ctx.scope.vocabulary.map((v) => v.noun));
    return catalog.widgets.flatMap((widget) =>
      widget.data
        .filter((entry) => !nouns.has(SHAPE.exec(entry)?.[1] ?? ''))
        .map((entry) =>
          fail(`${widget.id} shows ${entry}, which is not Noun.attribute with a noun of the vocabulary. Each data entry is a noun of the vocabulary, a dot, and an attribute that starts with a lowercase letter. The nouns are ${[...nouns].join(', ')}. Change ${entry} in the data of ${widget.id} to that form.`, widget.id),
        ),
    );
  },
);

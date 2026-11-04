/**
 * CAT-002 · mandatory
 * Forms are FM01, FM02, ..., unique, named, and list at least one field.
 * Pass: { id: 'FM01', name: 'Book form', fields: ['FD03', 'FD04'] }
 * Fail: { id: 'F1' } · two forms with id 'FM01' · { id: 'FM01', fields: [] }
 */
import type { Issue } from '../../../../../core/issues';
import { defineRule, duplicates } from '../../../../../core/rules';
import type { CatalogInput } from '../../../rules/helpers';

export const FORM_ID = /^FM\d{2,}$/;

export const rule = defineRule<CatalogInput>(
  'CAT-002',
  'mandatory',
  ({ catalog }, fail) => {
    const issues: Issue[] = [];
    catalog.forms.forEach((form, i) => {
      const at = `forms[${i}]`;
      if (!FORM_ID.test(form.id))
        issues.push(
          fail(`Form id "${form.id}" is malformed; use FM01, FM02, ...`, at),
        );
      if (form.name.trim() === '')
        issues.push(
          fail(
            `Form ${form.id} has no name; say which screen asks for it.`,
            at,
          ),
        );
      if (form.fields.length === 0)
        issues.push(
          fail(
            `Form ${form.id} lists no fields; a form groups at least one.`,
            at,
          ),
        );
    });
    for (const id of duplicates(catalog.forms, (form) => form.id)) {
      issues.push(
        fail(
          `Form id "${id}" is used more than once; number forms FM01, FM02, ... once each.`,
          'forms',
        ),
      );
    }
    return issues;
  },
);

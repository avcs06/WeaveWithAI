import type { Issue } from '../../../../core/issues';
import { defineRule } from '../../../../core/rules';
import { duplicates, isCamel, isPascal } from '../../../../core/rules';
import type { ContractInput } from '../helpers';

/**
 * CONTRACT-001 · mandatory
 * Entities PascalCase singular and unique; fields camelCase and unique per
 * entity; enums PascalCase; enum keys snake_case; operation ids camelCase and unique.
 * Pass: Book, title, Shelf, to_read, listBooks.
 * Fail: an entity named Books.
 */
const plural = (name: string) => /s$/.test(name) && !/(ss|us|is)$/.test(name);
const SNAKE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

export const rule = defineRule<ContractInput>(
  'CONTRACT-001',
  'mandatory',
  ({ contract }, fail) => {
    const issues: Issue[] = [];
    for (const e of contract.entities) {
      if (!isPascal(e.name) || plural(e.name))
        issues.push(
          fail(
            `Entity ${e.name} is not a PascalCase singular, like Book.`,
            e.name,
          ),
        );
      for (const f of e.fields)
        if (!isCamel(f.name))
          issues.push(
            fail(
              `${e.name}.${f.name} is not camelCase.`,
              `${e.name}.${f.name}`,
            ),
          );
      for (const name of duplicates(e.fields, (f) => f.name))
        issues.push(
          fail(`${e.name} has two fields named ${name}.`, `${e.name}.${name}`),
        );
    }
    for (const name of duplicates(contract.entities, (e) => e.name))
      issues.push(fail(`Entity ${name} is declared twice.`, name));
    for (const en of contract.enums) {
      if (!isPascal(en.name))
        issues.push(fail(`Enum ${en.name} is not PascalCase.`, en.name));
      for (const v of en.values)
        if (!SNAKE.test(v.key))
          issues.push(
            fail(`${en.name} key ${v.key} is not snake_case.`, en.name),
          );
    }
    for (const op of contract.operations)
      if (!isCamel(op.id))
        issues.push(
          fail(`Operation ${op.id} is not camelCase, like createBook.`, op.id),
        );
    for (const id of duplicates(contract.operations, (op) => op.id))
      issues.push(fail(`Operation ${id} is declared twice.`, id));
    return issues;
  },
);

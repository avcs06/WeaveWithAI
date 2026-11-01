import type { Contract } from '../../03contract/schema';

const lower = (name: string) => `${name.charAt(0).toLowerCase()}${name.slice(1)}`;
const upper = (name: string) => `${name.charAt(0).toUpperCase()}${name.slice(1)}`;

/** `.weave/02-contract/entities.md`: each entity's import path, fields and what to call for each operation. */
export function entitiesDoc(contract: Contract): string {
  const sections = contract.entities.map((entity) => {
    const fields = entity.fields.map((f) => {
      const type = f.kind === 'enum' ? `enum ${f.enum}` : f.kind === 'ref' ? `ref ${f.ref} id` : f.kind;
      return `- \`${f.name}\`: ${type}${f.list ? ', a list' : ''}${f.required ? '' : ', optional'}`;
    });
    const operations = contract.operations
      .filter((op) => op.entity === entity.name)
      .map((op) => {
        const reads = op.kind === 'list' || op.kind === 'get';
        const call = op.kind === 'list' ? '()' : op.kind === 'create' ? '(input)' : op.kind === 'update' ? '(id, changes)' : '(id)';
        return `- \`${op.id}${call}\`${reads ? ` or \`use${upper(op.id)}${op.kind === 'get' ? '(id)' : '()'}\`` : ''}: ${op.summary}`;
      });
    return [`## ${entity.name}`, '', `\`@app/entities/${lower(entity.name)}\``, '', ...fields, '', ...operations].join('\n');
  });
  const enums = contract.enums.map(
    (e) => `- \`${e.name}\`: ${e.values.map((v) => `\`${v.key}\` (${v.label})`).join(', ')}; options in \`${e.name}Options\``,
  );
  return [
    '# Entities',
    '',
    ...sections.flatMap((s) => [s, '']),
    ...(enums.length ? ['## Enums', '', '`@app/entities/enums`', '', ...enums, ''] : []),
    '## Sign-in',
    '',
    '`@app/entities/auth`: `signUp(email)`, `signIn(email)`, `signOut()`, `useCurrentUser()`.',
    '',
  ].join('\n');
}

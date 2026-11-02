import { assumptionLines, questionLines } from '../render';
import type { Scope } from './schema';

export function renderScope(scope: Scope): string {
  const lines: string[] = [
    `# ${scope.app.name}: scope`,
    '',
    scope.app.summary,
    '',
    `Audience: ${scope.app.audience}`,
    '',
    '## Roles',
    ...scope.roles.map(
      (role) =>
        `- ${role.name} (${role.id}, ${role.signedIn ? 'signs in' : 'no sign-in'}): ${role.description}`,
    ),
    '',
    '## Vocabulary',
    ...scope.vocabulary.map(
      (entry) =>
        `- ${entry.noun} (${owner(scope, entry.belongsTo)}): ${entry.description}`,
    ),
    '',
    '## In scope',
    ...scope.inScope.map((item) => `- ${item}`),
  ];
  if (scope.outOfScope.length > 0) {
    lines.push(
      '',
      '## Out of scope',
      ...scope.outOfScope.map(
        (entry) =>
          `- ${entry.item}: ${entry.reason} Instead: ${entry.placeholder}`,
      ),
    );
  }
  lines.push(
    ...assumptionLines(scope.assumptions),
    ...questionLines(scope.questions),
  );
  return `${lines.join('\n')}\n`;
}

const owner = (scope: Scope, belongsTo: string): string =>
  belongsTo === 'shared'
    ? 'shared'
    : `owned by ${scope.roles.find((role) => role.id === belongsTo)?.name ?? belongsTo}`;

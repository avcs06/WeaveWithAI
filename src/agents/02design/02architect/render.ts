import type { Scope } from '../../01flows/01scope/schema';
import type { Alternative, Architecture } from './schema';

/** The design page: every frame, screen and dialog with its numbered steps and its alternatives. */
export function renderArchitecture(
  architecture: Architecture,
  scope: Scope,
): string {
  const lines = [`# ${scope.app.name}: frames, screens and dialogs`];
  for (const frame of architecture.frames)
    lines.push(
      '',
      `## ${frame.id} ${frame.name} (frame)`,
      frame.purpose,
      '',
      ...numbered(frame.steps),
      ...alternativeLines(frame.alternatives),
    );
  for (const screen of architecture.screens)
    lines.push(
      '',
      `## ${screen.id} ${screen.title} (${screen.route})`,
      screen.purpose,
      `Roles: ${screen.roles.join(', ')} · Frame: ${screen.frame} · Flows: ${screen.flows.join(', ')}`,
      '',
      ...numbered(screen.steps),
      ...alternativeLines(screen.alternatives),
    );
  for (const dialog of architecture.dialogs)
    lines.push(
      '',
      `## ${dialog.id} ${dialog.title} (dialog)`,
      dialog.purpose,
      `Opened from: ${dialog.openedFrom.join(', ')} · Flows: ${dialog.flows.join(', ')}`,
      '',
      ...numbered(dialog.steps),
      ...alternativeLines(dialog.alternatives),
    );
  return `${lines.join('\n')}\n`;
}

const numbered = (steps: string[], indent = ''): string[] =>
  steps.map((step, i) => `${indent}${i + 1}. ${step}`);

const alternativeLines = (alternatives: Alternative[]): string[] =>
  alternatives.flatMap((alternative) => [
    '',
    `When ${alternative.when}:`,
    ...numbered(alternative.steps, '   '),
  ]);

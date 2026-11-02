import type { Scope } from '../../01flows/01scope/schema';
import type {
  Alternative,
  Architecture,
  Dialog,
  Frame,
  Screen,
} from './schema';

/** The design page: every frame, screen and dialog with its numbered steps and its alternatives. */
export function renderArchitecture(
  architecture: Architecture,
  scope: Scope,
): string {
  const lines = [
    `# ${scope.app.name}: frames, screens and dialogs`,
    ...architecture.frames.flatMap((frame) => ['', ...frameLines(frame)]),
    ...architecture.screens.flatMap((screen) => ['', ...screenLines(screen)]),
    ...architecture.dialogs.flatMap((dialog) => ['', ...dialogLines(dialog)]),
  ];
  return `${lines.join('\n')}\n`;
}

export const frameLines = (frame: Frame): string[] => [
  `## ${frame.id} ${frame.name} (frame)`,
  frame.purpose,
  ...(frame.flows.length ? [`Flows: ${frame.flows.join(', ')}`] : []),
  '',
  ...numbered(frame.steps),
  ...alternativeLines(frame.alternatives),
];

export const screenLines = (screen: Screen): string[] => [
  `## ${screen.id} ${screen.title} (${screen.route})`,
  screen.purpose,
  `Roles: ${screen.roles.join(', ')} · Frame: ${screen.frame} · Flows: ${screen.flows.join(', ')}`,
  '',
  ...numbered(screen.steps),
  ...alternativeLines(screen.alternatives),
];

export const dialogLines = (dialog: Dialog): string[] => [
  `## ${dialog.id} ${dialog.title} (dialog)`,
  dialog.purpose,
  `Opened from: ${dialog.openedFrom.join(', ')} · Flows: ${dialog.flows.join(', ')}`,
  '',
  ...numbered(dialog.steps),
  ...alternativeLines(dialog.alternatives),
];

const numbered = (steps: string[], indent = ''): string[] =>
  steps.map((step, i) => `${indent}${i + 1}. ${step}`);

const alternativeLines = (alternatives: Alternative[]): string[] =>
  alternatives.flatMap((alternative) => [
    '',
    `When ${alternative.when}:`,
    ...numbered(alternative.steps, '   '),
  ]);

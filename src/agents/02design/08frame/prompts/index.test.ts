import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ia, inventory } from '../../__fixtures__/widgets';
import { Scope } from '../../../01flows/01scope/schema';
import { Brief } from '../../01brief/schema';
import { buildTheme } from '../../02theme/build';
import type { ThemeCall } from '../../02theme/schema';
import { layoutShells } from '../../02theme/shells';
import { frameSystemPrompt, frameUserMessage } from './index';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;

const scope = Scope.parse(
  read('../../../01flows/__fixtures__/reading-list.scope.json'),
);

const brief = Brief.parse(read('../../__fixtures__/reading-list.brief.json'));

const theme = buildTheme(
  brief,
  read('../../__fixtures__/reading-list.theme.json') as ThemeCall,
);

const filled = (text: string) => {
  expect(text).not.toContain('{{');
  expect(text).not.toContain('<!--');
};

describe('the frame prompt', () => {
  it('gives a shell its regions, the framed pages of its kind and the navigation', () => {
    filled(frameSystemPrompt('SH1', brief, inventory));
    expect(frameSystemPrompt('SH1', brief, inventory)).toContain(
      'IDs SH1.n01, SH1.n02',
    );
    const message = frameUserMessage(
      'SH1',
      ia,
      layoutShells(theme.layouts),
      scope,
      brief,
      theme,
    );
    filled(message);
    const target = message.slice(0, message.indexOf('# Navigation'));
    expect(target).toContain('"id": "SH1.r1"');
    expect(target).toContain('"route": "/shelf"');
    expect(target).not.toContain('"route": "/sign-in"');
    expect(message).toContain(`"label": "${ia.navigation.items[0]?.label}"`);
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ia, inventory } from '../../__fixtures__/widgets';
import { Scope } from '../../../01flows/01scope/schema';
import { Brief } from '../../01brief/schema';
import { buildTheme } from '../../02theme/build';
import type { ThemeCall } from '../../02theme/schema';
import { componentSystemPrompt, componentUserMessage } from './index';

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

describe('the component prompt', () => {
  it('gives the declaration and the widgets that use it', () => {
    filled(componentSystemPrompt('TitleCover', inventory));
    expect(componentSystemPrompt('TitleCover', inventory)).toContain(
      'declared TitleCover',
    );
    const message = componentUserMessage('TitleCover', ia, scope, brief, theme);
    filled(message);
    expect(message).toContain('"whyNotExisting"');
    expect(message).toContain('"id": "W12"');
    expect(message).toContain('"radius"');
  });
});

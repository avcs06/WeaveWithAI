import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Inventory } from '../../../../ds/inventory';
import { Scope } from '../../../01flows/01scope/schema';
import { Flows } from '../../../01flows/schema';
import { Brief } from '../../01brief/schema';
import { PAGE_ROLES, ROLES } from '../schema';
import { themeSystemPrompt, themeUserMessage } from './index';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;

const scope = Scope.parse(
  read('../../../01flows/__fixtures__/reading-list.scope.json'),
);

const flows = Flows.parse(
  read('../../../01flows/__fixtures__/reading-list.flows.json'),
);

const inventory = read(
  '../../../../ds/__fixtures__/inventory.json',
) as Inventory;

const brief = Brief.parse(read('../../__fixtures__/reading-list.brief.json'));

describe('theme prompt', () => {
  const prompt = themeSystemPrompt(brief, inventory);

  it('fills every placeholder, keeps the notes out and carries the design system', () => {
    expect(prompt).not.toContain('{{');
    expect(prompt).not.toContain('<!--');
    expect(prompt).toMatch(/^Button: /m);
  });

  it("names the brief's modes and colored entities, every color role and every layout part", () => {
    expect(prompt).toContain('Write the colors for light and dark.');
    expect(prompt).toContain('as strong as the brand: shelf (hue 230).');
    for (const role of [...ROLES, ...PAGE_ROLES])
      expect(prompt).toContain(`\`${role}\``);
    for (const part of [
      'base',
      'docksFirst',
      'header',
      'sidebar',
      'extraSidebar',
      'footer',
      'main',
      'separation',
      'fullBleed',
    ])
      expect(prompt).toContain(`\`${part}\``);
    const plain = themeSystemPrompt(
      { ...brief, colorScheme: 'dark', entities: [] },
      inventory,
    );
    expect(plain).toContain('Write the colors for dark only.');
    expect(plain).toContain(
      'as strong as the brand: none, so `entity` stays empty.',
    );
  });

  it('puts the brief, the scope and the flows in the user message', () => {
    const message = themeUserMessage(brief, scope, flows);
    expect(message).toContain('# Brief (02-design/01-brief.json)');
    expect(message).toContain('"colorScheme": "both"');
    expect(message).toContain('"name": "Shelf"');
    expect(message).toContain('# Flows (01-flows/04-reconcile.json, what each flow is)');
    expect(message).toContain('"goal": ');
    expect(message).not.toContain('"steps"');
    expect(message).not.toContain('{{');
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DISPLAY_FONTS, MONO_FONTS, UI_FONTS } from '../../config/fonts';
import type { Inventory } from '../../ds/inventory';
import { Flows, Scope } from '../flows/schema';
import {
  briefSystemPrompt,
  briefReviewGuides,
  briefUserMessage,
  iaReviewGuides,
  themeReviewGuides,
  themeSystemPrompt,
  themeUserMessage,
} from './prompt';
import { componentReviewGuides, widgetReviewGuides } from './prompt-screens';
import { Brief } from './schema';
import { PAGE_ROLES, ROLES } from './schema-theme';

const read = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as unknown;
const scope = Scope.parse(
  read('../flows/__fixtures__/reading-list.scope.json'),
);
const flows = Flows.parse(
  read('../flows/__fixtures__/reading-list.flows.json'),
);
const inventory = read('../../ds/__fixtures__/inventory.json') as Inventory;
const brief = Brief.parse(read('./__fixtures__/reading-list.brief.json'));

describe('brief prompt', () => {
  const prompt = briefSystemPrompt();

  it('fills every placeholder and keeps the notes out', () => {
    expect(prompt).not.toContain('{{');
    expect(prompt).not.toContain('<!--');
  });

  it('lists every ui, display and mono family once, each with its description', () => {
    for (const name of [...UI_FONTS, ...DISPLAY_FONTS, ...MONO_FONTS])
      expect(
        prompt.match(new RegExp(`^- ${name}: \\S`, 'gm')),
        name,
      ).toHaveLength(1);
    expect(prompt).toContain('- JetBrains Mono: ');
    expect(prompt).toContain('Mono fonts:');
  });

  it('names every brief field, says hues are degrees, and leaves the design system out', () => {
    for (const field of [
      'audience',
      'personality',
      'voice',
      'density',
      'seedHue',
      'seedChroma',
      'baseHue',
      'baseChroma',
      'fonts',
      'radius',
      'focusRing',
      'feel',
      'colorScheme',
      'entities',
      'imagery',
      'references',
    ])
      expect(prompt).toContain(`\`${field}\``);
    expect(prompt).toContain('degrees on the color wheel, 0 to 360');
    expect(prompt).not.toMatch(/^Button: /m);
  });

  it('puts the idea and the scope in the user message', () => {
    const message = briefUserMessage('<!-- for us only -->A reading list.', scope);
    expect(message).toContain('# Idea\n\nA reading list.');
    expect(message).not.toContain('for us only');
    expect(message).toContain('"name": "Shelf"');
    expect(message).not.toContain('{{');
  });
});

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
    expect(plain).toContain('as strong as the brand: none, so `entity` stays empty.');
  });

  it('puts the brief, the scope and the flows in the user message', () => {
    const message = themeUserMessage(brief, scope, flows);
    expect(message).toContain('# Brief (02-brief.json)');
    expect(message).toContain('"colorScheme": "both"');
    expect(message).toContain('"name": "Shelf"');
    expect(message).toContain('# Flows (01-flows.json, what each flow is)');
    expect(message).toContain('"goal": ');
    expect(message).not.toContain('"steps"');
    expect(message).not.toContain('{{');
  });
});

describe('design review guides', () => {
  const guides = [
    briefReviewGuides(),
    themeReviewGuides(),
    iaReviewGuides(),
    widgetReviewGuides(),
    componentReviewGuides(),
  ];

  it('keep the notes out; the peer challenges the decisions, the output reviewer reads for meaning', () => {
    for (const { peer, output } of guides) {
      for (const guide of [peer ?? '', output]) {
        expect(guide).not.toContain('{{');
        expect(guide).not.toContain('<!--');
      }
      if (peer) expect(peer).toContain('Challenge, and report as a blocker');
      expect(output).toContain('no validator can catch');
    }
  });

  it('give the widget and component calls the output reviewer alone', () => {
    expect(widgetReviewGuides().peer).toBeUndefined();
    expect(componentReviewGuides().peer).toBeUndefined();
    expect(iaReviewGuides().peer).toContain('information architecture');
  });

  it('give the output reviewers the layout heuristics no validator checks: H-53 the IA, H-42 the widgets', () => {
    expect(iaReviewGuides().output).toContain('H-53');
    expect(widgetReviewGuides().output).toContain('H-42');
  });
});

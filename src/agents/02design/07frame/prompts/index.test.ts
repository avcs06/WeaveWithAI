import { describe, expect, it } from 'vitest';
import { brief, ctx, inventory, plan, scope, theme } from '../../__fixtures__/chain';
import { frameSystemPrompt, frameUserMessage } from './index';

const filled = (text: string) => {
  expect(text).not.toContain('{{');
  expect(text).not.toContain('<!--');
};

describe('the frame prompt', () => {
  it('carries the node guide and the change ids, the same for every shell', () => {
    const prompt = frameSystemPrompt(brief, inventory);
    filled(prompt);
    expect(prompt).toContain('SH1.n01, SH1.n02');
    expect(prompt).toContain('SH1.S04.n01');
    for (const field of ['nodes', 'section', 'changes', 'add', 'remove']) expect(prompt, field).toContain(`\`${field}\``);
  });

  it('gives a shell its regions, the framed pages of its kind with how each frame differs, its steps and the navigation', () => {
    const message = frameUserMessage('SH1', plan, ['F06.S01'], ctx.shells, scope, brief, theme);
    filled(message);
    const target = message.slice(0, message.indexOf('# Steps the frame serves'));
    expect(target).toContain('"id": "SH1.r1"');
    expect(target).toContain('"route": "/shelf"');
    expect(target).toContain('"frame": ""');
    expect(target).not.toContain('"route": "/sign-in"');
    expect(message).toContain('"F06.S01"');
    expect(message).toContain('"label": "Your shelf"');
  });
});

import { describe, expect, it } from 'vitest';
import { recipeImports, recipeReads, UNIT_MARKER, unreadRecipes } from './recipes';

const line = (tool: string, name?: string) => JSON.stringify({ at: '2026-11-02T10:00:00.000Z', tool, name });
const page = `'use client';
import { Avatar } from '@packages/ui/Avatar';
import { Button, IconButton as Icon } from '@packages/ui/Button';
import type { DialogProps } from '@packages/ui/Dialog';
import { useValueSync } from '@packages/recipes/useValueSync';
import { NextLink } from '@app/components/NextLink';
`;

describe('recipeImports', () => {
  it('reads the design-system folders and the names, and skips type-only imports and the app', () => {
    expect(recipeImports(page)).toEqual([
      { folder: 'Avatar', names: ['Avatar'] },
      { folder: 'Button', names: ['Button', 'IconButton'] },
      { folder: 'useValueSync', names: ['useValueSync'] },
    ]);
  });
});

describe('recipeReads', () => {
  it('collects the recipes asked since the last unit marker, whatever their case', () => {
    const log = [line('mcp__weave_design_system__get_recipe', 'Dialog'), line(UNIT_MARKER), line('read_file'), line('mcp__weave_design_system__get_recipe', 'IconButton'), 'not json'].join('\n');
    expect(recipeReads(log)).toEqual(new Set(['iconbutton']));
  });
});

describe('unreadRecipes', () => {
  it('names each folder no read covers: a read of the folder or of one of its imported names counts', () => {
    const log = [line('mcp__weave_design_system__get_recipe', 'IconButton'), line('mcp__weave_design_system__get_recipe', 'usevaluesync')].join('\n');
    expect(unreadRecipes(page, log)).toEqual(['Avatar']);
    expect(unreadRecipes(page, `${log}\n${line('mcp__weave_design_system__get_recipe', 'Avatar')}`)).toEqual([]);
  });

  it('is empty for a file with no design-system import', () => {
    expect(unreadRecipes("import { useState } from 'react';", '')).toEqual([]);
  });
});

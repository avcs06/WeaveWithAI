import { describe, expect, it } from 'vitest';
import { componentLooks, readRecipes } from './looks';

const recipes = readRecipes('template');
const recipe = (name: string) => recipes.find((entry) => entry.recipe === name);

const component = (name: string, category: string, lookDescription?: string) => ({
  name,
  category,
  props: lookDescription ? [{ name: 'look', description: lookDescription }] : [],
});

describe('readRecipes on the template', () => {
  it('reads the defaults and spells every look, the default first', () => {
    expect(recipe('buttonRecipe')).toEqual({
      recipe: 'buttonRecipe',
      folder: 'Button',
      defaults: { variant: 'default', size: 'sm', rounded: false, ghost: false },
      looks: ['', 'ghost', 'rounded', 'rounded ghost'],
      tokens: ['rounded', '!rounded', 'ghost', '!ghost'],
    });
    expect(recipe('cardRecipe')?.looks).toEqual([
      'outline',
      'outline ghost',
      'outline elevated',
      'outline elevated ghost',
      'filled',
      'filled ghost',
      'filled elevated',
      'filled elevated ghost',
    ]);
  });

  it('spells a boolean that defaults to on with its ! form, and a value variant by its values', () => {
    expect(recipe('tagRecipe')?.looks).toEqual(['bordered', '!bordered']);
    expect(recipe('accordionRecipe')?.looks).toEqual(['bordered', 'open']);
    expect(recipe('formControlRecipe')?.looks).toEqual(['outline', 'open']);
  });

  it('gives a recipe without look variants no looks', () => {
    expect(recipe('checkboxRecipe')).toMatchObject({
      defaults: { variant: 'default', size: 'sm' },
      looks: [],
      tokens: [],
    });
  });
});

describe('componentLooks', () => {
  it('takes the defaults from the recipe named after the component', () => {
    expect(componentLooks(recipes, component('Checkbox', 'Checkbox'))).toEqual({
      defaults: { variant: 'default', size: 'sm' },
    });
    expect(componentLooks(recipes, component('Table', 'Table'))).toEqual({});
  });

  it('resolves a look prop through the tokens its description names', () => {
    const buttonLooks = ['', 'ghost', 'rounded', 'rounded ghost'];
    expect(
      componentLooks(recipes, component('IconButton', 'Button', '`ghost`, `rounded`.')),
    ).toEqual({ looks: buttonLooks });
    // Chip spells ghost and rounded too; the smaller token set wins outside its folder.
    expect(
      componentLooks(recipes, component('PopoverButton', 'Popover', '`ghost`, `rounded`.')),
    ).toEqual({ looks: buttonLooks });
    expect(
      componentLooks(recipes, component('Input', 'Input', '`outline` (default) or `open`.')),
    ).toEqual({ looks: ['outline', 'open'] });
    expect(
      componentLooks(recipes, component('Collapsible', 'Accordion', '`bordered` (default). `open`.')),
    ).toEqual({ looks: ['bordered', 'open'] });
  });

  it('fails when no recipe spells a described look', () => {
    expect(() => componentLooks(recipes, component('Odd', 'Odd', '`neon`'))).toThrow(
      /Odd: no recipe spells the looks neon/,
    );
  });
});

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runRules } from '../../../core/rules';
import type { Contract } from '../../03contract/schema';
import { DIALOG_GAP } from '../config';
import { chain, ctx, inventory, screens, theme } from '../__fixtures__/chain';
import type { Chain } from './assemble';
import { assembleChain } from './assemble';
import { rule as design050 } from '../rules/design-050-contract-fields';
import { screensOf } from '../rules/helpers';
import { skeleton } from './skeleton/skeleton';
import type { Screens } from '../schema';
import { validateDesign } from './validation/validation';

const { screens: assembled, origin } = assembleChain(chain, theme);
const contract = JSON.parse(
  readFileSync(new URL('../../03contract/__fixtures__/reading-list.contract.json', import.meta.url), 'utf8'),
) as Contract;

const textsOf = (s: Screens, screen: string) =>
  s.nodes
    .filter((node) => node.id.startsWith(`${screen}.`))
    .map((node) => [node.text, node.label].join('|'))
    .sort();

function changed(change: (copy: Chain) => void): Chain {
  const copy = { ...structuredClone({ ...chain, designs: undefined }), designs: chain.designs } as Chain;
  change(copy);
  return copy;
}

describe('assembleChain', () => {
  it('rebuilds the reading-list design from its calls: the same screens, boxes, sections and words', () => {
    expect(assembled.screens.map((s) => [s.id, s.shell, s.access, s.roles])).toEqual(
      screens.screens.map((s) => [s.id, s.shell, s.access, s.roles]),
    );
    expect(assembled.boxes).toEqual(screens.boxes);
    expect(assembled.sections.map((s) => [s.id, s.kind, s.surface, s.in, s.share])).toEqual(
      screens.sections.map((s) => [s.id, s.kind, s.surface, s.in, s.share]),
    );
    expect(assembled.nodes).toHaveLength(screens.nodes.length);
    for (const { id } of [...screens.screens, ...screens.shells])
      expect(textsOf(assembled, id), id).toEqual(textsOf(screens, id));
    expect(assembled.newComponents).toEqual(screens.newComponents);
    expect(assembled.frameChanges).toEqual([]);
  });

  it('passes every design rule and every layout rule, warnings included', () => {
    expect(validateDesign(assembled, skeleton(assembled, inventory), ctx, contract)).toEqual([]);
  });

  it("DESIGN-050 holds each value a screen or a new component shows to a field of its contract entity", () => {
    const copy = structuredClone(assembled);
    copy.nodes.find((n) => n.id === 'S06.n08')!.data = ['Book.blurb'];
    const cover = copy.newComponents[0]!.nodes[0]!;
    cover.data = ['Shelf.name'];
    const issues = runRules([design050], { screens: copy, contract });
    expect(issues.map((i) => i.at)).toEqual(['S06.n08', cover.id]);
    expect(issues[0]?.message).toContain('Its fields are id, createdAt, updatedAt, title, author, shelf.');
    expect(issues[1]?.message).toContain('the contract has no entity for Shelf');
  });

  it('renumbers the nodes to their screen in reading order and keeps the node each call wrote', () => {
    const add = assembled.nodes.find((node) => node.text === 'Add book' && node.section === 'S04.sec1');
    expect(add).toMatchObject({ id: 'S04.n06', parent: 'S04.n04' });
    expect(origin.get('S04.n06')).toBe('W05.n06');
    // The books widget starts after the six nodes of the page header, with its search row.
    expect(origin.get('S04.n07')).toBe('W06.n01');
    expect(assembled.nodes.filter((n) => n.id.startsWith('SH1.')).map((n) => n.id)).toEqual(['SH1.n01', 'SH1.n02']);
    expect(assembled.placements.find((p) => p.id === 'S06.sec2')).toEqual({
      id: 'S06.sec2',
      screen: 'S06',
      widget: 'W09',
      instance: 'S06.p2',
    });
  });

  it("sizes a heading by its instance's level and the screen's kind, and shows a value's sample", () => {
    const heading = (text: string) => assembled.nodes.find((n) => n.text === text && n.headingLevel > 0);
    expect(heading('Your shelf')).toMatchObject({ headingLevel: 1, typeScale: 'title' });
    expect(heading('Shelf')).toMatchObject({ headingLevel: 2, typeScale: 'heading' });
    expect(heading('Keep every book you mean to read')).toMatchObject({ typeScale: 'display' });
    expect(heading('Find it again')).toMatchObject({ headingLevel: 3, typeScale: 'heading' });
    expect(heading('The Left Hand of Darkness')).toMatchObject({ data: ['Book.title'] });
    const deeper = changed((c) => (c.layouts.find((l) => l.screen === 'S06')!.instances[1]!.headingLevel = 3));
    expect(assembleChain(deeper, theme).screens.nodes.find((n) => n.text === 'Shelf' && n.headingLevel > 0)).toMatchObject({
      headingLevel: 3,
      typeScale: 'subheading',
    });
  });

  it("fills a words slot from its instance, and a {Noun.attribute} from the node's sample", () => {
    expect(assembled.nodes.find((n) => n.id === 'S04.n02')?.text).toBe('Your shelf');
    const renamed = changed((c) => (c.layouts.find((l) => l.screen === 'S04')!.instances[0]!.slots[0]!.text = 'My books'));
    expect(assembleChain(renamed, theme).screens.nodes.find((n) => n.id === 'S04.n02')?.text).toBe('My books');
    const sampled = changed((c) => {
      const node = c.builds.find((b) => b.widget === 'W10')!.nodes[0]!;
      Object.assign(node, { text: 'Remove “{Book.title}” for good?', sample: 'Remove “Dune” for good?' });
    });
    expect(assembleChain(sampled, theme).screens.nodes.find((n) => n.id === 'S07.n01')?.text).toBe('Remove “Dune” for good?');
    const lined = changed((c) => {
      const node = c.builds.find((b) => b.widget === 'W10')!.nodes[0]!;
      Object.assign(node, { text: '{Book.title} by {Book.author}', sample: 'Dune by Frank Herbert' });
    });
    expect(assembleChain(lined, theme).screens.nodes.find((n) => n.id === 'S07.n01')?.text).toBe('Dune by Frank Herbert');
  });

  it("places an instance in a parts slot under the node that stands for the slot, in its host's section", () => {
    const slotted = changed((c) => {
      const detail = c.builds.find((b) => b.widget === 'W08')!;
      detail.nodes.push({
        ...structuredClone(detail.nodes[0]!),
        id: 'W08.n99',
        parent: '',
        order: 99,
        what: 'the aside slot',
        role: 'container',
        slot: 'aside',
        text: '',
        flowSteps: [],
        data: [],
      });
      c.layouts.find((l) => l.screen === 'S06')!.instances[1]!.in = 'S06.p1/aside';
    });
    const { screens: out, origin: from } = assembleChain(slotted, theme);
    const holder = out.nodes.find((n) => n.what === 'the aside slot');
    const panel = out.nodes.filter((n) => from.get(n.id)?.startsWith('W09.'));
    expect(out.sections.map((s) => s.id).filter((id) => id.startsWith('S06'))).toEqual(['S06.sec1']);
    expect(panel.length).toBeGreaterThan(0);
    expect(panel.every((n) => n.section === 'S06.sec1')).toBe(true);
    expect(panel.filter((n) => !from.get(n.parent)?.startsWith('W09.')).map((n) => n.parent)).toEqual(
      expect.arrayContaining([holder?.id]),
    );
  });

  it('places a component on its own as one node naming it, its look left in newComponents', () => {
    const own = changed((c) => {
      c.catalog.screens.find((s) => s.screen === 'S06')!.parts.push('TitleCover');
      c.layouts.find((l) => l.screen === 'S06')!.instances.push({
        ...structuredClone(c.layouts.find((l) => l.screen === 'S06')!.instances[1]!),
        id: 'S06.p3',
        places: 'TitleCover',
        order: 3,
        size: 'fixed',
        widthPx: 160,
        headingLevel: 0,
      });
    });
    const out = assembleChain(own, theme).screens;
    const section = out.sections.find((s) => s.id === 'S06.sec3');
    expect(section).toMatchObject({ kind: 'custom', title: 'TitleCover', purpose: chain.plan.newComponents[0]!.purpose });
    expect(out.nodes.filter((n) => n.section === 'S06.sec3')).toEqual([
      expect.objectContaining({ newComponent: 'TitleCover', parent: '', box: expect.objectContaining({ width: 'fixed', widthPx: 160 }) }),
    ]);
  });

  it('gives a component placed on its own its catalog slots, with its words and the instances placed in a parts slot', () => {
    const boarded = changed((c) => {
      c.catalog.components.find((x) => x.name === 'TitleCover')!.slots.push(
        { name: 'caption', kind: 'words', holds: 'a caption', minWidthPx: 0, maxWidthPx: 0 },
        { name: 'body', kind: 'parts', holds: 'what sits under the cover', minWidthPx: 0, maxWidthPx: 0 },
      );
      const cover = structuredClone(chain.designs.get('TitleCover')!);
      const like = cover.nodes[0]!;
      cover.nodes.push(
        { ...structuredClone(like), id: 'TitleCover.n90', parent: '', order: 90, what: 'the caption slot', role: 'text', slot: 'caption', text: '', layout: null },
        { ...structuredClone(like), id: 'TitleCover.n91', parent: '', order: 91, what: 'the body slot', role: 'container', slot: 'body', text: '', layout: cover.layout },
      );
      c.designs = new Map([...chain.designs, ['TitleCover', cover]]);
      const s06 = c.layouts.find((l) => l.screen === 'S06')!;
      s06.instances.push({ ...structuredClone(s06.instances[1]!), id: 'S06.p3', places: 'TitleCover', order: 3, headingLevel: 0, slots: [{ name: 'caption', text: 'Dune' }] });
      s06.instances[1]!.in = 'S06.p3/body';
    });
    const { screens: out, origin: from } = assembleChain(boarded, theme);
    const cover = out.nodes.find((n) => n.newComponent === 'TitleCover' && n.parent === '')!;
    const kids = out.nodes.filter((n) => n.parent === cover.id);
    expect(kids.map((n) => [n.what, n.text])).toEqual([['the caption slot', 'Dune'], ['the body slot', '']]);
    const body = kids[1]!;
    const panel = out.nodes.filter((n) => from.get(n.id)?.startsWith('W09.'));
    expect(panel.length).toBeGreaterThan(0);
    expect(panel.every((n) => n.section === cover.section)).toBe(true);
    expect([...new Set(panel.filter((n) => !from.get(n.parent)?.startsWith('W09.')).map((n) => n.parent))]).toEqual([body.id]);
  });

  it("adds a frame change's nodes and records what each screen adds and removes", () => {
    const framed = changed((c) => {
      const app = c.frames.find((f) => f.screen === 'SH1')!;
      app.changes.push({
        screen: 'S06',
        add: [{ ...structuredClone(app.nodes[1]!), id: 'SH1.S06.n01', order: 3, text: 'Export' }],
        remove: ['SH1.n02'],
      });
    });
    const out = assembleChain(framed, theme).screens;
    expect(out.frameChanges).toEqual([{ screen: 'S06', add: ['SH1.S06.n01'], remove: ['SH1.n02'] }]);
    const added = out.nodes.find((n) => n.id === 'SH1.S06.n01')!;
    expect(added).toMatchObject({ section: 'SH1.r1', text: 'Export' });
    // The rules count it on S06 alone, and a default node on every page of the shell.
    expect(screensOf(out, added)).toEqual(['S06']);
    expect(screensOf(out, out.nodes.find((n) => n.id === 'SH1.n01')!)).toEqual(['S04', 'S06']);
  });

  it('builds the copy deck from every word shown, each once, by first use', () => {
    const texts = assembled.copy.map((c) => c.text);
    expect(new Set(texts).size).toBe(texts.length);
    expect(assembled.copy[0]).toEqual({ id: 'C001', text: assembled.nodes.find((n) => n.text)?.text });
    expect(texts.filter((t) => t === 'Add book')).toHaveLength(1);
  });

  it("lays a page out with its layout's spacing, a dialog with its own, and a box with the screen's gap", () => {
    const screen = (id: string) => assembled.screens.find((s) => s.id === id);
    expect(screen('S04')?.layout).toMatchObject({ direction: 'column', padding: theme.layouts.app.main.padding });
    expect(screen('S05')?.layout).toMatchObject({ gap: DIALOG_GAP, padding: '0' });
    expect(assembled.boxes.find((b) => b.id === 'S06.b1')?.layout).toMatchObject({
      direction: 'row',
      gap: theme.layouts.app.main.sectionGap,
    });
    const filled = changed((c) => (c.layouts.find((l) => l.screen === 'S05')!.instances[0]!.height = 'fill'));
    expect(assembleChain(filled, theme).screens.sections.find((s) => s.id === 'S05.sec1')?.box.height).toBe('fill');
  });
});

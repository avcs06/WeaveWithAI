import type { Issue } from '../../../core/issues';
import { defineRule } from '../../../core/rules';
import type { ModelNode } from '../06draw/schema';
import { sentences } from '../08assemble/validation/helpers';
import { confirmingSteps, type ScreenInput, type WidgetInput } from './helpers';

/**
 * DESIGN-048 · mandatory
 * A confirmation's words, checked where they are written (user, 2026-11-01):
 * each is one sentence, and they name what is destroyed, through a record's
 * data, in quotes, or as {Noun.attribute}. The screen call writes an
 * instance's slot words, the draw call a widget's own text. LAYOUT-063 keeps
 * the dialog's one text node and two buttons, which only the assembled
 * dialog shows.
 * Pass: "This removes “The Left Hand of Darkness” from your shelf for good."
 * Fail: "This dashboard and all widgets go. No undo."
 */

const names = (text: string, data: string[] = []) =>
  data.length > 0 || /[“"«]/.test(text) || /\{[A-Z]\w*\.\w+\}/.test(text);

/** On a confirmation dialog, each instance's slot words; the record is named in a slot beside the title, when the widget has one. */
export const screenRule = defineRule<ScreenInput>(
  'DESIGN-048',
  'mandatory',
  ({ layout, screen, ctx }, fail) => {
    const confirming = confirmingSteps(ctx.flows);
    if (screen.type === 'page' || !screen.flowSteps.some((id) => confirming.includes(id))) return [];
    const issues: Issue[] = [];
    for (const instance of layout.instances) {
      for (const slot of instance.slots)
        if (sentences(slot.text) > 1)
          issues.push(fail(`${instance.id} is on the confirmation ${screen.id}, and its ${slot.name} says ${sentences(slot.text)} sentences. Each words slot of a confirmation is one sentence. Make the ${slot.name} of ${instance.id} one sentence.`, instance.id));
      const beside = instance.slots.filter((s) => s.name !== 'title');
      if (beside.length && !instance.slots.some((s) => names(s.text)))
        issues.push(fail(`${instance.id} is on the confirmation ${screen.id}, and none of its words names what is destroyed. A confirmation names the record it destroys. Name it in one slot, such as the description, with its value in quotes as “{Noun.attribute}”, such as This removes “{Book.title}” for good.`, instance.id));
    }
    return issues;
  },
);

/** In a widget serving a confirmation's step, each text with its own words. */
export const widgetRule = defineRule<WidgetInput>(
  'DESIGN-048',
  'mandatory',
  ({ build, widget, ctx }, fail) => {
    const confirming = confirmingSteps(ctx.flows);
    if (!widget.flowSteps.some((id) => confirming.includes(id))) return [];
    // A text that shows a record's value has its whole line in `sample`.
    const words = (n: ModelNode) => n.text || n.sample;
    const texts = build.nodes.filter((n) => n.role === 'text' && !n.slot && words(n));
    const issues = texts
      .filter((n) => sentences(words(n)) > 1)
      .map((n) => fail(`${n.id} is text in ${widget.id}, which serves a confirmation, and it says ${sentences(words(n))} sentences. A confirmation says one sentence. Make ${n.id} one sentence.`, n.id));
    if (texts.length && !texts.some((n) => names(words(n), n.data)))
      issues.push(fail(`${widget.id} serves a confirmation, and its text does not name what is destroyed. A confirmation names the record it destroys. Show the record's value in ${texts[0]?.id} through its data, as Noun.attribute, or put its name in quotes.`, widget.id));
    return issues;
  },
);

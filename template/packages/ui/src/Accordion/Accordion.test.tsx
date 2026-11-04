import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CircleHelp } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '../Button';
import { Section } from '../Section';
import { axe, renderUI } from '../test-utils';

import { accordionRecipe } from './Accordion.recipes.css';

import { Accordion, type AccordionProps, Collapsible } from '.';

const { variants } = accordionRecipe.classNames;

const trigger = (name: string) => screen.getByRole('button', { name });
const isOpen = (name: string) =>
  trigger(name).getAttribute('aria-expanded') === 'true';

const Faq = (props: Partial<AccordionProps>) => (
  <Accordion {...(props as AccordionProps)}>
    <Accordion.Item
      value="refunds"
      title="Refunds"
      description="Until a week before"
    >
      <p>Yes, until a week before the event.</p>
    </Accordion.Item>
    <Accordion.Item value="transfer" title="Transfers">
      <p>Change the attendee’s name.</p>
    </Accordion.Item>
    <Accordion.Item value="access" title="Access">
      <p>Every hall has step-free access.</p>
    </Accordion.Item>
  </Accordion>
);

describe('Accordion', () => {
  it('each heading is a button in an h2, described by its description; the open one shows a named region', async () => {
    const { container } = renderUI(<Faq defaultValue="refunds" />);
    const refunds = trigger('Refunds');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Refunds' }),
    ).toContainElement(refunds);
    expect(refunds).toHaveAttribute('aria-expanded', 'true');
    expect(refunds).toHaveAccessibleDescription('Until a week before');
    expect(screen.getByRole('region', { name: 'Refunds' })).toHaveTextContent(
      'Yes, until a week before the event.',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a closed section’s content isn’t rendered', () => {
    renderUI(<Faq />);
    expect(isOpen('Refunds')).toBe(false);
    expect(screen.queryByText(/until a week before the event/)).toBeNull();
  });

  it('single mode (default): opening one closes the other; the open one closes from its heading', async () => {
    renderUI(<Faq defaultValue="refunds" />);
    await userEvent.click(trigger('Transfers'));
    expect(isOpen('Transfers')).toBe(true);
    expect(isOpen('Refunds')).toBe(false);
    await userEvent.click(trigger('Transfers'));
    expect(isOpen('Transfers')).toBe(false);
  });

  it('multiple mode: any number open', async () => {
    renderUI(<Faq mode="multiple" defaultValue={['refunds']} />);
    await userEvent.click(trigger('Access'));
    expect(isOpen('Refunds')).toBe(true);
    expect(isOpen('Access')).toBe(true);
  });

  it('controlled: value changes only through onValueChange', async () => {
    const onValueChange = jest.fn();
    const { rerender } = renderUI(
      <Faq value="refunds" onValueChange={onValueChange} />,
    );
    await userEvent.click(trigger('Access'));
    expect(onValueChange).toHaveBeenLastCalledWith('access');
    expect(isOpen('Refunds')).toBe(true);
    expect(isOpen('Access')).toBe(false);

    rerender(<Faq value="access" onValueChange={onValueChange} />);
    expect(isOpen('Access')).toBe(true);
    expect(isOpen('Refunds')).toBe(false);
  });

  it('keyboard: Tab reaches the headings, arrows, Home and End move, Enter and Space toggle', async () => {
    renderUI(<Faq />);
    await userEvent.tab();
    expect(trigger('Refunds')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(trigger('Transfers')).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(trigger('Access')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(trigger('Refunds')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(trigger('Access')).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    expect(isOpen('Access')).toBe(true);
    await userEvent.keyboard(' ');
    expect(isOpen('Access')).toBe(false);
  });

  it('inside a Section, its headings are a level deeper', () => {
    renderUI(
      <Section title="Help">
        <Faq />
      </Section>,
    );
    expect(
      screen.getByRole('heading', { level: 3, name: 'Refunds' }),
    ).toBeInTheDocument();
  });

  it('icons are decoration; an add-on joins the heading’s name', async () => {
    const { container } = renderUI(
      <Accordion>
        <Accordion.Item
          value="access"
          title="Access"
          leftIcon={<CircleHelp data-testid="icon" />}
          rightAddOn={<span>Updated</span>}
        >
          <p>Step-free.</p>
        </Accordion.Item>
      </Accordion>,
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
    expect(trigger('Access Updated')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('headerAction sits outside the heading’s button, before the chevron, and never toggles', async () => {
    const onShare = jest.fn();
    const { container } = renderUI(
      <Accordion>
        <Accordion.Item
          value="refunds"
          title="Refunds"
          headerAction={<Button onClick={onShare}>Share</Button>}
        >
          <p>Yes.</p>
        </Accordion.Item>
      </Accordion>,
    );
    const share = trigger('Share');
    expect(trigger('Refunds')).not.toContainElement(share);
    const actions = container.querySelector('[data-slot="header-actions"]');
    expect(actions?.firstElementChild).toBe(share);
    expect(actions?.lastElementChild).toHaveAttribute('data-slot', 'chevron');
    expect(actions?.lastElementChild).toHaveAttribute('aria-hidden', 'true');

    await userEvent.click(share);
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(isOpen('Refunds')).toBe(false);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the item carries its state for the chevron', async () => {
    const { container } = renderUI(<Faq />);
    const item = container.querySelector('[data-slot="section"]');
    expect(item).toHaveAttribute('data-state', 'closed');
    await userEvent.click(trigger('Refunds'));
    expect(item).toHaveAttribute('data-state', 'open');
  });

  it('applies its look, bordered by default', () => {
    const { container } = renderUI(
      <>
        <Faq />
        <Faq look="open" />
      </>,
    );
    const [bordered, open] = Array.from(
      container.querySelectorAll('[data-slot="accordion"]'),
    );
    expect(bordered).toHaveClass(variants.border.bordered);
    expect(open).toHaveClass(variants.border.open);
  });
});

describe('Collapsible', () => {
  it('is one section: closed by default, opens from its heading', async () => {
    const { container } = renderUI(
      <Collapsible title="Advanced settings" description="Address">
        <p>design-systems-meetup</p>
      </Collapsible>,
    );
    expect(isOpen('Advanced settings')).toBe(false);
    expect(screen.queryByText('design-systems-meetup')).toBeNull();
    await userEvent.click(trigger('Advanced settings'));
    expect(screen.getByText('design-systems-meetup')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('defaultOpen starts it open', () => {
    renderUI(
      <Collapsible title="Advanced settings" defaultOpen>
        <p>design-systems-meetup</p>
      </Collapsible>,
    );
    expect(isOpen('Advanced settings')).toBe(true);
  });

  it('controlled: open follows the parent, and onOpenChange reports each change', async () => {
    const onOpenChange = jest.fn();
    const Settings = () => {
      const [open, setOpen] = useState(false);
      return (
        <Collapsible
          title="Advanced settings"
          open={open}
          onOpenChange={(next) => {
            onOpenChange(next);
            setOpen(next);
          }}
        >
          <p>design-systems-meetup</p>
        </Collapsible>
      );
    };
    renderUI(<Settings />);
    await userEvent.click(trigger('Advanced settings'));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(isOpen('Advanced settings')).toBe(true);
    await userEvent.click(trigger('Advanced settings'));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(isOpen('Advanced settings')).toBe(false);
  });

  it('takes a look like Accordion', () => {
    const { container } = renderUI(
      <Collapsible title="Advanced settings" look="open" />,
    );
    expect(container.querySelector('[data-slot="accordion"]')).toHaveClass(
      variants.border.open,
    );
  });
});

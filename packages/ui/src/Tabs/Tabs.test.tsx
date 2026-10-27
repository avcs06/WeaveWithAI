import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Info } from 'lucide-react';
import React, { useState } from 'react';

import { axe, renderUI } from '../test-utils';

import { tabsRecipe } from './Tabs.recipes.css';

import { Tab, Tabs } from '.';

const { variants } = tabsRecipe.classNames;

const tab = (name: string) => screen.getByRole('tab', { name });
const tabNames = () =>
  screen.getAllByRole('tab').map((element) => element.textContent);

const tooltipEntries = async () => {
  await screen.findByRole('tooltip', { hidden: true });
  return Array.from(
    document.querySelectorAll('[data-side] > div'),
    (entry) => entry.textContent,
  );
};

/** State a panel keeps itself, to tell a kept panel from a remounted one. */
const Counter = () => {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
  );
};

const Session = ({ showSpeakers = true }: { showSpeakers?: boolean }) => (
  <Tabs>
    <Tab value="details" title="Details">
      Opening keynote, Hall A.
    </Tab>
    {showSpeakers && (
      <Tab value="speakers" title="Speakers" keepMounted>
        <Counter />
      </Tab>
    )}
    <Tab value="feedback" title="Feedback">
      No feedback yet.
    </Tab>
  </Tabs>
);

describe('Tabs', () => {
  it('lists its tabs in order and shows the first one’s panel', async () => {
    const { container } = renderUI(<Session />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(tabNames()).toEqual(['Details', 'Speakers', 'Feedback']);
    expect(tab('Details')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Feedback')).toHaveAttribute('aria-selected', 'false');

    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('Opening keynote, Hall A.');
    expect(panel).toHaveAccessibleName('Details');
    expect(tab('Details')).toHaveAttribute('aria-controls', panel.id);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('a press shows the tab’s panel and unmounts the one before', async () => {
    renderUI(<Session />);
    await userEvent.click(tab('Feedback'));
    expect(tab('Feedback')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('No feedback yet.');
    expect(screen.queryByText('Opening keynote, Hall A.')).toBeNull();
  });

  it('keepMounted renders the panel from the start and keeps its state while hidden', async () => {
    renderUI(<Session />);
    const counter = screen.getByRole('button', {
      name: 'Clicked 0 times',
      hidden: true,
    });
    expect(counter).not.toBeVisible();

    await userEvent.click(tab('Speakers'));
    await userEvent.click(
      screen.getByRole('button', { name: 'Clicked 0 times' }),
    );
    await userEvent.click(tab('Details'));
    expect(
      screen.getByRole('button', { name: 'Clicked 1 times', hidden: true }),
    ).not.toBeVisible();
    await userEvent.click(tab('Speakers'));
    expect(
      screen.getByRole('button', { name: 'Clicked 1 times' }),
    ).toBeVisible();
  });

  it('the arrow keys move between tabs and show each one’s panel; Tab leaves the list', async () => {
    renderUI(
      <>
        <Session />
        <button>After</button>
      </>,
    );
    await userEvent.tab();
    expect(tab('Details')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tab('Speakers')).toHaveFocus();
    expect(tab('Speakers')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    expect(tab('Feedback')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(tab('Details')).toHaveFocus();

    // The panel isn't a tab stop: Tab goes on to what follows.
    expect(screen.getByRole('tabpanel')).not.toHaveAttribute('tabindex');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('Tab reaches what the panel holds after the active tab', async () => {
    renderUI(
      <Tabs>
        <Tab value="speakers" title="Speakers">
          <button>Invite a speaker</button>
        </Tab>
        <Tab value="feedback" title="Feedback">
          No feedback yet.
        </Tab>
      </Tabs>,
    );
    await userEvent.tab();
    expect(tab('Speakers')).toHaveFocus();
    await userEvent.tab();
    expect(
      screen.getByRole('button', { name: 'Invite a speaker' }),
    ).toHaveFocus();
  });

  it('marks the list while the pointer is in use, so a pressed tab shows no focus ring', async () => {
    renderUI(
      <>
        <Session />
        <button>After</button>
      </>,
    );
    const list = screen.getByRole('tablist');
    fireEvent.pointerDown(tab('Speakers'));
    expect(list).toHaveAttribute('data-pointer');

    // A key inside the list is the keyboard back in use.
    act(() => tab('Speakers').focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(list).not.toHaveAttribute('data-pointer');

    // So is focus leaving the list: Tab back in shows the ring again.
    fireEvent.pointerDown(tab('Feedback'));
    act(() => screen.getByRole('button', { name: 'After' }).focus());
    expect(list).not.toHaveAttribute('data-pointer');
  });

  it('a tab shown by a condition keeps its place in the list', () => {
    const { rerender } = renderUI(<Session showSpeakers={false} />);
    expect(tabNames()).toEqual(['Details', 'Feedback']);
    rerender(<Session showSpeakers />);
    expect(tabNames()).toEqual(['Details', 'Speakers', 'Feedback']);
  });

  it('draws icons as decoration: the title names the tab', async () => {
    const { container } = renderUI(
      <Tabs>
        <Tab value="details" title="Details" leftIcon={<Info />}>
          Opening keynote.
        </Tab>
      </Tabs>,
    );
    expect(tab('Details')).toBeInTheDocument();
    expect(tab('Details').querySelector('[data-slot="icon"]')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('applies the variant to the root, defaulting to default', () => {
    renderUI(
      <>
        <Tabs>
          <Tab value="a" title="A">
            A
          </Tab>
        </Tabs>
        <Tabs variant="base">
          <Tab value="b" title="B">
            B
          </Tab>
        </Tabs>
      </>,
    );
    const [first, second] = [tab('A'), tab('B')].map((element) =>
      element.closest(
        `.${variants.variant.default}, .${variants.variant.base}`,
      ),
    );
    expect(first).toHaveClass(variants.variant.default);
    expect(second).toHaveClass(variants.variant.base);
  });

  it('renders nothing without tabs', () => {
    const { container } = renderUI(<Tabs>{null}</Tabs>);
    expect(container).toBeEmptyDOMElement();
  });

  describe('controlled', () => {
    const Controlled = ({ initial = 'details' }: { initial?: string }) => {
      const [view, setView] = useState(initial);
      return (
        <>
          <button onClick={() => setView('feedback')}>Review feedback</button>
          <output>{view}</output>
          <Tabs activeTab={view} onTabChange={setView}>
            <Tab value="details" title="Details">
              Opening keynote.
            </Tab>
            <Tab value="feedback" title="Feedback">
              No feedback yet.
            </Tab>
          </Tabs>
        </>
      );
    };

    it('activeTab decides the tab, and onTabChange reports a press', async () => {
      renderUI(<Controlled />);
      await userEvent.click(tab('Feedback'));
      expect(screen.getByRole('status')).toHaveTextContent('feedback');
      expect(tab('Feedback')).toHaveAttribute('aria-selected', 'true');
    });

    it('a change from outside shows that tab', async () => {
      renderUI(<Controlled />);
      await userEvent.click(
        screen.getByRole('button', { name: 'Review feedback' }),
      );
      expect(tab('Feedback')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tabpanel')).toHaveTextContent(
        'No feedback yet.',
      );
    });

    it('an activeTab no tab has shows the first tab', () => {
      renderUI(<Controlled initial="speakers" />);
      expect(tab('Details')).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('when a tab cannot be chosen', () => {
    const Blocked = ({ onTabChange }: { onTabChange?: jest.Mock }) => (
      <Tabs onTabChange={onTabChange}>
        <Tab value="details" title="Details">
          Opening keynote.
        </Tab>
        <Tab
          value="feedback"
          title="Feedback"
          disabledWithReason="Opens after the session"
        >
          No feedback yet.
        </Tab>
        <Tab value="notes" title="Notes" disabled>
          Notes.
        </Tab>
        <Tab
          value="recording"
          title="Recording"
          loadingWithReason="Processing the recording"
        >
          Recording ready.
        </Tab>
        <Tab value="files" title="Files" loading>
          Files.
        </Tab>
      </Tabs>
    );

    it('no press or key chooses it, and its panel never shows', async () => {
      const onTabChange = jest.fn();
      const { container } = renderUI(<Blocked onTabChange={onTabChange} />);
      for (const name of ['Feedback', 'Notes', 'Recording', 'Files']) {
        await userEvent.click(tab(name));
        expect(tab(name)).toHaveAttribute('aria-selected', 'false');
        expect(tab(name)).toHaveAttribute('aria-disabled', 'true');
        expect(tab(name)).not.toHaveAttribute('disabled');
      }
      act(() => tab('Feedback').focus());
      await userEvent.keyboard('[Space]{Enter}');
      expect(onTabChange).not.toHaveBeenCalled();
      expect(screen.getByRole('tabpanel')).toHaveTextContent(
        'Opening keynote.',
      );
      expect(await axe(container)).toHaveNoViolations();
    });

    it('with a reason, the arrow keys still reach it and its tooltip says why', async () => {
      renderUI(<Blocked />);
      await userEvent.tab();
      await userEvent.keyboard('{ArrowRight}');
      expect(tab('Feedback')).toHaveFocus();
      expect(tab('Feedback')).toHaveAccessibleDescription(
        'Opens after the session',
      );
      // Notes and Files have no reason to show: the arrow keys skip them.
      await userEvent.keyboard('{ArrowRight}');
      expect(tab('Recording')).toHaveFocus();
      await userEvent.keyboard('{ArrowRight}');
      expect(tab('Details')).toHaveFocus();

      await userEvent.hover(tab('Feedback'));
      expect(await tooltipEntries()).toEqual(['Opens after the session']);
    });

    it('loading shows a spinner and marks the tab busy', () => {
      renderUI(<Blocked />);
      expect(tab('Files')).toHaveAttribute('aria-busy', 'true');
      expect(
        tab('Files').querySelector('[data-slot="icon"]'),
      ).toBeInTheDocument();
    });

    it('starts at the first tab that can be chosen', () => {
      renderUI(
        <Tabs>
          <Tab value="notes" title="Notes" disabled>
            Notes.
          </Tab>
          <Tab value="details" title="Details">
            Opening keynote.
          </Tab>
        </Tabs>,
      );
      expect(tab('Details')).toHaveAttribute('aria-selected', 'true');
    });

    it('with every tab blocked, the list shows without an active tab or a panel', async () => {
      renderUI(
        <Tabs>
          <Tab value="a" title="A" disabled>
            A panel
          </Tab>
          <Tab value="b" title="B" disabledWithReason="Not yet">
            B panel
          </Tab>
        </Tabs>,
      );
      expect(tabNames()).toEqual(['A', 'B']);
      for (const element of screen.getAllByRole('tab'))
        expect(element).toHaveAttribute('aria-selected', 'false');
      expect(screen.queryByText('A panel')).toBeNull();
      expect(screen.queryByText('B panel')).toBeNull();
      await userEvent.click(tab('B'));
      expect(tab('B')).toHaveAttribute('aria-selected', 'false');
    });
  });
});

describe('types', () => {
  it('tabs are named by value and title; activeTab follows Tabs’ type', () => {
    const elements = [
      <Tabs<'details' | 'speakers'>
        activeTab="details"
        onTabChange={(value: 'details' | 'speakers') => value}
      >
        <Tab value="details" title="Details">
          Details
        </Tab>
      </Tabs>,
      // @ts-expect-error activeTab is one of Tabs' values.
      <Tabs<'details' | 'speakers'> activeTab="notes">
        <Tab value="details" title="Details">
          Details
        </Tab>
      </Tabs>,
      // @ts-expect-error A tab needs a title.
      <Tab value="details">Details</Tab>,
      // @ts-expect-error A tab needs a value to be chosen by.
      <Tab title="Details">Details</Tab>,
      // @ts-expect-error A tab's children are its panel.
      <Tab value="details" title="Details" />,
      // @ts-expect-error Disabled silently or with a reason, not both.
      <Tab value="details" title="Details" disabled disabledWithReason="Soon">
        Details
      </Tab>,
      // @ts-expect-error Loading silently or with a reason, not both.
      <Tab value="details" title="Details" loading loadingWithReason="Soon">
        Details
      </Tab>,
    ];
    expect(elements).toHaveLength(7);
  });
});

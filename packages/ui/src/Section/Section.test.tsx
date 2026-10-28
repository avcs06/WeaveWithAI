import { screen } from '@testing-library/react';
import { Bell } from 'lucide-react';
import React from 'react';

import { Button } from '../Button';
import { Radio, RadioGroup } from '../Radio';
import { axe, renderUI } from '../test-utils';

import { Section } from '.';

const heading = (level: number, name: string) =>
  screen.getByRole('heading', { level, name });

describe('Section', () => {
  it('is a heading, a description and content, with fixed spacing', async () => {
    const { container } = renderUI(
      <Section title="Profile" description="How other attendees see you">
        <p>Ada Lovelace</p>
      </Section>,
    );
    const section = container.querySelector('section');
    expect(heading(2, 'Profile')).toBeInTheDocument();
    expect(screen.getByText('How other attendees see you')).toHaveAttribute(
      'data-slot',
      'description',
    );
    expect(section).toHaveClass('flex-col-gap-5', 'p-5');
    expect(section?.querySelector('[data-slot="header"]')).toBeInTheDocument();
    expect(section?.querySelector('[data-slot="content"]')).toHaveClass(
      'flex-col-gap-4',
      'flex-fill-y',
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('leaves out the description and the content it isn’t given', async () => {
    const { container } = renderUI(<Section title="Danger zone" />);
    expect(
      container.querySelector('[data-slot="description"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="content"]'),
    ).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('is not a landmark: headings outline the page', () => {
    renderUI(<Section title="Profile" />);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('nested, takes the next heading level, up to h6', () => {
    renderUI(
      <Section title="One">
        <Section title="Two">
          <Section title="Three">
            <Section title="Four">
              <Section title="Five">
                <Section title="Six">
                  <Section title="Seven" />
                </Section>
              </Section>
            </Section>
          </Section>
        </Section>
      </Section>,
    );
    expect(heading(2, 'One')).toBeInTheDocument();
    expect(heading(3, 'Two')).toBeInTheDocument();
    expect(heading(6, 'Five')).toBeInTheDocument();
    expect(heading(6, 'Seven')).toBeInTheDocument();
  });

  it('headingAs picks the element, and sections inside continue from it', () => {
    renderUI(
      <Section title="Settings" headingAs="h1">
        <Section title="Language" />
      </Section>,
    );
    expect(heading(1, 'Settings')).toBeInTheDocument();
    expect(heading(2, 'Language')).toBeInTheDocument();
  });

  it('titleId lets a control be named by the heading', () => {
    renderUI(
      <Section title="Session length" titleId="session-length">
        <RadioGroup
          aria-labelledby="session-length"
          value="30"
          onChange={() => undefined}
        >
          <Radio value="30">30 minutes</Radio>
        </RadioGroup>
      </Section>,
    );
    expect(
      screen.getByRole('radiogroup', { name: 'Session length' }),
    ).toBeInTheDocument();
  });

  it('icons are decoration; an add-on joins the heading’s text', async () => {
    const { container } = renderUI(
      <Section
        title="Notifications"
        leftIcon={<Bell data-testid="icon" />}
        rightAddOn={<span>On</span>}
      />,
    );
    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
    expect(heading(2, 'Notifications On')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('headerAction sits at the header’s end, outside the heading', async () => {
    const { container } = renderUI(
      <Section title="Venue" headerAction={<Button>Add hall</Button>}>
        <p>Halls</p>
      </Section>,
    );
    const action = screen.getByRole('button', { name: 'Add hall' });
    expect(heading(2, 'Venue')).not.toContainElement(action);
    expect(action.closest('[data-slot="header-actions"]')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('puts props and className on the section', () => {
    const { container } = renderUI(
      <Section
        title="Profile"
        id="profile"
        data-kind="settings"
        className="w-full"
      />,
    );
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('id', 'profile');
    expect(section).toHaveAttribute('data-kind', 'settings');
    expect(section).toHaveClass('w-full', 'p-5');
  });
});

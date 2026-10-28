import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Avatar } from './Avatar';
import { avatarRecipe } from './Avatar.recipes.css';

const { variants } = avatarRecipe.classNames;

// Tooltips close after a timer: wait past it before asserting that none opened.
const settle = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 50)));

describe('Avatar', () => {
  it('is hidden from assistive tech by default, with no tab stop and no tooltip', async () => {
    const { container } = renderUI(<Avatar name="ada byron lovelace" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container).toHaveTextContent('AL');
    expect(container.firstElementChild).not.toHaveAttribute('tabindex');
    await userEvent.tab();
    expect(document.body).toHaveFocus();
    await userEvent.hover(container.firstElementChild!);
    await settle();
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with aria-hidden={false}: an image named for the person, focusable for its name tooltip', async () => {
    const { container } = renderUI(
      <Avatar name="Ada Lovelace" aria-hidden={false} />,
    );
    const avatar = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(avatar).toHaveTextContent('AL');
    expect(avatar).not.toHaveAttribute('aria-hidden');
    // Description is null: the name is the label, not also a description.
    expect(avatar).not.toHaveAttribute('aria-describedby');
    expect(avatar).toHaveAttribute('tabindex', '0');
    await userEvent.tab();
    expect(avatar).toHaveFocus();
    expect(
      await screen.findByRole('tooltip', { hidden: true }),
    ).toHaveTextContent('Ada Lovelace');
    await userEvent.tab({ shift: true });
    expect(screen.queryByRole('tooltip', { hidden: true })).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with aria-hidden={false} inside a link or button: no second tab stop inside the control', async () => {
    const { container } = renderUI(
      <>
        <a href="/ada" aria-label="Ada Lovelace's profile">
          <Avatar name="Ada Lovelace" aria-hidden={false} />
        </a>
        <button type="button" aria-label="Account menu for Grace Hopper">
          <span>
            <Avatar name="Grace Hopper" aria-hidden={false} />
          </span>
        </button>
      </>,
    );
    for (const name of ['Ada Lovelace', 'Grace Hopper']) {
      expect(screen.getByRole('img', { name })).not.toHaveAttribute('tabindex');
    }
    await userEvent.tab();
    expect(screen.getByRole('link')).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('one word gives its first letter', () => {
    renderUI(<Avatar name="madonna" aria-hidden={false} />);
    expect(screen.getByRole('img', { name: 'madonna' })).toHaveTextContent('M');
  });

  it('keeps a first letter outside the BMP whole', () => {
    const { container } = renderUI(<Avatar name="𝓐da 😀mile" />);
    expect(container).toHaveTextContent('𝓐😀');
  });

  it('with an empty name: shows ? and stays hidden, even with aria-hidden={false}', async () => {
    const { container } = renderUI(<Avatar name="" aria-hidden={false} />);
    expect(container).toHaveTextContent('?');
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.firstElementChild).not.toHaveAttribute('tabindex');
    await userEvent.tab();
    expect(document.body).toHaveFocus();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the name in a tooltip on hover when it stands on its own', async () => {
    const { container } = renderUI(
      <Avatar name="Grace Hopper" aria-hidden={false} />,
    );
    await userEvent.hover(screen.getByRole('img', { name: 'Grace Hopper' }));
    expect(
      await screen.findByRole('tooltip', { hidden: true }),
    ).toHaveTextContent('Grace Hopper');
    expect(await axe(document.body)).toHaveNoViolations();
    expect(container).toBeInTheDocument();
  });

  it('shows the photo inside the named avatar', async () => {
    const { container } = renderUI(
      <Avatar name="Grace Hopper" src="/grace.png" aria-hidden={false} />,
    );
    // The photo and the initials are one image, named once by the avatar.
    const avatar = screen.getByRole('img', { name: 'Grace Hopper' });
    expect(screen.getAllByRole('img')).toEqual([avatar]);
    const photo = container.querySelector('[data-slot="image"]');
    expect(photo?.tagName).toBe('IMG');
    expect(photo).toHaveAttribute('src', '/grace.png');
    expect(photo).toHaveAttribute('alt', '');
    expect(container.querySelector('[data-slot="initials"]')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('falls back to the initials when the photo fails to load', async () => {
    const { container } = renderUI(
      <Avatar name="Grace Hopper" src="/missing.png" aria-hidden={false} />,
    );
    fireEvent.error(container.querySelector('[data-slot="image"]')!);
    const avatar = screen.getByRole('img', { name: 'Grace Hopper' });
    expect(avatar.tagName).toBe('SPAN');
    expect(avatar).toHaveTextContent('GH');
    expect(container.querySelector('[data-slot="image"]')).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('falls back to the initials when the photo failed before hydration', async () => {
    // Settled and broken: React never saw the error event.
    jest
      .spyOn(HTMLImageElement.prototype, 'complete', 'get')
      .mockReturnValue(true);
    HTMLImageElement.prototype.decode = () =>
      Promise.reject(new Error('broken'));
    try {
      const { container } = renderUI(
        <Avatar name="Grace Hopper" src="/missing.png" aria-hidden={false} />,
      );
      await act(async () => undefined);
      const avatar = screen.getByRole('img', { name: 'Grace Hopper' });
      expect(avatar.tagName).toBe('SPAN');
      expect(avatar).toHaveTextContent('GH');
      expect(await axe(container)).toHaveNoViolations();
    } finally {
      jest.restoreAllMocks();
      // @ts-expect-error jsdom has none; this test adds one.
      delete HTMLImageElement.prototype.decode;
    }
  });

  it('applies the size', () => {
    renderUI(
      <>
        <Avatar size="sm" name="Small" aria-hidden={false} />
        <Avatar name="Medium" aria-hidden={false} />
        <Avatar size="lg" name="Large" aria-hidden={false} />
      </>,
    );
    expect(screen.getByRole('img', { name: 'Small' })).toHaveClass(
      variants.size.sm,
    );
    expect(screen.getByRole('img', { name: 'Medium' })).toHaveClass(
      variants.size.md,
    );
    expect(screen.getByRole('img', { name: 'Large' })).toHaveClass(
      variants.size.lg,
    );
  });
});

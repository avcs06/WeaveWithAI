import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { Avatar } from './Avatar';
import { avatarRecipe } from './Avatar.recipes.css';

const { variants } = avatarRecipe.classNames;

describe('Avatar', () => {
  it('is hidden from assistive tech by default', async () => {
    const { container } = renderUI(<Avatar name="ada byron lovelace" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(container).toHaveTextContent('AB');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('with aria-hidden={false}: an image named for the person', async () => {
    const { container } = renderUI(
      <Avatar name="Ada Lovelace" aria-hidden={false} />,
    );
    const avatar = screen.getByRole('img', { name: 'Ada Lovelace' });
    expect(avatar).toHaveTextContent('AL');
    expect(avatar).not.toHaveAttribute('aria-hidden');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('keeps a first letter outside the BMP whole', () => {
    const { container } = renderUI(<Avatar name="𝓐da 😀mile" />);
    expect(container).toHaveTextContent('𝓐😀');
  });

  it('with an empty name: shows ? and stays hidden', async () => {
    const { container } = renderUI(<Avatar name="" aria-hidden={false} />);
    expect(container).toHaveTextContent('?');
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the name in a tooltip on hover', async () => {
    const { container } = renderUI(<Avatar name="Grace Hopper" />);
    await userEvent.hover(container.firstElementChild!);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Grace Hopper',
    );
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('shows the photo with the name as its alt text', async () => {
    const { container } = renderUI(
      <Avatar name="Grace Hopper" src="/grace.png" aria-hidden={false} />,
    );
    const image = screen.getByRole('img', { name: 'Grace Hopper' });
    expect(image.tagName).toBe('IMG');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('falls back to the initials when the photo fails to load', async () => {
    const { container } = renderUI(
      <Avatar name="Grace Hopper" src="/missing.png" aria-hidden={false} />,
    );
    fireEvent.error(screen.getByRole('img'));
    const avatar = screen.getByRole('img', { name: 'Grace Hopper' });
    expect(avatar.tagName).toBe('SPAN');
    expect(avatar).toHaveTextContent('GH');
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

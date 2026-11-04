import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Ticket } from 'lucide-react';
import React from 'react';

import { axe, renderUI } from '../test-utils';

import { useToastStore } from './store';
import { toastStatusRecipe } from './Toast.recipes.css';
import { ToastQueue } from './ToastQueue';

import {
  clearToasts,
  dismissToast,
  toast,
  updateToast,
  type ToastConfig,
} from '.';

const statuses = toastStatusRecipe.classNames.variants.status;

const region = () => screen.getByRole('region', { name: /Notifications/ });
const toasts = () => within(region()).queryAllByRole('listitem');
const show = (config: ToastConfig) => {
  let id = '';
  act(() => {
    id = toast(config);
  });
  return id;
};

// Every live region on the page, as `role/aria-live: "text"`.
const liveRegions = () =>
  Array.from(
    document.querySelectorAll('[aria-live], [role="status"], [role="alert"]'),
    (element) =>
      `${element.getAttribute('role') ?? ''}/${element.getAttribute('aria-live') ?? ''}: "${element.textContent}"`,
  );

// The store outlives each test: start every test from an empty one.
afterEach(() => {
  act(() => useToastStore.setState({ toasts: [], announcement: undefined }));
});

describe('toast', () => {
  it('shows its title and description in the notifications region', async () => {
    renderUI(<ToastQueue />);
    show({ title: 'Session saved', description: 'Attendees see it at once.' });

    const [saved] = toasts();
    expect(saved).toHaveTextContent('Session saved');
    expect(saved).toHaveTextContent('Attendees see it at once.');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('isn’t a tab stop itself: Tab reaches its buttons', async () => {
    renderUI(<ToastQueue />);
    show({ title: 'Session saved', closable: true });
    expect(toasts()[0]).not.toHaveAttribute('tabindex');
  });

  it('lists the newest last, at the bottom of the stack', () => {
    renderUI(<ToastQueue />);
    show({ title: 'First' });
    show({ title: 'Second' });
    expect(toasts().map((element) => element.textContent)).toEqual([
      'First',
      'Second',
    ]);
  });

  it('shows its status by the icon and, to screen readers, in words; info by default', () => {
    renderUI(<ToastQueue />);
    for (const [status, label] of [
      [undefined, ''],
      ['success', 'Success: '],
      ['error', 'Error: '],
      ['warning', 'Warning: '],
      ['loading', 'Loading: '],
    ] as const) {
      act(() => clearToasts());
      act(() => useToastStore.setState({ toasts: [] }));
      show({ title: 'Schedule', status });
      const statusSlot = toasts()[0]!.querySelector('[data-slot="status"]');
      expect(statusSlot).toHaveClass(statuses[status ?? 'info']);
      // Exactly: the trailing space parts the label from the title.
      expect(statusSlot?.textContent).toBe(label);
    }
  });

  it('takes an icon in place of its status’s', () => {
    renderUI(<ToastQueue />);
    show({
      title: 'Ticket transferred',
      icon: <Ticket data-testid="ticket" />,
    });
    expect(toasts()[0]!.querySelector('[data-slot="status"]')).toContainElement(
      screen.getByTestId('ticket'),
    );
  });

  describe('updating', () => {
    it('updateToast turns one toast into another', () => {
      renderUI(<ToastQueue />);
      const id = show({ title: 'Publishing', status: 'loading' });
      act(() => updateToast(id, { title: 'Published', status: 'success' }));
      expect(toasts()).toHaveLength(1);
      expect(toasts()[0]).toHaveTextContent('Published');
      expect(toasts()[0]!.querySelector('[data-slot="status"]')).toHaveClass(
        statuses.success,
      );
    });

    it('an unknown or closed id changes nothing', () => {
      renderUI(<ToastQueue />);
      const id = show({ title: 'Saved' });
      act(() => {
        updateToast('unknown', { title: 'Changed' });
        dismissToast('unknown');
      });
      expect(toasts()[0]).toHaveTextContent('Saved');

      act(() => {
        dismissToast(id);
        updateToast(id, { title: 'Changed' });
      });
      expect(useToastStore.getState().toasts[0]?.config.title).toBe('Saved');
    });
  });

  describe('closing', () => {
    it('dismissToast marks it closed for its exit, then removes it; onClose runs once', async () => {
      renderUI(<ToastQueue />);
      const onClose = jest.fn();
      const id = show({ title: 'Bye', onClose });
      act(() => {
        dismissToast(id);
        dismissToast(id);
      });
      // With no animation to play, Radix unmounts at once; the store keeps it,
      // closed, until the exit time is up.
      expect(useToastStore.getState().toasts).toMatchObject([
        { id, open: false },
      ]);
      expect(onClose).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(useToastStore.getState().toasts).toEqual([]));
    });

    it('clearToasts closes every toast', async () => {
      renderUI(<ToastQueue />);
      show({ title: 'First' });
      show({ title: 'Second' });
      act(() => clearToasts());
      await waitFor(() => expect(toasts()).toHaveLength(0));
    });

    it('closes on its own after its duration', async () => {
      renderUI(<ToastQueue />);
      show({ title: 'Brief', duration: 50 });
      await waitFor(() => expect(toasts()).toHaveLength(0));
    });

    it('a loading toast stays past the default duration', () => {
      jest.useFakeTimers();
      try {
        renderUI(<ToastQueue />);
        show({ title: 'Publishing', status: 'loading' });
        show({ title: 'Saved' });
        act(() => jest.advanceTimersByTime(6000));
        expect(toasts().map((element) => element.textContent)).toEqual([
          'Loading: Publishing',
        ]);
      } finally {
        jest.useRealTimers();
      }
    });

    it('an action runs, then closes it; its button is named by its label', async () => {
      renderUI(<ToastQueue />);
      const onClick = jest.fn();
      show({
        title: 'Speaker removed',
        action: { label: 'Undo', altText: 'Add them back', onClick },
      });
      await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
      expect(onClick).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(toasts()).toHaveLength(0));
    });

    it('a close button only when closable; error toasts have one by default', async () => {
      renderUI(<ToastQueue />);
      show({ title: 'Saved' });
      expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();

      show({ title: 'Failed', status: 'error', closable: false });
      expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();

      act(() => useToastStore.setState({ toasts: [] }));
      show({ title: 'Failed', status: 'error' });
      await userEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(toasts()).toHaveLength(0));
    });

    it('Escape on its buttons closes it', async () => {
      renderUI(<ToastQueue />);
      show({ title: 'Lost connection', closable: true });
      act(() => screen.getByRole('button', { name: 'Close' }).focus());
      // The first Escape closes the focused button's tooltip, if shown.
      await userEvent.keyboard('{Escape}{Escape}');
      await waitFor(() => expect(toasts()).toHaveLength(0));
    });
  });

  describe('announcements', () => {
    it('reads a new toast politely, an error or warning at once', async () => {
      renderUI(<ToastQueue />);
      show({ title: 'Saved', status: 'success' });
      await waitFor(() =>
        expect(liveRegions()).toContain(
          'status/polite: "Notification Success: Saved"',
        ),
      );
      show({ title: 'Failed', status: 'error' });
      await waitFor(() =>
        expect(liveRegions()).toContain(
          'status/assertive: "Notification Error: Failed"',
        ),
      );
    });

    it('reads an update, which Radix announces only as a toast first shows', async () => {
      renderUI(<ToastQueue />);
      const id = show({ title: 'Publishing', status: 'loading' });

      act(() =>
        updateToast(id, {
          title: 'Published',
          description: 'Attendees see it at once.',
          status: 'success',
        }),
      );
      expect(liveRegions()).toContain(
        'status/: "Success: Published Attendees see it at once."',
      );

      // A patch merges: the description stays.
      act(() => updateToast(id, { title: 'Failed', status: 'error' }));
      expect(liveRegions()).toContain(
        'alert/: "Error: Failed Attendees see it at once."',
      );
    });

    it('reads the same update twice: each is new content in its region', () => {
      renderUI(<ToastQueue />);
      const id = show({ title: 'Publishing', status: 'loading' });
      act(() => updateToast(id, { title: 'Published', status: 'success' }));
      const first = screen.getByText('Success: Published');

      act(() => updateToast(id, { title: 'Publishing', status: 'loading' }));
      act(() => updateToast(id, { title: 'Published', status: 'success' }));
      expect(screen.getByText('Success: Published')).not.toBe(first);
    });

    it('an update that doesn’t change what’s read reads nothing', () => {
      renderUI(<ToastQueue />);
      const id = show({ title: 'Failed', status: 'error' });
      act(() => updateToast(id, { closable: false }));
      expect(useToastStore.getState().announcement).toBeUndefined();
    });
  });
});

describe('types', () => {
  it('a toast needs a title, and an action its altText', () => {
    const calls = [
      () => toast({ title: 'Saved' }),
      // @ts-expect-error A toast needs a title.
      () => toast({ description: 'Attendees see it.' }),
      // @ts-expect-error An action needs altText, for screen readers.
      () => toast({ title: 'Removed', action: { label: 'Undo' } }),
      // @ts-expect-error Statuses are success, error, warning, info and loading.
      () => toast({ title: 'Saved', status: 'danger' }),
    ];
    expect(calls).toHaveLength(4);
  });
});

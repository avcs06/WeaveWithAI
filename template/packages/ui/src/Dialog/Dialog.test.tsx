import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react';

import { Button } from '../Button';
import { axe, renderUI } from '../test-utils';

import { dialogRecipe, glyphRecipe } from './Dialog.recipes.css';

import {
  Dialog,
  DialogResult,
  openConfirmationDialog,
  type ConfirmationDialogOptions,
  type DialogProps,
} from '.';

const sizes = dialogRecipe.classNames.variants.size;
const statuses = glyphRecipe.classNames.variants.status;

const dialog = (name: string) => screen.getByRole('dialog', { name });
const button = (name: string) => screen.getByRole('button', { name });

// Radix listens for a press outside from the tick after the dialog opens.
const pressOutside = async () => {
  await act(() => new Promise((resolve) => setTimeout(resolve)));
  const overlay = document.querySelector<HTMLElement>('[data-slot="overlay"]');
  if (overlay) await userEvent.click(overlay);
};

const EditSession = (props: Partial<DialogProps>) => (
  <Dialog
    title="Edit session"
    description="Attendees see the change at once."
    trigger={<Button>Edit</Button>}
    footer={(close) => <Button onClick={close}>Done</Button>}
    {...props}
  >
    Opening keynote, Hall A.
  </Dialog>
);

describe('Dialog', () => {
  it('opens from its trigger, named by its title and described by its description', async () => {
    renderUI(<EditSession />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button('Edit')).toHaveAttribute('aria-haspopup', 'dialog');

    await userEvent.click(button('Edit'));
    const edit = dialog('Edit session');
    expect(edit).toHaveAccessibleDescription(
      'Attendees see the change at once.',
    );
    expect(edit).toHaveTextContent('Opening keynote, Hall A.');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('without a description, nothing describes it', async () => {
    renderUI(<EditSession description={undefined} />);
    await userEvent.click(button('Edit'));
    expect(dialog('Edit session')).not.toHaveAttribute('aria-describedby');
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('closes by its close button, Escape, a press outside and the footer’s close, returning focus to the trigger', async () => {
    renderUI(<EditSession />);
    const open = () => userEvent.click(button('Edit'));

    await open();
    await userEvent.click(button('Close'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button('Edit')).toHaveFocus();

    await open();
    // The first Escape closes the focused close button's tooltip, if shown.
    await userEvent.keyboard('{Escape}{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();

    await open();
    await pressOutside();
    expect(screen.queryByRole('dialog')).toBeNull();

    await open();
    await userEvent.click(button('Done'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(button('Edit')).toHaveFocus();
  });

  it('returns focus to what opened it when that isn’t its trigger', async () => {
    const Opener = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Invite</button>
          <Dialog
            title="Invite a speaker"
            open={open}
            onOpenChange={setOpen}
            footer={(close) => <Button onClick={close}>Cancel</Button>}
          />
        </>
      );
    };
    renderUI(<Opener />);
    await userEvent.click(button('Invite'));
    await userEvent.click(button('Cancel'));
    await waitFor(() => expect(button('Invite')).toHaveFocus());
  });

  it('names its body by the title, for when it scrolls and takes focus', async () => {
    renderUI(<EditSession />);
    await userEvent.click(button('Edit'));
    expect(
      screen.getByRole('region', { name: 'Edit session' }),
    ).toHaveTextContent('Opening keynote, Hall A.');
  });

  it('draws title icons as decoration; an add-on joins the dialog’s name, not the body’s', async () => {
    renderUI(
      <EditSession
        leftIcon={<svg data-testid="pencil" />}
        rightAddOn={<span>Draft</span>}
      />,
    );
    await userEvent.click(button('Edit'));
    expect(
      screen.getByTestId('pencil').closest('[data-slot="icon"]'),
    ).toHaveAttribute('aria-hidden', 'true');
    expect(dialog('Edit session Draft')).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Edit session' }),
    ).toBeInTheDocument();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it('a header action sits in the header, outside the dialog’s name', async () => {
    const onInvite = jest.fn();
    renderUI(
      <EditSession headerAction={<Button onClick={onInvite}>Invite</Button>} />,
    );
    await userEvent.click(button('Edit'));
    const header = dialog('Edit session').querySelector('[data-slot="header"]');
    expect(header).toContainElement(button('Invite'));
    await userEvent.click(button('Invite'));
    expect(onInvite).toHaveBeenCalledTimes(1);
    expect(dialog('Edit session')).toBeInTheDocument();
  });

  it('opens with focus on the body’s first control, else on the dialog', async () => {
    renderUI(
      <Dialog title="Move session" trigger={<Button>Move</Button>}>
        <button>Change hall</button>
      </Dialog>,
    );
    await userEvent.click(button('Move'));
    expect(button('Change hall')).toHaveFocus();
    await userEvent.keyboard('{Escape}');

    renderUI(<EditSession />);
    await userEvent.click(button('Edit'));
    expect(dialog('Edit session')).toHaveFocus();
  });

  it('keeps focus inside while open', async () => {
    renderUI(
      <>
        <EditSession />
        <button>After</button>
      </>,
    );
    await userEvent.click(button('Edit'));
    for (let press = 0; press < 4; press += 1) {
      await userEvent.tab();
      expect(dialog('Edit session')).toContainElement(
        document.activeElement as HTMLElement,
      );
    }
  });

  it('closable false: no close button, and only the footer closes it', async () => {
    renderUI(<EditSession closable={false} />);
    await userEvent.click(button('Edit'));
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();

    await userEvent.keyboard('{Escape}');
    await pressOutside();
    expect(dialog('Edit session')).toBeInTheDocument();

    await userEvent.click(button('Done'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('the footer takes nodes as well as a function given close', async () => {
    renderUI(
      <EditSession
        footer={<Button variant="base">Preview</Button>}
        trigger={<Button>Edit</Button>}
      />,
    );
    await userEvent.click(button('Edit'));
    await userEvent.click(button('Preview'));
    expect(dialog('Edit session')).toBeInTheDocument();
  });

  it('leaves out the body and the footer it isn’t given', async () => {
    renderUI(<Dialog title="Title only" trigger={<Button>Open</Button>} />);
    await userEvent.click(button('Open'));
    const titleOnly = dialog('Title only');
    expect(titleOnly.querySelector('[data-slot="body"]')).toBeNull();
    expect(titleOnly.querySelector('[data-slot="footer"]')).toBeNull();
  });

  it('applies its size, defaulting to md', async () => {
    renderUI(
      <>
        <Dialog title="Default" defaultOpen>
          Body
        </Dialog>
        <Dialog title="Small" size="sm" defaultOpen>
          Body
        </Dialog>
        <Dialog title="Large" size="lg" defaultOpen>
          Body
        </Dialog>
      </>,
    );
    // Each modal hides the others from the accessibility tree: found by text.
    const surface = (title: string) =>
      screen.getByText(title).closest('[role="dialog"]');
    expect(surface('Default')).toHaveClass(sizes.md);
    expect(surface('Small')).toHaveClass(sizes.sm);
    expect(surface('Large')).toHaveClass(sizes.lg);
  });

  describe('controlled and uncontrolled', () => {
    it('defaultOpen opens it at first, then it keeps its own state', async () => {
      renderUI(<EditSession defaultOpen />);
      expect(dialog('Edit session')).toBeInTheDocument();
      await userEvent.click(button('Done'));
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('controlled, open follows the parent, and onOpenChange reports every close', async () => {
      const onOpenChange = jest.fn();
      const Controlled = () => {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button onClick={() => setOpen(true)}>Invite</button>
            <Dialog
              title="Invite a speaker"
              open={open}
              onOpenChange={(next) => {
                onOpenChange(next);
                setOpen(next);
              }}
              footer={(close) => <Button onClick={close}>Cancel</Button>}
            />
          </>
        );
      };
      renderUI(<Controlled />);
      await userEvent.click(button('Invite'));
      expect(dialog('Invite a speaker')).toBeInTheDocument();

      await userEvent.click(button('Cancel'));
      await userEvent.click(button('Invite'));
      await userEvent.click(button('Close'));
      expect(onOpenChange.mock.calls).toEqual([[false], [false]]);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('controlled without onOpenChange, it stays open', async () => {
      renderUI(
        <Dialog title="Pinned" open>
          Body
        </Dialog>,
      );
      await userEvent.click(button('Close'));
      expect(dialog('Pinned')).toBeInTheDocument();
    });
  });
});

const keepOrDelete = (closeDialog: (result?: DialogResult) => void) => (
  <>
    <Button variant="base" onClick={() => closeDialog(DialogResult.cancel)}>
      Keep
    </Button>
    <Button onClick={() => closeDialog(DialogResult.confirm)}>Delete</Button>
  </>
);

const ask = (options: Partial<ConfirmationDialogOptions> = {}) => {
  let result!: Promise<DialogResult | undefined>;
  act(() => {
    result = openConfirmationDialog({
      title: 'Delete this session?',
      content: 'Its attendees lose their seats.',
      footer: keepOrDelete,
      ...options,
    });
  });
  return result;
};

describe('openConfirmationDialog', () => {
  it('asks in an alertdialog, named and described, and resolves with the pressed button’s result', async () => {
    const result = ask({ status: 'error' });
    const alert = await screen.findByRole('alertdialog', {
      name: 'Delete this session?',
    });
    expect(alert).toHaveAccessibleDescription(
      'Its attendees lose their seats.',
    );
    expect(await axe(document.body)).toHaveNoViolations();

    await userEvent.click(button('Delete'));
    await expect(result).resolves.toBe(DialogResult.confirm);
    await waitFor(() => expect(document.body).toBeEmptyDOMElement());
  });

  it('shares the page’s tooltip, so only one shows', async () => {
    renderUI(<Button tooltip="Sends it to everyone">Publish</Button>);
    await userEvent.hover(button('Publish'));
    await screen.findByRole('tooltip', { hidden: true });

    const result = ask({
      footer: (closeDialog) => (
        <Button
          tooltip="Removes it for good"
          onClick={() => closeDialog(DialogResult.confirm)}
        >
          Delete
        </Button>
      ),
    });
    await userEvent.hover(
      await screen.findByRole('button', { name: 'Delete' }),
    );
    const tooltips = screen.getAllByRole('tooltip', { hidden: true });
    expect(tooltips).toHaveLength(1);
    expect(tooltips[0]).toHaveTextContent('Removes it for good');

    await userEvent.click(button('Delete'));
    await result;
  });

  it('resolves cancel from the other button', async () => {
    const result = ask();
    await userEvent.click(await screen.findByRole('button', { name: 'Keep' }));
    await expect(result).resolves.toBe(DialogResult.cancel);
  });

  it('only the footer closes it: Escape and a press outside do nothing', async () => {
    const result = ask();
    await screen.findByRole('alertdialog');
    await userEvent.keyboard('{Escape}');
    await pressOutside();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await userEvent.click(button('Keep'));
    await expect(result).resolves.toBe(DialogResult.cancel);
  });

  it('only the first close counts', async () => {
    const result = ask({
      footer: (closeDialog) => (
        <Button
          onClick={() => {
            closeDialog(DialogResult.cancel);
            closeDialog(DialogResult.confirm);
          }}
        >
          Keep
        </Button>
      ),
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Keep' }));
    await expect(result).resolves.toBe(DialogResult.cancel);
  });

  it('a close without a result resolves undefined', async () => {
    const result = ask({
      footer: (closeDialog) => (
        <Button onClick={() => closeDialog()}>Dismiss</Button>
      ),
    });
    await userEvent.click(
      await screen.findByRole('button', { name: 'Dismiss' }),
    );
    await expect(result).resolves.toBeUndefined();
  });

  it('without content, nothing describes it', async () => {
    const result = ask({ content: undefined });
    const alert = await screen.findByRole('alertdialog');
    expect(alert).not.toHaveAttribute('aria-describedby');
    await userEvent.click(button('Keep'));
    await result;
  });

  it('shows its status in the glyph, defaulting to warning', async () => {
    for (const status of [undefined, 'error', 'info'] as const) {
      const result = ask({ status });
      const alert = await screen.findByRole('alertdialog');
      expect(alert.querySelector('[data-slot="glyph"]')).toHaveClass(
        statuses[status ?? 'warning'],
      );
      await userEvent.click(button('Keep'));
      await result;
      await waitFor(() => expect(document.body).toBeEmptyDOMElement());
    }
  });

  it('renders in a portal by default, or in its own element with portalled false', async () => {
    for (const portalled of [true, false]) {
      const result = ask({ portalled });
      const alert = await screen.findByRole('alertdialog');
      if (portalled) expect(alert.parentElement).toBe(document.body);
      else expect(alert.parentElement?.parentElement).toBe(document.body);
      await userEvent.click(button('Keep'));
      await result;
      await waitFor(() => expect(document.body).toBeEmptyDOMElement());
    }
  });

  it('returns focus to what had it before', async () => {
    renderUI(<button>Delete session</button>);
    act(() => button('Delete session').focus());
    const result = ask();
    await userEvent.click(await screen.findByRole('button', { name: 'Keep' }));
    await result;
    await waitFor(() => expect(button('Delete session')).toHaveFocus());
  });

  it('resolves undefined when it fails to render, and removes itself', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const Broken = () => {
      throw new Error('Failed to render');
    };
    const result = ask({ footer: () => <Broken /> });
    await expect(result).resolves.toBeUndefined();
    await waitFor(() => expect(document.body).toBeEmptyDOMElement());
    consoleError.mockRestore();
  });
});

describe('types', () => {
  it('a dialog needs a title; a confirmation needs a footer, and results are DialogResult', () => {
    const elements = [
      <Dialog title="Edit session" />,
      <Dialog
        title="Edit session"
        footer={(close) => <Button onClick={close}>Done</Button>}
      />,
      // @ts-expect-error A dialog is named by its title.
      <Dialog description="Shown to attendees" />,
      // @ts-expect-error Sizes are sm, md and lg.
      <Dialog title="Edit session" size="xl" />,
    ];
    const calls = [
      () =>
        openConfirmationDialog({
          title: 'Delete?',
          footer: (closeDialog) => (
            <Button onClick={() => closeDialog(DialogResult.confirm)}>
              Delete
            </Button>
          ),
        }),
      // @ts-expect-error A confirmation needs a footer to close it.
      () => openConfirmationDialog({ title: 'Delete?' }),
      () =>
        openConfirmationDialog({
          title: 'Delete?',
          footer: (closeDialog) => (
            <Button
              // @ts-expect-error A result is cancel or confirm.
              onClick={() => closeDialog('maybe')}
            >
              Maybe
            </Button>
          ),
        }),
    ];
    expect(elements).toHaveLength(4);
    expect(calls).toHaveLength(3);
  });
});

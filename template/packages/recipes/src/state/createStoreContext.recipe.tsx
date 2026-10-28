/**
 * createStoreContext: a store for each instance of a component, shared by
 * the parts inside it. Returns `[useStore, useStoreContext, StoreProvider]`:
 * `useStore` subscribes like a createStore hook, `useStoreContext()` gives
 * `{ store, useStore }` for reading and writing without subscribing.
 * For a component whose parts read and update the same state, when a page
 * can show several of it: a wizard, an editor, a table. Each provider makes
 * its own store.
 *
 * Not for: state one component owns (useState), a value that is only passed
 * down (createContext), or state shared across the whole app (createStore).
 *
 * Pitfalls:
 * - The hooks throw outside their provider.
 * - The store is made once per provider mount, from the props of its first
 *   render: later prop changes don't reach it. A new `key` on the provider
 *   starts a new store: how to reset it or start it from new props.
 * - Subscribe to the fields a part renders. A handler that needs the state
 *   when it runs reads it with `store`, so the part doesn't re-render on
 *   every change.
 */
import { Button } from '@packages/ui/Button';
import { createStore, createStoreContext } from '@packages/utils/state';
import React, { useState } from 'react';

// Usage: the patterns to copy.
type Wizard = {
  step: number;
  lastStep: number;
  attendees: string[];
  next: () => void;
  back: () => void;
  addAttendee: (name: string) => void;
};

const [useWizard, useWizardContext, WizardProvider] = createStoreContext(
  ({ attendees = [] }: { attendees?: string[] }) =>
    createStore<Wizard>((set) => ({
      step: 1,
      lastStep: 3,
      attendees,
      next: () =>
        set(({ step, lastStep }) => ({ step: Math.min(step + 1, lastStep) })),
      back: () => set(({ step }) => ({ step: Math.max(step - 1, 1) })),
      addAttendee: (name) =>
        set(({ attendees }) => ({ attendees: [...attendees, name] })),
    })),
);

/** Each part subscribes to its own instance's fields. */
const StepLabel = () => (
  <p role="status">
    Step {useWizard('step')} of {useWizard('lastStep')}
  </p>
);

/** The buttons follow the step; the limits live in the store's actions. */
const WizardActions = () => {
  const step = useWizard('step');
  const lastStep = useWizard('lastStep');
  const next = useWizard('next');
  const back = useWizard('back');

  return (
    <div className="flex-row-gap-2">
      <Button
        variant="base"
        {...(step === 1
          ? { disabledWithReason: 'This is the first step' }
          : {})}
        onClick={back}
      >
        Back
      </Button>
      <Button
        {...(step === lastStep
          ? { disabledWithReason: 'This is the last step' }
          : {})}
        onClick={next}
      >
        Next
      </Button>
    </div>
  );
};

/**
 * `store` reads the whole state in the handler, so this button never
 * re-renders as the wizard moves.
 */
const SaveDraft = () => {
  const { store } = useWizardContext();
  const [saved, setSaved] = useState('');

  return (
    <div className="flex-row-gap-2 items-center">
      <Button
        variant="base"
        onClick={() => {
          const { step, attendees } = store();
          setSaved(`Saved at step ${step} with ${attendees.length} attendees`);
        }}
      >
        Save draft
      </Button>
      <p role="status">{saved}</p>
    </div>
  );
};

const AddAttendee = () => {
  const addAttendee = useWizard('addAttendee');
  const count = useWizard(({ attendees }) => attendees.length);

  return (
    <Button variant="base" onClick={() => addAttendee(`Guest ${count + 1}`)}>
      Add attendee ({count})
    </Button>
  );
};

/**
 * The provider's props seed the store: here the attendees already chosen.
 * A new `key` makes a new store: Start over resets the whole wizard.
 */
const CheckoutWizard = ({ attendees }: { attendees?: string[] }) => {
  const [run, setRun] = useState(0);

  return (
    <WizardProvider key={run} attendees={attendees}>
      <div className="flex-col-gap-2 items-start">
        <StepLabel />
        <WizardActions />
        <AddAttendee />
        <SaveDraft />
        <Button variant="base" onClick={() => setRun(run + 1)}>
          Start over
        </Button>
      </div>
    </WizardProvider>
  );
};

// Two wizards, two stores: each keeps its own step.
export default function CreateStoreContextRecipe() {
  return (
    <div className="flex-col-gap-6">
      <CheckoutWizard />
      <CheckoutWizard attendees={['Ada Lovelace']} />
    </div>
  );
}

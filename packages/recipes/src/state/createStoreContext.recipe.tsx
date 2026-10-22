/**
 * createStoreContext: a store for each instance of a component, shared by
 * the parts inside it. For a component whose parts read and update the same
 * state, when a page can show several of it: a wizard, an editor, a table.
 * Each provider makes its own store.
 */
import { Button } from '@packages/ui/Button';
import { createStore, createStoreContext } from '@packages/utils/state';

const lastStep = 3;

type Wizard = { step: number; next: () => void; back: () => void };

const [useWizard, useWizardContext, WizardProvider] = createStoreContext(() =>
  createStore<Wizard>((set) => ({
    step: 1,
    next: () => set(({ step }) => ({ step: step + 1 })),
    back: () => set(({ step }) => ({ step: step - 1 })),
  })),
);

/** Each part subscribes to its own instance's fields. */
const StepLabel = () => (
  <p>
    Step {useWizard('step')} of {lastStep}
  </p>
);

/** In a handler, `store` reads this instance without subscribing to it. */
const WizardActions = () => {
  const { store } = useWizardContext();
  const step = useWizard('step');

  return (
    <div className="flex-row-gap-2">
      <Button
        variant="base"
        disabledWithReason={step === 1 ? 'This is the first step' : undefined}
        onClick={() => store().back()}
      >
        Back
      </Button>
      <Button
        onClick={() => {
          if (store('step') < lastStep) store('next')(); // or store().next();
        }}
      >
        Next
      </Button>
    </div>
  );
};

const CheckoutWizard = () => (
  <WizardProvider>
    <div className="flex-col-gap-2">
      <StepLabel />
      <WizardActions />
    </div>
  </WizardProvider>
);

// Two wizards, two stores: each keeps its own step.
export default function CreateStoreContextRecipe() {
  return (
    <div className="flex-col-gap-6">
      <CheckoutWizard />
      <CheckoutWizard />
    </div>
  );
}

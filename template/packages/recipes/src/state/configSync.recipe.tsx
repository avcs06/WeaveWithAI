/**
 * configSync: components that only collect config. They render nothing: they
 * write their props into the store of the component they configure (the
 * owner), which renders from it. For authoring a reusable component with a
 * declarative API, like `<Tour><TourStep … /></Tour>`, so the owner gets its
 * children's settings without reading React children. Pick the hook by what
 * the config is:
 * - `useConfigSync(key, config)`: settings the owner only reads. They return
 *   to their initial values on unmount.
 * - `useValueSync(value, defaultValue, apply)`: a value the owner also
 *   changes, controlled or not.
 * - `useStoreSync(write, deps?)`: any other write, like registering an item
 *   with an action. Undo it on unmount yourself. Without `deps` it writes
 *   after every render: for elements, which are new on every render anyway.
 *
 * Not for: a page using a component, where config is props or data (a
 * `steps` array and a `step` prop); this is for a component whose users write
 * children. Not for state the children also render (createContext).
 *
 * Pitfalls:
 * - Items list in mount order, so one that mounts later, like a conditional
 *   step, lands last: see configOrder.
 * - The values of a `useConfigSync` config are its deps: pass callbacks
 *   through `usePersistentCallback`, and memoize objects and arrays.
 * - `useStoreSync` without `deps` in a component that subscribes to what it
 *   writes loops: each write re-renders it, which writes again.
 * - A controlled `value` that turns `undefined` applies nothing: the owner
 *   keeps the last value.
 * - `apply` and `write` get `initial`, true for the first write: it tells a
 *   starting value from a later change.
 * - Make the owner's store with `serverSnapshot: 'current'`, so server render
 *   and hydration read what the config components wrote.
 * - Config components must sit inside the owner's `ConfigSyncProvider`;
 *   `useConfigSyncContext()` gives `{ store, mounted }` to write a hook of
 *   your own.
 */
import { Button } from '@packages/ui/Button';
import { usePersistentCallback } from '@packages/utils/hooks';
import {
  type ApplyValue,
  ConfigSyncProvider,
  createStore,
  createStoreContext,
  useConfigSync,
  useStoreSync,
  useValueSync,
} from '@packages/utils/state';
import React, {
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

// Usage: the patterns to copy.
type Step = { id: string; title: string; content: ReactNode };

type TourStore = {
  steps: Step[];
  setStep: (step: Step) => void;
  removeStep: (id: string) => void;
  current: string;
  positionConfig: { controlled: boolean; onChange?: (id: string) => void };
  applyCurrent: ApplyValue<string>;
  goTo: (id: string) => void;
};

/** The owner keeps a store per instance, which its config components write. */
const [useTour, useTourContext, TourProvider] = createStoreContext(() =>
  createStore<TourStore>(
    (set, get) => ({
      steps: [],
      // A step that changes keeps its place in the list.
      setStep: (step) =>
        set(({ steps }) => ({
          steps: steps.some(({ id }) => id === step.id)
            ? steps.map((entry) => (entry.id === step.id ? step : entry))
            : [...steps, step],
        })),
      removeStep: (id) =>
        set(({ steps }) => ({ steps: steps.filter((step) => step.id !== id) })),
      current: '',
      positionConfig: { controlled: false },
      applyCurrent: (id) => set({ current: id }),
      // Controlled, the new step waits for the parent to pass it back.
      goTo: (id) => {
        const { positionConfig } = get();

        if (!positionConfig.controlled) set({ current: id });
        positionConfig.onChange?.(id);
      },
    }),
    { serverSnapshot: 'current' },
  ),
);

/**
 * `useStoreSync`: any write, here an action registering a step. Its content
 * is an element, new every render, so no deps: it writes after every render.
 */
const TourStep = ({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) => {
  const { store } = useTourContext();

  useStoreSync(() => store('setStep')({ id, title, content: children }));
  useLayoutEffect(() => () => store('removeStep')(id), [store, id]);

  return null;
};

type TourPositionProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
};

/**
 * `useValueSync`: the step shown, which the owner also changes. `value` is
 * applied on every change; without it, `defaultValue` is applied once.
 * `useConfigSync`: how the owner reports a change.
 */
const TourPosition = ({ value, defaultValue, onChange }: TourPositionProps) => {
  const { store } = useTourContext();
  const stableOnChange = usePersistentCallback(onChange);

  useConfigSync('positionConfig', {
    controlled: value !== undefined,
    onChange: stableOnChange,
  });
  useValueSync(value, defaultValue, store('applyCurrent'));

  return null;
};

/** The owner renders from its store: the step, and the controls to move. */
const TourView = ({ label }: { label: string }) => {
  const steps = useTour('steps');
  const current = useTour('current');
  const goTo = useTour('goTo');
  const title = useRef<HTMLHeadingElement>(null);

  const found = steps.findIndex(({ id }) => id === current);
  const index = Math.max(found, 0);
  const step = steps[index];
  const previous = steps[index - 1];
  const next = steps[index + 1];

  const move = (target: Step) => {
    goTo(target.id);
    title.current?.focus();
  };

  if (!step) return null;

  return (
    // A named landmark: the tour's step heading takes focus on each move.
    <div
      role="region"
      aria-label={label}
      className="flex-col-gap-2 items-start"
    >
      <p role="status">
        Step {index + 1} of {steps.length}
      </p>
      <h3 ref={title} tabIndex={-1}>
        {step.title}
      </h3>
      <div>{step.content}</div>
      <div className="flex-row-gap-2">
        <Button
          variant="base"
          {...(previous
            ? {}
            : { disabledWithReason: 'This is the first step' })}
          onClick={() => previous && move(previous)}
        >
          Back
        </Button>
        <Button
          {...(next ? {} : { disabledWithReason: 'This is the last step' })}
          onClick={() => next && move(next)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

/**
 * Config components go before the content: while the owner mounts they write
 * during render, so the content's first render reads their values.
 */
const TourContent = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => {
  const { useStore } = useTourContext();
  return (
    <ConfigSyncProvider useStore={useStore}>
      {children}
      <TourView label={label} />
    </ConfigSyncProvider>
  );
};

const Tour = ({ label, children }: { label: string; children: ReactNode }) => (
  <TourProvider>
    <TourContent label={label}>{children}</TourContent>
  </TourProvider>
);

/** Uncontrolled: starts from `defaultValue`, then the tour keeps the step. */
const VenueTour = () => (
  <Tour label="Venue tour">
    <TourStep id="doors" title="Doors">
      Doors open at 18:00.
    </TourStep>
    <TourStep id="hall" title="Main hall">
      The hall seats 400.
    </TourStep>
    <TourPosition defaultValue="hall" />
  </Tour>
);

/** Controlled: the step lives in the parent, which `onChange` tells. */
const OrganizerTour = () => {
  const [step, setStep] = useState('doors');
  return (
    <div className="flex-col-gap-2">
      <Tour label="Organizer tour">
        <TourStep id="doors" title="Doors">
          Check the guest list at the doors.
        </TourStep>
        <TourStep id="hall" title="Main hall">
          Brief the stage crew.
        </TourStep>
        <TourPosition value={step} onChange={setStep} />
      </Tour>
      <Button variant="base" onClick={() => setStep('doors')}>
        Restart tour
      </Button>
    </div>
  );
};

export default function ConfigSyncRecipe() {
  return (
    <div className="flex-col-gap-6">
      <VenueTour />
      <OrganizerTour />
    </div>
  );
}

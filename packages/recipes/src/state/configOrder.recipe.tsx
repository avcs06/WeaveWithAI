/**
 * configOrder: keeps config components in the order they render. Config
 * components (see configSync) register as they mount, so one that appears
 * later, like a step shown for one event type, would land last. Put
 * `ConfigOrderProvider` inside the owner's `ConfigSyncProvider`, with
 * `onOrder` writing the ids to the owner's store, and call
 * `useConfigOrder(id)` in each config component.
 *
 * Not for: config that doesn't depend on order, or a list rendered from data
 * (sort the data).
 *
 * Pitfalls:
 * - `useConfigOrder` throws outside a `ConfigOrderProvider`.
 * - The content that reads the order renders after `ConfigOrderProvider`,
 *   not inside it: while the owner mounts, the order is written once every
 *   config component has rendered.
 * - `id` is the config component's own key, and must be unique among them.
 * - The ids set the order, not which items exist: the owner still lists the
 *   items its config components registered.
 */
import { Select, SelectOption } from '@packages/ui/Select';
import {
  ConfigOrderProvider,
  ConfigSyncProvider,
  createStore,
  createStoreContext,
  useConfigOrder,
  useStoreSync,
} from '@packages/utils/state';
import React, { type ReactNode, useLayoutEffect, useState } from 'react';

// Usage: the patterns to copy.
type Step = { id: string; title: string };

type StepsStore = {
  steps: Step[];
  order: string[];
  setStep: (step: Step) => void;
  removeStep: (id: string) => void;
  setOrder: (order: string[]) => void;
};

const [useSteps, useStepsContext, StepsProvider] = createStoreContext(() =>
  createStore<StepsStore>(
    (set) => ({
      steps: [],
      order: [],
      setStep: (step) =>
        set(({ steps }) => ({
          steps: steps.some(({ id }) => id === step.id)
            ? steps.map((entry) => (entry.id === step.id ? step : entry))
            : [...steps, step],
        })),
      removeStep: (id) =>
        set(({ steps }) => ({ steps: steps.filter((step) => step.id !== id) })),
      setOrder: (order) => set({ order }),
    }),
    { serverSnapshot: 'current' },
  ),
);

/** Registers a step and places it by where it renders. */
const SetupStep = ({ id, title }: Step) => {
  const { store } = useStepsContext();

  useConfigOrder(id);
  useStoreSync(() => store('setStep')({ id, title }), [id, title]);
  useLayoutEffect(() => () => store('removeStep')(id), [store, id]);

  return null;
};

const StepList = () => {
  const steps = useSteps('steps');
  const order = useSteps('order');

  const sorted = [...steps].sort(
    (a, b) => order.indexOf(a.id) - order.indexOf(b.id),
  );

  return (
    <ol aria-label="Setup steps">
      {sorted.map(({ id, title }) => (
        <li key={id}>{title}</li>
      ))}
    </ol>
  );
};

const SetupContent = ({ children }: { children: ReactNode }) => {
  const { store, useStore } = useStepsContext();
  return (
    <ConfigSyncProvider useStore={useStore}>
      <ConfigOrderProvider onOrder={store('setOrder')}>
        {children}
      </ConfigOrderProvider>
      <StepList />
    </ConfigSyncProvider>
  );
};

const EventSetup = ({ children }: { children: ReactNode }) => (
  <StepsProvider>
    <SetupContent>{children}</SetupContent>
  </StepsProvider>
);

type EventType = 'meetup' | 'conference';

/**
 * Steps shown by a condition: a conference gets "Invite speakers" between
 * the other two, and it stays there because the order follows rendering.
 */
export default function ConfigOrderRecipe() {
  const [type, setType] = useState<EventType>('meetup');

  return (
    <div className="flex-col-gap-4 items-start">
      <Select
        label="Event type"
        allowSearch={false}
        allowClear={false}
        value={type}
        onChange={(next) => next && setType(next as EventType)}
      >
        <SelectOption value="meetup" label="Meetup" />
        <SelectOption value="conference" label="Conference" />
      </Select>
      <EventSetup>
        <SetupStep id="details" title="Event details" />
        {type === 'conference' && (
          <SetupStep id="speakers" title="Invite speakers" />
        )}
        <SetupStep id="tickets" title="Ticket types" />
      </EventSetup>
    </div>
  );
}

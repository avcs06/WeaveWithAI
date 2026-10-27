/**
 * createStore: one shared store with its actions, outside the component
 * tree. A store hook subscribes by key (`useCart('items')`) or by selector
 * (`useCart(({ items }) => items.length)`), and is also the store's own API:
 * `getState`, `setState` and `subscribe` work anywhere, outside React too.
 * For state many unrelated components read or change, or that code outside
 * React must reach: a cart, the signed-in user, preferences. Keep the
 * actions in the store, and each component subscribes to what it renders.
 *
 * Not for: values a parent passes down a few levels (createContext), state
 * that belongs to one instance of a component, when a page can show several
 * (createStoreContext), or state one component owns (useState). Server data
 * belongs to the data layer, not a store.
 *
 * Pitfalls:
 * - A selector may return a primitive, an existing object of the state, or
 *   an array or object of fields: results compare shallowly. A selector that
 *   builds new objects, like `items.map((item) => ({ ...item }))`, returns a
 *   new value on every read and loops ("Maximum update depth exceeded"):
 *   select the ids, and let each child select its own item.
 * - On the server a module-level store is shared by every request: never
 *   write to it while rendering, and leave `serverSnapshot` at `'initial'`.
 *   `'current'` is for stores made per instance (createStoreContext), see
 *   configSync.
 * - A persisted store renders its initial state on the server and during
 *   hydration, then switches to the saved one: the value flashes. Accept
 *   that for a small label, or render it only after mount.
 * - `persist` needs `keys` (or `partialize`) when the state holds actions or
 *   data that shouldn't be saved. Raise `version` and give `migrate` when
 *   the saved shape changes, or old data loads as the new shape.
 * - `set({ [key]: value })` with a computed key doesn't typecheck against
 *   `T`: write one action per field.
 * - `setState` skips the actions: keep it for tests and tools, and write
 *   from the app through actions.
 */
import { Button } from '@packages/ui/Button';
import { Input } from '@packages/ui/Input';
import { Select, SelectOption } from '@packages/ui/Select';
import {
  createJSONStorage,
  createPersistentStore,
  createStore,
  utilifyStore,
} from '@packages/utils/state';
import React from 'react';

// Setup: stand-ins for your app's data and requests, not part of the pattern.
const tickets = [
  { id: 'general', name: 'General admission', price: 49 },
  { id: 'vip', name: 'VIP', price: 149 },
];

// Usage: the patterns to copy.
type Auth = {
  token: string | null;
  signIn: () => void;
  signOut: () => void;
};

/** The signed-in organizer: read by the API wrapper and the cart. */
const useAuth = createStore<Auth>((set) => ({
  token: null,
  signIn: () => set({ token: 'organizer-token' }),
  signOut: () => set({ token: null }),
}));

const auth = utilifyStore(useAuth);

/** Stands in for `fetch`: every request carries the signed-in token. */
const apiFetch = (path: string, body: unknown) => {
  const headers = { Authorization: `Bearer ${auth('token')}` };
  return new Promise<{ ok: boolean; path: string; headers: typeof headers }>(
    (resolve) => setTimeout(() => resolve({ ok: !!body, path, headers }), 600),
  );
};

type CartItem = { id: string; name: string; price: number; quantity: number };

type Cart = {
  items: CartItem[];
  status: 'idle' | 'paying' | 'paid' | 'failed';
  add: (item: Omit<CartItem, 'quantity'>) => void;
  clear: () => void;
  checkout: () => Promise<void>;
};

/** A workflow with its actions, shared by components and code outside React. */
const useCart = createStore<Cart>((set, get) => ({
  items: [],
  status: 'idle',
  add: (item) =>
    set(({ items }) => ({
      status: 'idle',
      items: items.some(({ id }) => id === item.id)
        ? items.map((entry) =>
            entry.id === item.id
              ? { ...entry, quantity: entry.quantity + 1 }
              : entry,
          )
        : [...items, { ...item, quantity: 1 }],
    })),
  clear: () => set({ items: [], status: 'idle' }),
  // `get` reads the state when the action runs, after any awaited work.
  checkout: async () => {
    const { items, status } = get();
    if (status === 'paying' || items.length === 0) return;

    set({ status: 'paying' });
    const response = await apiFetch('/orders', items);
    set(response.ok ? { items: [], status: 'paid' } : { status: 'failed' });
  },
}));

// Outside React, `subscribe` gets the state and the one before it.
useAuth.subscribe((state, previous) => {
  if (previous.token && !state.token) useCart.getState().clear();
});

/**
 * A selector that reduces to a primitive: the component re-renders only when
 * the total changes.
 */
const CartSummary = () => {
  const count = useCart(({ items }) =>
    items.reduce((sum, { quantity }) => sum + quantity, 0),
  );
  return <p role="status">{count} tickets in your cart</p>;
};

/** A line selects its own item, which keeps its reference until it changes. */
const CartLine = ({ id }: { id: string }) => {
  const item = useCart(({ items }) => items.find((entry) => entry.id === id));
  if (!item) return null;
  return (
    <li>
      {item.quantity} × {item.name}
    </li>
  );
};

/**
 * A list selects only the ids, so adding a ticket to an existing line
 * re-renders that line and not the list.
 */
const CartLines = () => {
  const ids = useCart(({ items }) => items.map(({ id }) => id));
  return (
    <ul>
      {ids.map((id) => (
        <CartLine key={id} id={id} />
      ))}
    </ul>
  );
};

/** An action by key never changes, so a component that only acts never re-renders. */
const AddTickets = () => {
  const add = useCart('add');
  return (
    <div className="flex-row-gap-2">
      {tickets.map(({ id, name, price }) => (
        <Button
          key={id}
          variant="base"
          onClick={() => add({ id, name, price })}
        >
          Add {name}
        </Button>
      ))}
    </div>
  );
};

/**
 * State and action together: the button follows `status`, and an empty cart
 * says why it can't check out.
 */
const CheckoutButton = () => {
  const status = useCart('status');
  const empty = useCart(({ items }) => items.length === 0);
  const checkout = useCart('checkout');

  return (
    <div className="flex-row-gap-2 items-center">
      <Button
        {...(empty
          ? { disabledWithReason: 'Add a ticket first' }
          : status === 'paying'
            ? { loadingWithReason: 'Placing your order' }
            : {})}
        onClick={checkout}
      >
        Check out
      </Button>
      <p role="status">
        {status === 'paid' && 'Order placed'}
        {status === 'failed' && 'The order failed: try again'}
      </p>
    </div>
  );
};

/** Signing out empties the cart through the subscription above. */
const AccountButton = () => {
  const signedIn = useAuth(({ token }) => token !== null);
  const signIn = useAuth('signIn');
  const signOut = useAuth('signOut');

  return (
    <Button variant="base" onClick={signedIn ? signOut : signIn}>
      {signedIn ? 'Sign out (empties the cart)' : 'Sign in'}
    </Button>
  );
};

type Currency = 'USD' | 'EUR';

type Preferences = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
};

/** Kept across visits: only the listed keys are saved. */
const usePreferences = createPersistentStore<Preferences>(
  (set) => ({ currency: 'USD', setCurrency: (currency) => set({ currency }) }),
  'preferences',
  ['currency'],
);

/** The saved currency shows after hydration: fine for a short label. */
const CurrencyChoice = () => {
  const currency = usePreferences('currency');
  const setCurrency = usePreferences('setCurrency');

  return (
    <Select
      label="Prices in"
      allowSearch={false}
      allowClear={false}
      value={currency}
      onChange={(next) => next && setCurrency(next as Currency)}
    >
      <SelectOption value="USD" label="US dollars" />
      <SelectOption value="EUR" label="Euros" />
    </Select>
  );
};

type ContactDraft = {
  name: string;
  email: string;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
};

/**
 * Every `persist` option: `keys` saves the fields and not the actions,
 * `storage` keeps it to this tab, and `version` with `migrate` reads what an
 * older release saved.
 */
const useContactDraft = createStore<ContactDraft>(
  (set) => ({
    name: '',
    email: '',
    setName: (name) => set({ name }),
    setEmail: (email) => set({ email }),
  }),
  {
    persist: {
      name: 'contact-draft',
      keys: ['name', 'email'],
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      // Version 0 saved one `fullName`.
      migrate: (saved) => {
        const { fullName, ...rest } = saved as Record<string, string>;
        return fullName ? { ...rest, name: fullName } : rest;
      },
    },
  },
);

/** Each field subscribes to its own value and action. */
const ContactDraftFields = () => {
  const name = useContactDraft('name');
  const email = useContactDraft('email');
  const setName = useContactDraft('setName');
  const setEmail = useContactDraft('setEmail');

  return (
    <div className="flex-col-gap-2">
      <Input label="Name" autoComplete="name" value={name} onChange={setName} />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
      />
    </div>
  );
};

export default function CreateStoreRecipe() {
  return (
    <div className="flex-col-gap-4 items-start">
      <AccountButton />
      <CartSummary />
      <CartLines />
      <AddTickets />
      <CheckoutButton />
      <CurrencyChoice />
      <ContactDraftFields />
    </div>
  );
}

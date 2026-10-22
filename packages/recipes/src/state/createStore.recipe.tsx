/**
 * createStore: one shared store with its actions, outside the component
 * tree. For anything between a simple context (createContext) and a store
 * per instance (createStoreContext), mainly to avoid drilling values down
 * many levels, to read or change them outside React, or to share them
 * between unrelated components. Examples: Auth, cart, preferences etc;
 * Keep the actions in the store; each component subscribes to what it
 * renders.
 */
import { Button } from '@packages/ui/Button';
import {
  createPersistentStore,
  createStore,
  utilifyStore,
} from '@packages/utils/state';

type CartItem = { id: string; name: string; quantity: number };

type Cart = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>) => void;
  clear: () => void;
};

/** A workflow with its actions, shared by components and code outside React. */
const useCart = createStore<Cart>((set) => ({
  items: [],
  add: (item) =>
    set(({ items }) => ({
      items: items.some(({ id }) => id === item.id)
        ? items.map((entry) =>
            entry.id === item.id
              ? { ...entry, quantity: entry.quantity + 1 }
              : entry,
          )
        : [...items, { ...item, quantity: 1 }],
    })),
  clear: () => set({ items: [] }),
}));

/**
 * A key subscribes to one field, a selector to what it derives: the
 * component re-renders only when that changes.
 */
const CartSummary = () => {
  const count = useCart(({ items }) =>
    items.reduce((sum, { quantity }) => sum + quantity, 0),
  );
  return <p>{count} tickets in your cart</p>;
};

/** An action never changes, so a component that only acts never re-renders. */
const AddTicket = () => {
  const add = useCart('add');
  return (
    <Button
      variant="base"
      onClick={() => add({ id: 'general', name: 'General admission' })}
    >
      Add a ticket
    </Button>
  );
};

/** Outside React, or in a handler that shouldn't subscribe: read, don't render. */
const cart = utilifyStore(useCart);

const checkout = () => {
  if (cart('items').length === 0) return;
  // Send the items to the order API here.
  cart('clear')(); // or cart().clear()
};

const Checkout = () => <Button onClick={checkout}>Check out</Button>;

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

const CurrencyChoice = () => {
  const currency = usePreferences('currency');
  const setCurrency = usePreferences('setCurrency');
  return (
    <Button
      variant="base"
      onClick={() => setCurrency(currency === 'USD' ? 'EUR' : 'USD')}
    >
      Prices in {currency}
    </Button>
  );
};

export default function CreateStoreRecipe() {
  return (
    <div className="flex-col-gap-4 items-start">
      <CartSummary />
      <div className="flex-row-gap-2">
        <AddTicket />
        <Checkout />
      </div>
      <CurrencyChoice />
    </div>
  );
}

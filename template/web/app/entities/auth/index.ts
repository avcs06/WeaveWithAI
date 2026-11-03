import { createPersistentStore } from '@packages/utils/state';
import { useSyncExternalStore } from 'react';

import { mockCall } from '../mock';

// Sign up and sign in take any email: there is no backend yet.

export type User = { email: string };

type AuthState = { user: User | null };

// The scaffold writes the run's key over this, so no two apps on one origin share a session.
const AUTH_KEY = 'weave:app:auth';

const useAuthStore = createPersistentStore<AuthState>(() => ({ user: null }), AUTH_KEY);

export async function signUp(email: string): Promise<User> {
  await mockCall('signUp');
  useAuthStore.setState({ user: { email } });
  return { email };
}

export async function signIn(email: string): Promise<User> {
  await mockCall('signIn');
  useAuthStore.setState({ user: { email } });
  return { email };
}

export function signOut(): void {
  useAuthStore.setState({ user: null });
}

const noSubscription = () => () => undefined;

/**
 * The signed-in user, null for a visitor, or undefined until the saved session is read: the server and the
 * first render after it cannot read the browser's storage, so a page waits instead of taking a member for a visitor.
 */
export function useCurrentUser(): User | null | undefined {
  const user = useAuthStore('user');
  const read = useSyncExternalStore(noSubscription, () => true, () => false);
  return read ? user : undefined;
}

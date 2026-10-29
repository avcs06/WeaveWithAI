/** build: the app does it. simulate: full UI, the effect is the placeholder. skip: out of scope with a placeholder in the scope. */
export type CapabilityMode = 'build' | 'simulate' | 'skip';
export type Capability = {
  id: string;
  mode: CapabilityMode;
  description: string;
  /** What the app does instead of the real effect; simulated capabilities only. */
  placeholder?: string;
};

export const CAPABILITIES: readonly Capability[] = [
  { id: 'accounts', mode: 'build', description: 'email and password sign up, sign in, sign out' },
  { id: 'userOwnedData', mode: 'build', description: 'each user sees their own records' },
  { id: 'crud', mode: 'build', description: 'list, view, create, edit, delete' },
  { id: 'search', mode: 'build', description: 'free-text search over lists' },
  { id: 'filterSort', mode: 'build', description: 'filters and sorting on lists' },
  { id: 'pagination', mode: 'build', description: 'pages of results' },
  { id: 'roles', mode: 'build', description: 'up to 2 roles' },
  { id: 'publicPages', mode: 'build', description: 'landing page, public read-only views' },
  { id: 'statusWorkflow', mode: 'build', description: 'statuses with allowed transitions' },
  { id: 'reorder', mode: 'build', description: 'manual ordering of items' },
  { id: 'tagsCategories', mode: 'build', description: 'tags and categories' },
  { id: 'datesDeadlines', mode: 'build', description: 'dates and deadlines' },
  { id: 'simpleCounts', mode: 'build', description: 'totals and counts' },
  { id: 'profileSettings', mode: 'build', description: 'profile and settings' },
  {
    id: 'payments',
    mode: 'simulate',
    description: 'payments',
    placeholder: 'a checkout form validates its fields and shows the payment as successful; nothing is charged',
  },
  {
    id: 'fileUploads',
    mode: 'simulate',
    description: 'images, attachments',
    placeholder: 'the file is validated and previewed, kept for the session; nothing is stored',
  },
  {
    id: 'emailSending',
    mode: 'simulate',
    description: 'notifications, password reset by email',
    placeholder: 'the website shows the email as sent; nothing is sent',
  },
  { id: 'realtime', mode: 'skip', description: 'live collaboration, chat' },
  { id: 'externalIntegrations', mode: 'skip', description: 'third-party APIs, OAuth logins' },
  { id: 'maps', mode: 'skip', description: 'geolocation' },
  { id: 'multiTenant', mode: 'skip', description: 'organizations, invitations' },
  { id: 'i18n', mode: 'skip', description: 'translations' },
] as const;

// z.enum needs a tuple type; the cast gives it one without hand-copying the ids.
export const CAPABILITY_IDS = CAPABILITIES.map((c) => c.id) as [string, ...string[]];

export const capability = (id: string): Capability | undefined => CAPABILITIES.find((c) => c.id === id);
const ofMode = (mode: CapabilityMode) => CAPABILITIES.filter((c) => c.mode === mode);
const describe = (c: Capability) => `${c.id} (${c.description})`;

export const buildList = () => ofMode('build').map(describe).join(', ');
export const simulatedList = () =>
  ofMode('simulate')
    .map((c) => `${c.id} (${c.description}): ${c.placeholder}`)
    .join('; ');
export const skippedList = () => ofMode('skip').map(describe).join(', ');

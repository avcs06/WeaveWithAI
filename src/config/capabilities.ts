export type Capability = { id: string; supported: boolean; description: string };

export const CAPABILITIES: readonly Capability[] = [
  { id: 'accounts', supported: true, description: 'email and password sign up, sign in, sign out' },
  { id: 'userOwnedData', supported: true, description: 'each user sees their own records' },
  { id: 'crud', supported: true, description: 'list, view, create, edit, delete' },
  { id: 'search', supported: true, description: 'free-text search over lists' },
  { id: 'filterSort', supported: true, description: 'filters and sorting on lists' },
  { id: 'pagination', supported: true, description: 'pages of results' },
  { id: 'roles', supported: true, description: 'up to 2 roles' },
  { id: 'publicPages', supported: true, description: 'landing page, public read-only views' },
  { id: 'statusWorkflow', supported: true, description: 'statuses with allowed transitions' },
  { id: 'reorder', supported: true, description: 'manual ordering of items' },
  { id: 'tagsCategories', supported: true, description: 'tags and categories' },
  { id: 'datesDeadlines', supported: true, description: 'dates and deadlines' },
  { id: 'simpleCounts', supported: true, description: 'totals and counts' },
  { id: 'profileSettings', supported: true, description: 'profile and settings' },
  { id: 'payments', supported: false, description: 'payments' },
  { id: 'fileUploads', supported: false, description: 'images, attachments' },
  { id: 'emailSending', supported: false, description: 'notifications, password reset by email' },
  { id: 'realtime', supported: false, description: 'live collaboration, chat' },
  { id: 'externalIntegrations', supported: false, description: 'third-party APIs, OAuth logins' },
  { id: 'maps', supported: false, description: 'geolocation' },
  { id: 'multiTenant', supported: false, description: 'organizations, invitations' },
  { id: 'i18n', supported: false, description: 'translations' },
] as const;

// z.enum needs a tuple type; the cast gives it one without hand-copying the ids.
export const CAPABILITY_IDS = CAPABILITIES.map((c) => c.id) as [string, ...string[]];

const describe = (c: Capability) => `${c.id} (${c.description})`;
export const supportedList = () => CAPABILITIES.filter((c) => c.supported).map(describe).join(', ');
export const unsupportedList = () => CAPABILITIES.filter((c) => !c.supported).map(describe).join(', ');

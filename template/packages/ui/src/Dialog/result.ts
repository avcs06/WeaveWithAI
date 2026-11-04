/** What a confirmation dialog resolves with: the result its pressed button sends. */
export const DialogResult = { cancel: 'cancel', confirm: 'confirm' } as const;

export type DialogResult = (typeof DialogResult)[keyof typeof DialogResult];

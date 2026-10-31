import type { Draft } from './runSpecStage';

/** A call's last output as the document a rerun starts from. */
export const draftOf = <T>(data: T, model: string): Draft<T> => ({
  data,
  raw: JSON.stringify(data),
  model,
});

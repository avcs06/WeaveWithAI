/** USD per 1M tokens (docs/README.md). */
export type Price = { input: number; cachedInput: number; output: number };

export const PRICES: Record<string, Price> = {
  'muse-spark-1.3': { input: 1.25, cachedInput: 0.15, output: 4.25 },
  'muse-wonder-1.0': { input: 4, cachedInput: 4, output: 20 },
  // Muse Spark Open as Baseten names it (same list price as the Meta API); the
  // -1026 id is the one the hackathon key may call.
  'meta-models/muse-spark-open': {
    input: 1.25,
    cachedInput: 0.15,
    output: 4.25,
  },
  'meta-models/muse-spark-open-1026': {
    input: 1.25,
    cachedInput: 0.15,
    output: 4.25,
  },
};

/** Token counts as the API reports them: `input` already includes the `cachedInput` tokens. */
export type Usage = {
  input: number;
  cachedInput: number;
  output: number;
};

/** False for a model missing from the table, whose calls cost 0 here. */
export const isPriced = (model: string): boolean => model in PRICES;

/** Cost of one call in USD; 0 for a model missing from the table. */
export function costUsd(model: string, usage: Usage): number {
  const price = PRICES[model];
  if (!price) return 0;
  const uncached = Math.max(0, usage.input - usage.cachedInput);
  const total =
    uncached * price.input +
    usage.cachedInput * price.cachedInput +
    usage.output * price.output;
  return total / 1_000_000;
}

/** USD per 1M tokens. */
export type Price = { input: number; cachedInput: number; output: number };

export const PRICES: Record<string, Price> = {
  'claude-sonnet-5-5': { input: 2, cachedInput: 0.2, output: 10 },
  'claude-opus-5-5': { input: 4, cachedInput: 0.2, output: 20 },
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

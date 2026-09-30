/** Indicative display-only FX rates (USD base). Not for settlement. */
export const FX_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AUD: 1.52,
  CAD: 1.37,
  CHF: 0.88,
  AED: 3.67,
  SAR: 3.75,
  INR: 83.5,
  CNY: 7.24,
  JPY: 150,
  SGD: 1.34,
};

export const CURRENCIES = Object.keys(FX_RATES);

export const CURRENCY_LABELS: Record<string, string> = {
  USD: 'US$ · USD',
  EUR: '€ · EUR',
  GBP: '£ · GBP',
  AUD: 'A$ · AUD',
  CAD: 'C$ · CAD',
  CHF: 'CHF',
  AED: 'AED · د.إ',
  SAR: 'SAR · ﷼',
  INR: '₹ · INR',
  CNY: '¥ · CNY',
  JPY: '¥ · JPY',
  SGD: 'S$ · SGD',
};

export function convertFromUsd(amountUsd: number, currency: string): number {
  const rate = FX_RATES[currency];
  if (!rate || rate === 1) return amountUsd;
  return amountUsd * rate;
}

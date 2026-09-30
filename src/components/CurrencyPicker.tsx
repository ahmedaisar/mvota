import { useApp } from '../store/AppContext';
import { CURRENCIES, CURRENCY_LABELS } from '../lib/fx';

/** Header display-currency picker (indicative FX — display only). */
export default function CurrencyPicker() {
  const { currency, setCurrency } = useApp();
  return (
    <select
      id="currency-picker"
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      aria-label="Display currency"
      className="rounded-full border border-sand-300 bg-white px-2.5 py-1.5 text-xs font-bold text-ink-700 outline-none hover:border-lagoon-500 focus:border-lagoon-500"
    >
      {CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {CURRENCY_LABELS[c] ?? c}
        </option>
      ))}
    </select>
  );
}

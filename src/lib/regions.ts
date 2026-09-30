import { ATOLLS } from '../data/resorts';

/**
 * Portal region strings arrive in Russian (occasionally mixed/latin) and mix
 * atoll names with individual island names. This maps them onto our canonical
 * atoll list for filtering, display, and map pins. Unknown strings fall back
 * to their original label with a null atoll.
 */

const REGION_TO_ATOLL: Record<string, string> = {
  // Atolls (Russian portal labels)
  'Северный Мале Атолл': 'north-male',
  'Северный Мале Aтолл': 'north-male',
  'Южный Мале Атолл': 'south-male',
  'Мале Атолл': 'north-male',
  'Мале город': 'north-male',
  'Каафу Атолл': 'north-male',
  'Баа Атолл': 'baa',
  'Раа Атолл': 'raa',
  'Лааму Атолл': 'laamu',
  'Расду Атолл': 'ari',
  'Алифу Атолл': 'alif-alif',
  'Северный Ари Атолл': 'ari',
  'Южный Ари Атолл': 'ari',
  'Алифу Даалу Атолл': 'alif-dhaal',
  'Гаафу Алифу Атолл': 'gaafu-alifu',
  'Хаа Даалу Атолл': 'haa-dhaalu',
  'Хаа Даалу Aтолл': 'haa-dhaalu',
  'Лавияни Атолл': 'lhaviyani',
  'Мииму Атолл': 'meemu',
  'Вааву Атолл': 'vaavu',
  'Фаафу Атолл': 'faafu',
  'Ноону Атолл': 'noonu',
  'Дхаалу Атолл': 'dhaalu',
  'Адду Атолл': 'addu',
  'Южный Гаафу Атолл': 'gaafu',
  'Гаафу Атолл': 'gaafu',
  // Islands (portal lists island-level regions)
  'Маафуши': 'south-male',
  'Фулиду': 'south-male',
  'Фулхадху': 'south-male',
  'Fulhadhoo': 'south-male',
  'Гурайдхоо': 'south-male',
  'Тулхадху': 'baa',
  'Малхос': 'baa',
  'Maalhos': 'baa',
  'Диффуши': 'north-male',
  'Dhiffushi': 'north-male',
  'Хулхумале': 'north-male',
  'Фелиду': 'vaavu',
  'Дангети': 'vaavu',
  'Филитхейо': 'laamu',
};

const REGION_LABELS: Record<string, string> = {
  'Северный Мале Атолл': 'North Malé Atoll',
  'Северный Мале Aтолл': 'North Malé Atoll',
  'Южный Мале Атолл': 'South Malé Atoll',
  'Южный  Мале Атолл': 'South Malé Atoll',
  'Мале Атолл': 'Malé Atoll',
  'Мале город': 'Malé City',
  'Каафу Атолл': 'Kaafu Atoll',
  'Баа Атолл': 'Baa Atoll',
  'Раа Атолл': 'Raa Atoll',
  'Лааму Атолл': 'Laamu Atoll',
  'Расду Атолл': 'Rasdhoo Atoll',
  'Алифу Атолл': 'Alif Alif Atoll',
  'Северный Ари Атолл': 'North Ari Atoll',
  'Южный Ари Атолл': 'South Ari Atoll',
  'Алифу Даалу Атолл': 'Alifu Dhaalu Atoll',
  'Гаафу Алифу Атолл': 'Gaafu Alifu Atoll',
  'Хаа Даалу Атолл': 'Haa Dhaalu Atoll',
  'Хаа Даалу Aтолл': 'Haa Dhaalu Atoll',
  'Лавияни Атолл': 'Lhaviyani Atoll',
  'Мииму Атолл': 'Meemu Atoll',
  'Вааву Атолл': 'Vaavu Atoll',
  'Фаафу Атолл': 'Faafu Atoll',
  'Ноону Атолл': 'Noonu Atoll',
  'Дхаалу Атолл': 'Dhaalu Atoll',
  'Адду Атолл': 'Addu Atoll',
  'Южный Гаафу Атолл': 'Gaafu Dhaalu Atoll',
  'Гаафу Атолл': 'Gaafu Atoll',
  'Маафуши': 'Maafushi',
  'Фулиду': 'Folidhoo',
  'Фулхадху': 'Fulhadhoo',
  'Fulhadhoo': 'Fulhadhoo',
  'Гурайдхоо': 'Guraidhoo',
  'Тулхадху': 'Thulhadhoo',
  'Малхос': 'Maalhos',
  'Maalhos': 'Maalhos',
  'Диффуши': 'Dhiffushi',
  'Dhiffushi': 'Dhiffushi',
  'Хулхумале': 'Hulhumalé',
  'Фелиду': 'Felidhoo',
  'Дангети': 'Dhanggethi',
  'Филитхейо': 'Filladhoo',
};

/** Collapse stray whitespace so "Южный  Мале Атолл" (double space) still matches. */
function normalize(region: string): string {
  return region.replace(/\s+/g, ' ').trim();
}

/** Canonical atoll id for a portal region string, or null when unknown. */
export function regionToAtollId(region: string): string | null {
  const key = normalize(region);
  return REGION_TO_ATOLL[key] ?? null;
}

/** English display label for a portal region string (falls back to original). */
export function regionLabel(region: string): string {
  const key = normalize(region);
  if (REGION_LABELS[key]) return REGION_LABELS[key];
  // Try whitespace-normalized dictionary lookups for labels too.
  for (const [dictKey, label] of Object.entries(REGION_LABELS)) {
    if (normalize(dictKey) === key) return label;
  }
  return region || '';
}

export function atollById(id: string) {
  return ATOLLS.find((a) => a.id === id) ?? null;
}

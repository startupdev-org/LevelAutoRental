/** Main office — used in footer, contact, and map links */
export const OFFICE_ADDRESS = 'Chișinău, Muncești 271 A';
export const OFFICE_GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent(`${OFFICE_ADDRESS}, Moldova`);

export const LANGUAGES = [
    {
        code: "ro",
        iconClass: "fi fi-ro w-5 h-5",
    },
    {
        code: "ru",
        iconClass: "fi fi-ru w-5 h-5",
    },
    {
        code: "en",
        iconClass: "fi fi-gb w-5 h-5",
    },
];


// Maps UI strings to database types
export const FUEL_TYPE_MAP = {
    'Benzina': 'petrol',
    'Diesel': 'diesel',
    'Electric': 'electric',
    'Hybrid': 'hybrid',
} as const;

export type FuelTypeUI = keyof typeof FUEL_TYPE_MAP | 'Any'; // UI values
export type FuelTypeDB = typeof FUEL_TYPE_MAP[keyof typeof FUEL_TYPE_MAP]; // DB/API types

export const COUNTRY_CODES = [
    { code: '+373', flag: '🇲🇩', country: 'Moldova' },
    { code: '+40', flag: '🇷🇴', country: 'Romania' },
    { code: '+380', flag: '🇺🇦', country: 'Ukraine' },
    { code: '+7', flag: '🇷🇺', country: 'Russia' },
    { code: '+1', flag: '🇺🇸', country: 'USA' },
    { code: '+44', flag: '🇬🇧', country: 'UK' },
    { code: '+49', flag: '🇩🇪', country: 'Germany' },
    { code: '+33', flag: '🇫🇷', country: 'France' },
    { code: '+39', flag: '🇮🇹', country: 'Italy' },
    { code: '+34', flag: '🇪🇸', country: 'Spain' },
    { code: '+32', flag: '🇧🇪', country: 'Belgium' },
    { code: '+31', flag: '🇳🇱', country: 'Netherlands' },
    { code: '+41', flag: '🇨🇭', country: 'Switzerland' },
    { code: '+43', flag: '🇦🇹', country: 'Austria' },
    { code: '+48', flag: '🇵🇱', country: 'Poland' },
    { code: '+420', flag: '🇨🇿', country: 'Czech Republic' },
    { code: '+36', flag: '🇭🇺', country: 'Hungary' },
    { code: '+359', flag: '🇧🇬', country: 'Bulgaria' },
    { code: '+30', flag: '🇬🇷', country: 'Greece' },
    { code: '+90', flag: '🇹🇷', country: 'Turkey' },
];
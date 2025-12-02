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
    'Petrol': 'petrol',
    'Gasoline': 'gasoline',
    'Diesel': 'diesel',
    'Electric': 'electric',
    'Hybrid': 'hybrid',
} as const;

export type FuelTypeUI = keyof typeof FUEL_TYPE_MAP | 'Any'; // UI values
export type FuelTypeDB = typeof FUEL_TYPE_MAP[keyof typeof FUEL_TYPE_MAP]; // DB/API types

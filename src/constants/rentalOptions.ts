export interface RentalOption {
    id: keyof OptionsState; // one of the keys, e.g., 'unlimitedKm'
    label: string;
    description?: string; // optional
    category: "Limits" | "VIP Services" | "Insurance" | "Additional" | "Delivery";
    price?: string; // e.g., "+50%" or "800 MDL/zi"
    color?: "red" | "green" | "gray"; // for price badge
}

export interface OptionsState {
    pickupAtAddress: boolean;
    returnAtAddress: boolean;
    unlimitedKm: boolean;
    speedLimitIncrease: boolean;
    personalDriver: boolean;
    priorityService: boolean;
    childSeat: boolean;
    simCard: boolean;
    airportDelivery: boolean;
    roadsideAssistance: boolean;
}

export const rentalOptions: RentalOption[] = [
    {
        id: "unlimitedKm",
        label: "Kilometraj nelimitat",
        category: "Limits",
        price: "+50%",
        color: "red",
    },
    {
        id: "personalDriver",
        label: "Șofer personal",
        category: "VIP Services",
        price: "800 MDL/zi",
        color: "gray",
    },
    {
        id: "priorityService",
        label: "Priority Service",
        category: "VIP Services",
        price: "1 000 MDL/zi",
        color: "gray",
    },
    {
        id: "childSeat",
        label: "Scaun auto pentru copii",
        category: "Additional",
        price: "100 MDL/zi",
        color: "gray",
    },
    {
        id: "simCard",
        label: "Cartelă SIM cu internet",
        category: "Additional",
        price: "100 MDL/zi",
        color: "gray",
    },
    {
        id: "roadsideAssistance",
        label: "Asistență rutieră",
        category: "Additional",
        price: "500 MDL/zi",
        color: "gray",
    },
    {
        id: "airportDelivery",
        label: "Livrare aeroport",
        category: "Delivery",
        price: "Gratuit",
        color: "green",
    },
    {
        id: "returnAtAddress",
        label: "Returnarea la adresă",
        description: "Cost separat",
        category: "Delivery",
    },
    {
        id: "pickupAtAddress",
        label: "Preluare la adresă",
        description: "Cost separat",
        category: "Delivery",
    },
];

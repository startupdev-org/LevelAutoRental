import { BorrowRequestDTO } from "../../types";

export type RequestOption = {
    label: string;
    price: string;
    category: string;
};

export const parseRequestOptions = (request: BorrowRequestDTO): RequestOption[] => {
    console.log('the request is: ', request)

    if (!request) return [];

    let parsedOptions: any = {};

    // Parse options safely
    if (request.options) {
        if (typeof request.options === 'string') {
            try {
                parsedOptions = JSON.parse(request.options);
            } catch (e) {
                parsedOptions = {};
            }
        } else {
            parsedOptions = request.options;
        }
    }

    const selectedOptions: RequestOption[] = [];

    // TODO: get the labels from translation

    // Pickup and Return
    if (parsedOptions.pickupAtAddress) {
        selectedOptions.push({ label: 'Preluarea la adresă', price: 'Cost separat', category: 'pickup-return' });
    }
    if (parsedOptions.returnAtAddress) {
        selectedOptions.push({ label: 'Returnarea la adresă', price: 'Cost separat', category: 'pickup-return' });
    }
    if (parsedOptions.airportDelivery) {
        selectedOptions.push({ label: 'Livrare la aeroport', price: 'Gratuit', category: 'pickup-return' });
    }

    // Limits
    if (parsedOptions.unlimitedKm) {
        selectedOptions.push({ label: 'Kilometraj nelimitat', price: '+50%', category: 'limits' });
    }
    if (parsedOptions.speedLimitIncrease) {
        selectedOptions.push({ label: 'Creșterea limitei de viteză', price: '+20%', category: 'limits' });
    }

    // VIP Services
    if (parsedOptions.personalDriver) {
        selectedOptions.push({ label: 'Șofer personal', price: '800 MDL/zi', category: 'vip' });
    }
    if (parsedOptions.priorityService) {
        selectedOptions.push({ label: 'Serviciu Prioritar', price: '1 000 MDL/zi', category: 'vip' });
    }

    // Insurance
    // Tire insurance option removed

    // Additional
    if (parsedOptions.childSeat) {
        selectedOptions.push({ label: 'Scaun auto pentru copii', price: '100 MDL/zi', category: 'additional' });
    }
    if (parsedOptions.simCard) {
        selectedOptions.push({ label: 'Cartelă SIM cu internet', price: '100 MDL/zi', category: 'additional' });
    }
    if (parsedOptions.roadsideAssistance) {
        selectedOptions.push({ label: 'Asistență rutieră', price: '500 MDL/zi', category: 'additional' });
    }

    return selectedOptions;
};

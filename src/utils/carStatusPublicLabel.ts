import type { TFunction } from 'i18next';

/** Short label for public car UI when calendar cannot derive availability (uses `car.*` i18n keys). */
export function carStatusPublicLabel(status: string | undefined, t: TFunction): string {
    if (!status) return '';
    const key = status.trim().toLowerCase();
    if (key === 'booked') return t('car.statusBooked');
    if (key === 'borrowed') return t('car.statusBorrowed');
    if (key === 'maintenance') return t('car.statusMaintenance', { defaultValue: status });
    if (key === 'ascuns' || key === 'hidden') return t('car.statusUnavailable', { defaultValue: status });
    return status;
}

export function displayId(id: string | number | null) {
    return id !== null && id !== undefined
        ? String(id).padStart(4, '0')
        : 'N/A';
}

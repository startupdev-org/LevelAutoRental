export const hiddenPaths = ['/admin', '/dashboard'];

export const sparkData = Array.from({ length: 12 }).map((_, i) => ({
    x: i,
    y: Math.round(40 + Math.sin(i / 2) * 8 + i + Math.random() * 5), // random variation ±5
}));

export const mainChart = Array.from({ length: 30 }).map((_, i) => ({
    day: i + 1,
    sales: Math.round(2000 + Math.sin(i / 4) * 200 + i * 12 + Math.random() * 150), // random ±150
    baseline: Math.round(1200 + Math.cos(i / 5) * 80 + i * 4 + Math.random() * 50), // random ±50
}));

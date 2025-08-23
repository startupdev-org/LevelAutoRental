import React, { useState } from "react";

interface RangeSliderProps {
    min?: number;
    max?: number;
    step?: number;
    value: [number, number];
    onChange: (range: [number, number]) => void;
    label: string;
}

export default function RangeSlider({ min = 0, max = 100, step = 1, value, onChange, label }: RangeSliderProps) {
    const [range, setRange] = useState<[number, number]>(value || [min, max]);

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.min(Number(e.target.value), range[1] || max);
        const newRange: [number, number] = [val, range[1] || max];
        setRange(newRange);
        if (onChange) onChange(newRange);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Math.max(Number(e.target.value), range[0] || min);
        const newRange: [number, number] = [range[0] || min, val];
        setRange(newRange);
        if (onChange) onChange(newRange);
    };

    const getPercentage = (value: number) => {
        if (!value && value !== 0) return 0;
        return ((value - min) / (max - min)) * 100;
    };

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="relative px-3">
                {/* Track background */}
                <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 bg-gray-200 rounded-full"></div>

                {/* Active track */}
                <div
                    className="absolute top-1/2 transform -translate-y-1/2 h-2 bg-theme-500 rounded-full"
                    style={{
                        left: `${getPercentage(range[0] || min)}%`,
                        width: `${getPercentage(range[1] || max) - getPercentage(range[0] || min)}%`
                    }}
                ></div>

                {/* Min range input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={range[0] || min}
                    onChange={handleMinChange}
                    className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-theme-500 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-theme-500 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-none"
                />

                {/* Max range input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={range[1] || max}
                    onChange={handleMaxChange}
                    className="absolute w-full h-2 bg-transparent appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-theme-500 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-theme-500 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-none"
                />
            </div>

            <div className="flex justify-between text-sm text-gray-600 mt-2 px-3">
                <span>{range[0] || min}</span>
                <span>{range[1] || max}</span>
            </div>
        </div>
    );
}
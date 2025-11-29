import { Check } from "lucide-react";
import { RentalOption } from "../../../../constants/rentalOptions";

interface OptionItemProps {
    option: RentalOption;
    checked: boolean;
    onChange: (id: string, value: boolean) => void;
}

export const OptionItem: React.FC<OptionItemProps> = ({ option, checked, onChange }) => {
    const colors = {
        red: ["bg-red-500", "border-red-500", "text-red-400", "bg-red-400/10"],
        green: ["bg-green-500", "border-green-500", "text-green-400", "bg-green-400/10"],
        gray: ["bg-gray-500", "border-gray-500", "text-gray-300", "bg-white/5"],
    };

    const [bg, border, textColor, priceBg] = colors[option.color as keyof typeof colors || "gray"];


    return (
        <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(option.id, e.target.checked)}
                    className="sr-only"
                />
                <div
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${checked ? `${bg} ${border}` : "border-white/30 bg-transparent group-hover:border-white/50"
                        }`}
                >
                    {checked && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                    <div className="font-medium text-white text-sm">{option.label}</div>
                    {option.description && <div className="text-xs text-gray-400 mt-0.5">{option.description}</div>}
                </div>
            </div>
            {option.price && (
                <span className={`text-xs font-bold ${textColor} ${priceBg} px-2 py-1 rounded whitespace-nowrap`}>
                    {option.price}
                </span>
            )}
        </label>
    );
};

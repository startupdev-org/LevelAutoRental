import * as React from "react";
import { styled } from "@mui/material/styles";
import Slider, { SliderThumb } from "@mui/material/Slider";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// Airbnb slider style
const AirbnbSlider = styled(Slider)(({ theme }) => ({
    color: "#F52C2D",
    height: 3,
    padding: "13px 0",
    "& .MuiSlider-thumb": {
        height: 27,
        width: 27,
        backgroundColor: "#fff",
        border: "1px solid currentColor",
        "&:hover": {
            boxShadow: "0 0 0 8px rgba(245, 44, 45, 0.16)"
        },
        "& .airbnb-bar": {
            height: 9,
            width: 1,
            backgroundColor: "currentColor",
            marginLeft: 1,
            marginRight: 1
        }
    },
    "& .MuiSlider-track": {
        height: 3
    },
    "& .MuiSlider-rail": {
        color: theme.palette.mode === "dark" ? "#bfbfbf" : "#d8d8d8",
        opacity: 1,
        height: 3
    }
}));

function AirbnbThumbComponent(props: React.HTMLAttributes<unknown>) {
    const { children, ...other } = props;
    return (
        <SliderThumb {...other}>
            {children}
            <span className="airbnb-bar" />
            <span className="airbnb-bar" />
            <span className="airbnb-bar" />
        </SliderThumb>
    );
}

interface Props {
    label: string;
    min: number;
    max: number;
    step?: number;
    value: number[];
    currency?: string;
    onChange: (value: number[]) => void;
}

export default function RangeSlider({
    label,
    min,
    max,
    step = 1,
    value,
    currency = "",
    onChange,
}: Props) {
    const handleChange = (_: Event, newValue: number | number[]) => {
        onChange(newValue as number[]);
    };

    return (
        <Box sx={{ width: "90%", mx: "auto" }}>
            <Typography gutterBottom>{label}</Typography>
            <AirbnbSlider
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={handleChange}
                valueLabelDisplay="auto"
                slots={{ thumb: AirbnbThumbComponent }}

            />
            <Typography variant="body2" color="text.secondary">
                {value[0]} {currency} – {value[1]} {currency}
            </Typography>
        </Box>
    );
}

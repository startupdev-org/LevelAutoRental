import React from "react";
import { Card, Typography, Box } from "@mui/material";

interface CardStatsProps {
    title: string;      // title must be a string
    value: string | number; // value can be number or string
    icon: React.ReactNode;  // icon is any React element
    accent: string;
}

const CardStats: React.FC<CardStatsProps> = ({ title, value, icon, accent }) => {
    return (
        <Card sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ fontSize: 40 }}>{icon}</Box>
            <Box>
                <Typography variant="subtitle2" color="textSecondary">
                    {title}
                </Typography>
                <Typography variant="h5">{value}</Typography>
            </Box>
        </Card>
    );
};

export default CardStats;

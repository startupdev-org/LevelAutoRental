import React from "react";
import { Card, Typography } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface BarChartComponentProps {
    title: string;                   // chart title
    data: { name: string; value: number }[]; // array of objects with name and value
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({ title, data }) => {
    return (
        <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" mb={2}>
                {title}
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1976d2" />
                </BarChart>
            </ResponsiveContainer>
        </Card>
    );
};

export default BarChartComponent;

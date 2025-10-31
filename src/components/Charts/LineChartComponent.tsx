import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, Typography } from "@mui/material";

interface LineChartProps {
    title: string;
    data: { date: string; value: number }[]; // type of data
}

const LineChartComponent: React.FC<LineChartProps> = ({ title, data }) => {
    return (
        <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" mb={2}>{title}</Typography>
            <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#1976d2" />
                </LineChart>
            </ResponsiveContainer>
        </Card>
    );
};

export default LineChartComponent;

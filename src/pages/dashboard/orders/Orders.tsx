import React, { useState } from 'react';
import { mainChart } from '../../../data/index';
import { Sidebar } from '../../../components/layout/Sidebar';
import { OrdersTable } from '../../../components/dashboard/OrderTable';
import { SalesChartCard } from '../../../components/dashboard/Chart';
import { Button } from '../../../components/ui/Button';

export const Orders: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

            <main
                className="transition-all duration-300"
                style={{ marginLeft: sidebarCollapsed ? 72 : 280, paddingTop: 32 }}
            >
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                                    Rental Orders
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block">
                            </div>
                            <div className="flex items-center gap-2">
                                <Button className="bg-theme-500 hover:bg-theme-600 ml-1">
                                    Export
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="col-span-1 md:col-span-3 mt-10 mb-10">
                        <OrdersTable title="All Orders" />
                    </div>

                    {/* Large chart */}
                    <div className="col-span-1 md:col-span-3 mt-10 mb-10">
                        <SalesChartCard totalSales={8422.6} change="↑ 3.2% vs last 30 days" data={mainChart} />
                    </div>
                </div>
            </main>
        </div>
    );
};

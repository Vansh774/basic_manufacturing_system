import React, { useState, useEffect } from 'react';
import { getDowntimeAnalyticsReport } from '../services/api';
import toast from 'react-hot-toast';

const DowntimeAnalytics = ({ refreshTrigger }) => {
    const [range, setRange] = useState('today');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        total_downtime_minutes: 0,
        total_loss_units: 0,
        total_loss_value: 0,
        machine_breakdown: []
    });

    const filterOptions = [
        { label: 'Today', value: 'today' },
        { label: 'Last 1 Month', value: '1month' },
        { label: 'Last 6 Months', value: '6months' },
        { label: 'Last 1 Year', value: '1year' }
    ];

    const fetchAnalytics = async (selectedRange) => {
        setLoading(true);
        try {
            const res = await getDowntimeAnalyticsReport(selectedRange);
            if (res.success) {
                setData({
                    total_downtime_minutes: res.total_downtime_minutes || 0,
                    total_loss_units: res.total_loss_units || 0,
                    total_loss_value: res.total_loss_value || 0,
                    machine_breakdown: res.machine_breakdown || []
                });
            } else {
                toast.error(res.error || 'Failed to fetch downtime analytics');
            }
        } catch (error) {
            console.error('Error fetching downtime analytics:', error);
            if (error.response?.status === 403) {
                toast.error('Access denied to downtime analytics report');
            } else {
                toast.error('Failed to load downtime analytics');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics(range);
    }, [range, refreshTrigger]);

    // Format helper for currency (₹ INR)
    const formatCurrency = (val) => {
        if (!val || isNaN(val)) return '₹0';
        return '₹' + Number(val).toLocaleString('en-IN');
    };

    // Format helper for numbers
    const formatNumber = (val) => {
        if (!val || isNaN(val)) return '0';
        return Number(val).toLocaleString('en-IN');
    };

    // Convert minutes into "X mins (Yh Zm)"
    const formatDowntimeDuration = (mins) => {
        const m = parseInt(mins) || 0;
        const hours = Math.floor(m / 60);
        const remainder = m % 60;
        if (hours === 0) {
            return `${m} mins`;
        }
        return `${m} mins (${hours}h ${remainder > 0 ? remainder + 'm' : ''})`.replace(' )', ')');
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            {/* Header & Filter Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-100 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span>📊</span>
                        <span>Downtime Analytics & Production Loss Report</span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Real-time tracking of machine stoppages, production losses, and monetary impact
                    </p>
                </div>

                {/* Filter buttons */}
                <div className="flex flex-wrap items-center bg-gray-100 p-1.5 rounded-xl gap-1">
                    {filterOptions.map(opt => {
                        const isActive = range === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setRange(opt.value)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                                    isActive
                                        ? 'bg-white text-red-700 shadow-sm font-bold'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                }`}
                            >
                                {opt.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading ? (
                <div className="py-16 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent mb-3"></div>
                    <p className="text-gray-500 font-medium">Recalculating downtime metrics...</p>
                </div>
            ) : (
                <>
                    {/* Three Metric Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
                        {/* Card 1: Total Downtime (Red Theme) */}
                        <div className="bg-gradient-to-br from-red-50 to-red-100/60 rounded-xl p-6 border-2 border-red-200 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-bold text-red-600 mb-1">
                                        Total Downtime
                                    </p>
                                    <p className="text-3xl font-extrabold text-red-800">
                                        {formatDowntimeDuration(data.total_downtime_minutes)}
                                    </p>
                                    <p className="text-xs text-red-600 mt-2 font-medium">
                                        {((data.total_downtime_minutes || 0) / 60).toFixed(1)} total hours lost
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-red-200/70 text-red-700 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                    ⏱️
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Loss in Units (Orange Theme) */}
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100/60 rounded-xl p-6 border-2 border-orange-200 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-bold text-orange-600 mb-1">
                                        Loss in Units
                                    </p>
                                    <p className="text-3xl font-extrabold text-orange-800">
                                        {formatNumber(data.total_loss_units)} <span className="text-xl font-semibold">units</span>
                                    </p>
                                    <p className="text-xs text-orange-600 mt-2 font-medium">
                                        Production rate × downtime duration
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-orange-200/70 text-orange-700 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                    📦
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Loss in ₹ (Dark Red Theme) */}
                        <div className="bg-gradient-to-br from-rose-50 to-rose-100/80 rounded-xl p-6 border-2 border-rose-300 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs uppercase tracking-wider font-bold text-rose-800 mb-1">
                                        Loss in Price (₹)
                                    </p>
                                    <p className="text-3xl font-extrabold text-rose-950">
                                        {formatCurrency(data.total_loss_value)}
                                    </p>
                                    <p className="text-xs text-rose-700 mt-2 font-medium">
                                        At ₹4,000 / unit default rate
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-rose-200/80 text-rose-800 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                    💰
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Machine Breakdown Table */}
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">
                                Machine-wise Breakdown
                            </h3>
                            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                Sorted by Loss Value (Descending)
                            </span>
                        </div>

                        {data.machine_breakdown.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 text-gray-500">
                                🟢 No machine downtime recorded for this time range.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                                <table className="w-full text-left divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Machine Code
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Machine Name
                                            </th>
                                            <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Downtime Minutes
                                            </th>
                                            <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Loss Units
                                            </th>
                                            <th className="px-6 py-3.5 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                Loss Value (₹)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {data.machine_breakdown.map((row, idx) => (
                                            <tr key={row.machine_id || idx} className="hover:bg-red-50/40 transition">
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                                                    <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-md text-xs font-mono font-bold">
                                                        {row.machine_code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                                                    {row.machine_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-red-600">
                                                    {row.downtime_minutes} min
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-orange-600">
                                                    {formatNumber(row.loss_units)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-rose-800">
                                                    {formatCurrency(row.loss_value)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default DowntimeAnalytics;

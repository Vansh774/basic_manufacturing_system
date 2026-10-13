import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDailyReport, getMonthlyReport } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const ProfitLossReport = () => {
    const navigate = useNavigate();
    const [periodType, setPeriodType] = useState('daily');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [reportData, setReportData] = useState([]);
    const [productBreakdown, setProductBreakdown] = useState([]);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({
        totalUnits: 0,
        totalValue: 0,
        totalLoss: 0,
        netProfit: 0
    });

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    // Format currency in INR
    const formatCurrency = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '₹0';
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Format number with commas
    const formatNumber = (value) => {
        if (value === null || value === undefined || isNaN(value)) {
            return '0';
        }
        return new Intl.NumberFormat('en-IN').format(value);
    };

    // Calculate summary from report data
    const calculateSummary = (data) => {
        if (!data || data.length === 0) {
            setSummary({
                totalUnits: 0,
                totalValue: 0,
                totalLoss: 0,
                netProfit: 0
            });
            return;
        }

        const totalUnits = data.reduce((sum, item) => sum + (Number(item.total_units) || 0), 0);
        const totalValue = data.reduce((sum, item) => sum + (Number(item.total_value) || 0), 0);
        const totalLoss = data.reduce((sum, item) => sum + (Number(item.total_loss_value) || 0), 0);
        const netProfit = data.reduce((sum, item) => sum + (Number(item.net_profit) || 0), 0);

        setSummary({
            totalUnits,
            totalValue,
            totalLoss,
            netProfit
        });
    };

    // Fetch data based on period type
    const fetchData = async () => {
        setLoading(true);
        try {
            if (periodType === 'daily') {
                const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
                const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${new Date(selectedYear, selectedMonth, 0).getDate()}`;
                
                const response = await getDailyReport(startDate, endDate);
                
                if (response.success && response.report) {
                    setReportData(response.report);
                    setProductBreakdown(response.productBreakdown || []);
                    calculateSummary(response.report);
                } else {
                    setReportData([]);
                    setProductBreakdown([]);
                    setSummary({
                        totalUnits: 0,
                        totalValue: 0,
                        totalLoss: 0,
                        netProfit: 0
                    });
                }
            } else if (periodType === 'monthly') {
                const response = await getMonthlyReport(selectedYear, selectedMonth);
                
                if (response.success && response.report) {
                    setReportData([response.report]);
                    setProductBreakdown(response.topProducts || []);
                    setSummary({
                        totalUnits: response.report.total_units || 0,
                        totalValue: response.report.total_value || 0,
                        totalLoss: response.report.total_loss_value || 0,
                        netProfit: response.report.net_profit || 0,
                    });
                } else {
                    setReportData([]);
                    setProductBreakdown([]);
                    setSummary({
                        totalUnits: 0,
                        totalValue: 0,
                        totalLoss: 0,
                        netProfit: 0
                    });
                }
            }
        } catch (error) {
            toast.error('Failed to load report data');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get product breakdown for a specific date
    const getProductBreakdownForDate = (date) => {
        if (!productBreakdown) return [];
        return productBreakdown.filter(item => item.date === date);
    };

    // Render chart based on period type
    const renderChart = () => {
        if (!reportData || reportData.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500">
                    No data available for the selected period
                </div>
            );
        }

        if (periodType === 'daily') {
            return (
                <div>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={reportData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="date" 
                                tickFormatter={(date) => new Date(date).toLocaleDateString()} 
                                interval={Math.floor(reportData.length / 10)}
                            />
                            <YAxis yAxisId="left" label={{ value: 'Units', angle: -90, position: 'insideLeft' }} />
                            <YAxis yAxisId="right" orientation="right" label={{ value: 'Profit (₹)', angle: 90, position: 'insideRight' }} />
                            <Tooltip 
                                formatter={(value, name) => {
                                    if (name === 'Net Profit' || name === 'Total Loss') {
                                        return [formatCurrency(value), name];
                                    }
                                    return [formatNumber(value), name];
                                }}
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            />
                            <Legend />
                            <Bar yAxisId="left" dataKey="total_units" name="Production Units" fill="#8884d8" />
                            <Bar yAxisId="right" dataKey="net_profit" name="Net Profit" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                    
                    {/* Product-wise breakdown for each day */}
                    {reportData.map((day) => {
                        const products = getProductBreakdownForDate(day.date);
                        if (products.length === 0) return null;
                        
                        return (
                            <div key={day.date} className="mt-8 border-t pt-6">
                                <h3 className="text-lg font-semibold mb-3">
                                    Product Breakdown for {new Date(day.date).toLocaleDateString()}
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Product</th>
                                                <th className="px-4 py-2 text-right">Units</th>
                                                <th className="px-4 py-2 text-right">Value (₹)</th>
                                                <th className="px-4 py-2 text-right">% of Day</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map((product, idx) => (
                                                <tr key={idx} className="border-t hover:bg-gray-50">
                                                    <td className="px-4 py-2 font-medium">{product.product_name}</td>
                                                    <td className="px-4 py-2 text-right">{formatNumber(product.total_units)}</td>
                                                    <td className="px-4 py-2 text-right">{formatCurrency(product.total_value)}</td>
                                                    <td className="px-4 py-2 text-right">
                                                        {day.total_units > 0 
                                                            ? ((product.total_units / day.total_units) * 100).toFixed(1)
                                                            : '0'}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        } else if (periodType === 'monthly' && reportData[0]) {
            const data = reportData[0];
            const pieData = [
                { name: 'Production Value', value: Number(data.total_value) || 0 },
                { name: 'Loss Value', value: Number(data.total_loss_value) || 0 },
            ];
            
            return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-center">Profit vs Loss</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-center">Top Products This Month</h3>
                        {productBreakdown && productBreakdown.length > 0 ? (
                            <div className="space-y-3">
                                {productBreakdown.map((product, idx) => (
                                    <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium">{product.product_name}</span>
                                            <span>{formatNumber(product.total_units)} units</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Value:</span>
                                            <span>{formatCurrency(product.total_value)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                style={{ width: `${(product.total_units / data.total_units) * 100}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-right text-xs text-gray-500 mt-1">
                                            {((product.total_units / data.total_units) * 100).toFixed(1)}% of total
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                No product data available for this month
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        
        return null;
    };

    // Load data on component mount and when filters change
    useEffect(() => {
        fetchData();
    }, [periodType, selectedYear, selectedMonth]);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header with Back Button */}
                <div className="flex gap-3">
    <button
        onClick={() => navigate('/daily-breakdown')}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
    >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Daily Breakdown
    </button>
    <button
        onClick={() => navigate('/owner')}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
    >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
    </button>
</div>
                
                {/* Filter Controls */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPeriodType('daily')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    periodType === 'daily'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Daily Report
                            </button>
                            <button
                                onClick={() => setPeriodType('monthly')}
                                className={`px-4 py-2 rounded-lg font-medium transition ${
                                    periodType === 'monthly'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Monthly Report
                            </button>
                        </div>
                        
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {[2024, 2025, 2026].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        
                        {periodType !== 'yearly' && (
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                    <option key={month} value={month}>
                                        {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        )}
                        
                        <button
                            onClick={fetchData}
                            disabled={loading}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading...
                                </>
                            ) : (
                                'Refresh'
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-500 mb-1">Total Production</p>
                        <p className="text-2xl font-bold text-blue-600">{formatNumber(summary.totalUnits)} units</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <p className="text-sm text-gray-500 mb-1">Production Value</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalValue)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                        <p className="text-sm text-gray-500 mb-1">Total Loss</p>
                        <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalLoss)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                        <p className="text-sm text-gray-500 mb-1">Net Profit</p>
                        <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(summary.netProfit)}
                        </p>
                    </div>
                </div>
                
                {/* Chart Section */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {periodType === 'daily' ? 'Daily Performance Chart' : 'Monthly Performance Overview'}
                    </h2>
                    {loading ? (
                        <div className="flex justify-center items-center h-96">
                            <div className="text-gray-500">Loading chart data...</div>
                        </div>
                    ) : (
                        renderChart()
                    )}
                </div>
                
                {/* Daily Data Table */}
                {reportData && reportData.length > 0 && periodType === 'daily' && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-lg font-semibold">Daily Breakdown</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value (₹)</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Loss (₹)</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Profit (₹)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {reportData.map((item, index) => (
                                        <tr 
            key={index} 
            className="hover:bg-gray-50 cursor-pointer"
            onClick={() => navigate(`/daily-breakdown/${item.date}`)}
        >
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                                                {new Date(item.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {formatNumber(item.total_units)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {formatCurrency(item.total_value)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-red-600">
                                                {formatCurrency(item.total_loss_value)}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${item.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(item.net_profit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfitLossReport;
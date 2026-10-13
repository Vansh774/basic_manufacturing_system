import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductionByDate } from '../services/api';
import toast from 'react-hot-toast';

const DailyBreakdown = () => {
    const navigate = useNavigate();
    const { date } = useParams();
    const [selectedDate, setSelectedDate] = useState(date || new Date().toISOString().split('T')[0]);
    const [productionData, setProductionData] = useState([]);
    const [productBreakdown, setProductBreakdown] = useState({});
    const [loading, setLoading] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        if (date) {
            setSelectedDate(date);
        }
        fetchData(selectedDate);
    }, [date, selectedDate]);

    const fetchData = async (dateToFetch) => {
        setLoading(true);
        try {
            const response = await getProductionByDate(dateToFetch);
            if (response.success) {
                setProductionData(response.entries);
                
                // Group by product
                const productMap = new Map();
                response.entries.forEach(entry => {
                    const productName = entry.product_name;
                    if (productMap.has(productName)) {
                        productMap.set(productName, {
                            quantity: productMap.get(productName).quantity + entry.quantity,
                            value: productMap.get(productName).value + (entry.quantity * 4000)
                        });
                    } else {
                        productMap.set(productName, {
                            quantity: entry.quantity,
                            value: entry.quantity * 4000
                        });
                    }
                });
                
                setProductBreakdown(Object.fromEntries(productMap));
            }
        } catch (error) {
            toast.error('Failed to load production data');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat('en-IN').format(value);
    };

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
        fetchData(newDate);
    };

    const handleProductClick = (productName, productData) => {
        setSelectedProduct({ name: productName, ...productData });
        setShowProductModal(true);
    };

    const totalUnits = Object.values(productBreakdown).reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = Object.values(productBreakdown).reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Daily Breakdown</h1>
                        <p className="text-gray-600">View production details by date and product</p>
                    </div>
                    <button
                        onClick={() => navigate('/reports')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Reports
                    </button>
                </div>

                {/* Date Selector */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        <label className="font-medium text-gray-700">Select Date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => handleDateChange(new Date().toISOString().split('T')[0])}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                        >
                            Today
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-500 mb-1">Total Units</p>
                        <p className="text-2xl font-bold text-blue-600">{formatNumber(totalUnits)} units</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                        <p className="text-sm text-gray-500 mb-1">Total Value</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalValue)}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                        <p className="text-sm text-gray-500 mb-1">Date</p>
                        <p className="text-2xl font-bold text-purple-600">{new Date(selectedDate).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Product Breakdown Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold">Product Breakdown for {new Date(selectedDate).toLocaleDateString()}</h2>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value (₹)</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">% of Day</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {Object.entries(productBreakdown).length > 0 ? (
                                        Object.entries(productBreakdown).map(([productName, productData]) => (
                                            <tr key={productName} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap font-medium">{productName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">{formatNumber(productData.quantity)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(productData.value)}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {totalUnits > 0 ? ((productData.quantity / totalUnits) * 100).toFixed(1) : '0'}%
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => handleProductClick(productName, productData)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                No production data available for this date
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Product Details Modal */}
                {showProductModal && selectedProduct && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg px-6 py-4">
                                <h2 className="text-xl font-bold text-white">{selectedProduct.name}</h2>
                                <p className="text-blue-100 text-sm">Production Details</p>
                            </div>
                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Total Units</p>
                                        <p className="text-3xl font-bold text-blue-600">{formatNumber(selectedProduct.quantity)} units</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Total Value</p>
                                        <p className="text-3xl font-bold text-green-600">{formatCurrency(selectedProduct.value)}</p>
                                    </div>
                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Percentage of Day</p>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {totalUnits > 0 ? ((selectedProduct.quantity / totalUnits) * 100).toFixed(1) : '0'}%
                                        </p>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                            <div 
                                                className="bg-purple-600 h-2 rounded-full"
                                                style={{ width: `${(selectedProduct.quantity / totalUnits) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => setShowProductModal(false)}
                                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyBreakdown;
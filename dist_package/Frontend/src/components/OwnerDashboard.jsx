import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMachines, getMachineStats, getTodayProduction, getProductionByDate, logout, getApiUrl } from '../services/api';
import toast from 'react-hot-toast';
import DowntimeAnalytics from './DowntimeAnalytics';
import MostStoppedMachines from './MostStoppedMachines';
import AlertNotificationBell from './AlertNotificationBell';

const OwnerDashboard = () => {
    const [machines, setMachines] = useState([]);
    const [stats, setStats] = useState({ total: 0, running: 0, stopped: 0, maintenance: 0 });
    const [todayProduction, setTodayProduction] = useState(0);
    const [todayProductionDetails, setTodayProductionDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProductionModal, setShowProductionModal] = useState(false);
    const [analyticsRefreshTrigger, setAnalyticsRefreshTrigger] = useState(0);
    const navigate = useNavigate();

    // Helper function to format numbers
    const formatNumber = (value) => {
        if (!value || isNaN(value) || value === 0) return '0';
        return Number(value).toLocaleString('en-IN');
    };

    // Helper function to format currency
    const formatCurrency = (value) => {
        if (!value || isNaN(value) || value === 0) return '0';
        return Number(value).toLocaleString('en-IN');
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [machinesRes, statsRes, productionRes] = await Promise.all([
                getMachines(),
                getMachineStats(),
                getTodayProduction()
            ]);
            
            const validatedMachines = machinesRes.machines.map(machine => ({
                ...machine,
                today_loss_quantity: machine.today_loss_quantity > 10000 ? 0 : (machine.today_loss_quantity || 0),
                today_loss_amount: machine.today_loss_amount > 50000000 ? 0 : (machine.today_loss_amount || 0)
            }));
            
            setMachines(validatedMachines);
            setStats(statsRes.stats);
            setTodayProduction(productionRes.total || 0);
            
            const today = new Date().toISOString().split('T')[0];
            const detailsRes = await getProductionByDate(today);
            if (detailsRes.success && detailsRes.entries) {
                const productMap = new Map();
                detailsRes.entries.forEach(entry => {
                    const productName = entry.product_name;
                    if (productMap.has(productName)) {
                        productMap.set(productName, productMap.get(productName) + entry.quantity);
                    } else {
                        productMap.set(productName, entry.quantity);
                    }
                });
                
                const productDetails = Array.from(productMap.entries()).map(([name, quantity]) => ({
                    product: name,
                    quantity: quantity
                }));
                setTodayProductionDetails(productDetails);
            }
        } catch (error) {
            console.error('Fetch data error:', error);
            toast.error('Failed to fetch data');
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetAllMachines = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${getApiUrl()}/machines/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Reset failed');
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Reset error details:', error);
            throw error;
        }
    };

    const handleManualReset = async () => {
        if (window.confirm('⚠️ Are you sure you want to reset all machines to STOPPED status?\n\nThis will:\n- Stop all running machines\n- End all current operations\n- Record downtime for the day\n\nContinue?')) {
            try {
                toast.loading('Resetting machines...', { id: 'reset' });
                const response = await resetAllMachines();
                toast.dismiss('reset');
                
                if (response.success) {
                    toast.success(`✅ ${response.message || `Reset ${response.resetCount} machines to stopped status`}`);
                    fetchData();
                } else {
                    toast.error(response.error || 'Failed to reset machines');
                }
            } catch (error) {
                toast.dismiss('reset');
                toast.error('Error resetting machines: ' + (error.message || 'Unknown error'));
                console.error('Reset error:', error);
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        toast.success('Logged out');
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'running': return 'bg-green-100 text-green-800';
            case 'stopped': return 'bg-red-100 text-red-800';
            case 'maintenance': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const totalLossQuantity = machines.reduce((sum, m) => sum + (Number(m.today_loss_quantity) || 0), 0);
    const totalLossValue = machines.reduce((sum, m) => sum + (Number(m.today_loss_amount) || 0), 0);
    const affectedMachines = machines.filter(m => (Number(m.today_loss_quantity) || 0) > 0).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-blue-600">Owner Dashboard</h1>
                            <p className="text-sm text-gray-600">Factory Management System</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <AlertNotificationBell onAlert={() => { fetchData(); setAnalyticsRefreshTrigger(prev => prev + 1); }} />
                            <button
                                onClick={() => navigate('/reports')}
                                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
                            >
                                View Reports
                            </button>
                            <button
                                onClick={handleManualReset}
                                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                            >
                                Reset All Machines
                            </button>
                            <button
                                onClick={fetchData}
                                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-gray-500 text-sm mb-1">Total Machines</div>
                        <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-gray-500 text-sm mb-1">Running</div>
                        <div className="text-3xl font-bold text-green-600">{stats.running}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-gray-500 text-sm mb-1">Stopped</div>
                        <div className="text-3xl font-bold text-red-600">{stats.stopped}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="text-gray-500 text-sm mb-1">Maintenance</div>
                        <div className="text-3xl font-bold text-yellow-600">{stats.maintenance}</div>
                    </div>
                </div>

                {/* Loss Summary Card */}
                {totalLossQuantity > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-8">
                        <h3 className="text-lg font-semibold mb-4 text-red-700">⚠️ Today's Loss Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-red-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">Total Loss Quantity</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {formatNumber(Math.floor(totalLossQuantity))} units
                                </p>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">Total Loss Value</p>
                                <p className="text-2xl font-bold text-orange-600">
                                    ₹{formatCurrency(Math.floor(totalLossValue))}
                                </p>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600">Affected Machines</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {affectedMachines} machines
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Today's Production Card */}
                <div 
                    className="bg-white rounded-lg shadow p-6 mb-8 cursor-pointer hover:shadow-lg transition"
                    onClick={() => setShowProductionModal(true)}
                >
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-gray-500 text-sm mb-1">Today's Production</div>
                            <div className="text-4xl font-bold text-purple-600">{formatNumber(todayProduction)} units</div>
                        </div>
                        <div className="text-right">
                            <div className="text-gray-500 text-sm">Target: 10,000 units</div>
                            <div className="w-48 h-2 bg-gray-200 rounded-full mt-2">
                                <div 
                                    className="h-2 bg-purple-600 rounded-full"
                                    style={{ width: `${Math.min((todayProduction / 10000) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-blue-500 mt-2">Click to see breakdown →</div>
                        </div>
                    </div>
                </div>

                {/* Machine Status Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold">Machine Status</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Downtime Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Today's Loss</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Est. Loss</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {machines.map((machine) => (
                                    <tr key={machine.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{machine.machine_code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{machine.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(machine.status)}`}>
                                                {machine.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {machine.current_downtime_reason && machine.current_downtime_reason !== 'Day start reset' 
                                                ? machine.current_downtime_reason 
                                                : (machine.today_loss_quantity > 0 ? 'Previously stopped' : '-')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">{machine.current_product || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{machine.operator_name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {machine.today_loss_quantity > 0 ? (
                                                <span className="text-orange-600 font-semibold">
                                                    {formatNumber(Math.floor(machine.today_loss_quantity))} units
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {machine.today_loss_amount > 0 ? (
                                                <span className="text-red-600 font-bold">
                                                    ₹{formatCurrency(Math.floor(machine.today_loss_amount))}
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Downtime Analytics & Production Loss Report */}
                <DowntimeAnalytics refreshTrigger={analyticsRefreshTrigger} />

                {/* Machine Stoppage Analysis (Most Stopped Machines & Reasons) */}
                <MostStoppedMachines refreshTrigger={analyticsRefreshTrigger} />
            </div>

            {/* Production Breakdown Modal */}
            {showProductionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold">Today's Production Breakdown</h2>
                                <p className="text-gray-500 text-sm">{new Date().toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={() => setShowProductionModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            {todayProductionDetails.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="bg-purple-50 rounded-lg p-4 mb-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-purple-800">Total Production:</span>
                                            <span className="text-2xl font-bold text-purple-600">{formatNumber(todayProduction)} units</span>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-gray-200">
                                        {todayProductionDetails.map((item, index) => (
                                            <div key={index} className="py-3 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 font-bold">
                                                            {item.product.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <span className="font-medium text-gray-800">{item.product}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-blue-600">{formatNumber(item.quantity)} units</div>
                                                    <div className="text-sm text-gray-500">
                                                        {((item.quantity / todayProduction) * 100).toFixed(1)}% of total
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                            {todayProductionDetails.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="h-full float-left"
                                                    style={{
                                                        width: `${(item.quantity / todayProduction) * 100}%`,
                                                        backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                                                    }}
                                                ></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No production entries for today
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
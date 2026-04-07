import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMachines, getMachineStats, getTodayProduction, getOpenDowntime, resolveDowntime, logout } from '../services/api';
import toast from 'react-hot-toast';

const ManagerDashboard = () => {
    const [machines, setMachines] = useState([]);
    const [stats, setStats] = useState({ total: 0, running: 0, stopped: 0, maintenance: 0 });
    const [todayProduction, setTodayProduction] = useState(0);
    const [openDowntime, setOpenDowntime] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [machinesRes, statsRes, productionRes, downtimeRes] = await Promise.all([
                getMachines(),
                getMachineStats(),
                getTodayProduction(),
                getOpenDowntime()
            ]);
            setMachines(machinesRes.machines);
            setStats(statsRes.stats);
            setTodayProduction(productionRes.total);
            setOpenDowntime(downtimeRes.downtimes || []);
        } catch (error) {
            toast.error('Failed to fetch data');
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResolveDowntime = async (id) => {
        try {
            await resolveDowntime(id);
            toast.success('Downtime resolved!');
            fetchData();
        } catch (error) {
            toast.error('Failed to resolve downtime');
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

    const formatNumber = (value) => {
        return new Intl.NumberFormat('en-IN').format(value || 0);
    };

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
                            <h1 className="text-2xl font-bold text-blue-600">Manager Dashboard</h1>
                            <p className="text-sm text-gray-600">Production Monitoring & Machine Status</p>
                        </div>
                        <div className="flex space-x-4">
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
                {/* Stats Cards - No Loss Card */}
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

                {/* Production Summary Card - No Loss */}
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-gray-500 text-sm mb-1">Today's Production</div>
                            <div className="text-4xl font-bold text-purple-600">{formatNumber(todayProduction)} units</div>
                        </div>
                        <div className="text-right">
                            <div className="text-gray-500 text-sm">Daily Target: 10,000 units</div>
                            <div className="w-48 h-2 bg-gray-200 rounded-full mt-2">
                                <div 
                                    className="h-2 bg-purple-600 rounded-full"
                                    style={{ width: `${Math.min((todayProduction / 10000) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {((todayProduction / 10000) * 100).toFixed(1)}% of target achieved
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stopped Machines Section - No Loss Amount */}
                <div className="bg-white rounded-lg shadow mb-8">
                    <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
                        <h2 className="text-xl font-semibold text-red-800">
                            ⚠️ Stopped Machines
                        </h2>
                        <p className="text-sm text-red-600 mt-1">Machines that need attention</p>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {machines.filter(m => m.status === 'stopped').map((machine) => (
                            <div key={machine.id} className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold">{machine.name}</h3>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(machine.status)}`}>
                                                {machine.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">Code: {machine.machine_code}</p>
                                        <p className="text-sm mt-2">
                                            <span className="font-semibold">Production Rate:</span> {machine.production_rate_per_hour} units/hour
                                        </p>
                                        {machine.current_downtime_reason && (
                                            <p className="text-sm mt-1">
                                                <span className="font-semibold">Reason:</span> {machine.current_downtime_reason}
                                            </p>
                                        )}
                                        {machine.downtime_start_time && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                Stopped at: {new Date(machine.downtime_start_time).toLocaleTimeString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Stopped Duration</div>
                                        <div className="text-xl font-semibold text-red-600">
                                            {machine.downtime_start_time 
                                                ? `${Math.floor((new Date() - new Date(machine.downtime_start_time)) / 60000)} minutes`
                                                : 'Just now'}
                                        </div>
                                        <button
                                            onClick={() => handleResolveDowntime(machine.id)}
                                            className="mt-3 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm"
                                        >
                                            Mark as Resolved
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {machines.filter(m => m.status === 'stopped').length === 0 && (
                            <div className="p-6 text-center text-gray-500">
                                ✓ No machines are currently stopped. All machines are operational!
                            </div>
                        )}
                    </div>
                </div>

                {/* Open Downtime Issues Section */}
                {openDowntime.length > 0 && (
                    <div className="bg-white rounded-lg shadow mb-8">
                        <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
                            <h2 className="text-xl font-semibold text-yellow-800">🕒 Pending Issues</h2>
                            <p className="text-sm text-yellow-600 mt-1">Issues reported by operators awaiting resolution</p>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {openDowntime.map((downtime) => (
                                <div key={downtime.id} className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-semibold">{downtime.machine_name}</h3>
                                            <p className="text-sm text-gray-600">Code: {downtime.machine_code}</p>
                                            <p className="text-sm mt-2">
                                                <span className="font-semibold">Issue:</span> {downtime.reason}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-semibold">Reported:</span> {new Date(downtime.start_time).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-red-600">
                                                Duration: {Math.floor((new Date() - new Date(downtime.start_time)) / 60000)} minutes
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleResolveDowntime(downtime.id)}
                                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                                        >
                                            Resolve Issue
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Machines Status Table - No Loss Column */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold">All Machines Status</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Downtime Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operator</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stopped Duration</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
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
                                        <td className="px-6 py-4 whitespace-nowrap">{machine.current_downtime_reason || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{machine.current_product || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{machine.operator_name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {machine.status === 'stopped' && machine.downtime_start_time ? (
                                                <span className="text-red-600 font-medium">
                                                    {Math.floor((new Date() - new Date(machine.downtime_start_time)) / 60000)} min
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {machine.status === 'stopped' && (
                                                <button
                                                    onClick={() => handleResolveDowntime(machine.id)}
                                                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
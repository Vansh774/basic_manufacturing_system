import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMachines, updateMachineStatus, addProductionEntry, logout, getApiUrl } from '../services/api';
import toast from 'react-hot-toast';
import FirebaseBadge from './FirebaseBadge';

const OperatorDashboard = () => {
    const [machines, setMachines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showProductionModal, setShowProductionModal] = useState(false);
    const [downtimeReason, setDowntimeReason] = useState('');
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedShift, setSelectedShift] = useState('morning');
    const [productionQuantity, setProductionQuantity] = useState('');
    const [pendingStatus, setPendingStatus] = useState(null);
    const navigate = useNavigate();

    const products = ['Bucket', 'Cover', 'Handle', 'Lid', 'Base Plate', 'Support Bracket'];
    const shifts = ['morning', 'evening', 'night'];
    
    const downtimeReasons = [
    'Material Shortage',
    'Machine Issue',
    'Power Problem',
    'Quality Check',
    'Other'
];

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const machinesRes = await getMachines();
            setMachines(machinesRes.machines);
        } catch (error) {
            toast.error('Failed to fetch data');
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (machineId, status, product = null, reason = null) => {
        try {
            const response = await updateMachineStatus(machineId, status, reason);
            if (response.success) {
                // If status is running and product is selected, update the product
                if (status === 'running' && product) {
                    await fetch(`${getApiUrl()}/machines/${machineId}/product`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ product })
                    });
                }
                toast.success(`Machine marked as ${status}`);
                fetchData();
            }
        } catch (error) {
            console.error('Status update error:', error);
            toast.error(error.response?.data?.error || 'Failed to update status');
        }
    };

    const handleRunningClick = (machine) => {
        setSelectedMachine(machine);
        setShowProductModal(true);
    };

    const handleProductSelect = async () => {
        if (!selectedProduct) {
            toast.error('Please select a product');
            return;
        }
        await updateStatus(selectedMachine.id, 'running', selectedProduct);
        setShowProductModal(false);
        setSelectedProduct('');
        setSelectedMachine(null);
    };

    const handleStopClick = (machine) => {
        setSelectedMachine(machine);
        setShowReasonModal(true);
    };

    const handleReasonSubmit = async () => {
        if (!downtimeReason) {
            toast.error('Please select a reason');
            return;
        }
        await updateStatus(selectedMachine.id, 'stopped', null, downtimeReason);
        setShowReasonModal(false);
        setDowntimeReason('');
        setSelectedMachine(null);
    };

    const handleMaintenanceClick = (machine) => {
        updateStatus(machine.id, 'maintenance');
    };

    const handleProductionSubmit = async (e) => {
        e.preventDefault();
        if (!selectedMachine || !productionQuantity || !selectedProduct) {
            toast.error('Please fill all fields');
            return;
        }

        try {
            await addProductionEntry({
                machine_id: selectedMachine.id,
                product_id: selectedProduct,
                shift: selectedShift,
                quantity: parseInt(productionQuantity)
            });
            toast.success('Production entry added!');
            setShowProductionModal(false);
            setProductionQuantity('');
            setSelectedProduct('');
            fetchData();
        } catch (error) {
            console.error('Production entry error:', error);
            toast.error(error.response?.data?.error || 'Failed to add production entry');
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'running': return 'bg-green-500';
            case 'stopped': return 'bg-red-500';
            case 'maintenance': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusText = (status) => {
        switch(status) {
            case 'running': return 'RUNNING';
            case 'stopped': return 'STOPPED';
            case 'maintenance': return 'MAINTENANCE';
            default: return 'OFF';
        }
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
            <nav className="bg-white shadow-lg sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center justify-between w-full sm:w-auto">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-blue-600">Operator Dashboard</h1>
                                <p className="text-xs sm:text-sm text-gray-600">Machine Control & Production Entry</p>
                            </div>
                            <div className="sm:hidden flex items-center gap-1.5">
                                <FirebaseBadge />
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 w-full sm:w-auto justify-end">
                            <div className="hidden sm:flex items-center gap-2">
                                <FirebaseBadge />
                            </div>
                            <button
                                onClick={fetchData}
                                className="bg-green-500 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg hover:bg-green-600 transition"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                    toast.success('Logged out');
                                }}
                                className="bg-red-500 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg hover:bg-red-600 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-4 sm:py-8">
                {/* Instructions Card */}
                <div className="bg-blue-50 rounded-xl shadow p-4 sm:p-6 mb-6 sm:mb-8 border border-blue-200">
                    <div className="flex items-center">
                        <div className="text-2xl sm:text-3xl mr-3 sm:mr-4">🔧</div>
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-blue-800">Operator Instructions</h2>
                            <p className="text-xs sm:text-sm text-blue-600">When starting a machine, you will be prompted to select the product you will be producing.</p>
                        </div>
                    </div>
                </div>

                {/* Machines Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {machines.map((machine) => (
                        <div key={machine.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                            <div className="p-4 sm:p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">{machine.name}</h3>
                                        <p className="text-xs sm:text-sm text-gray-500">Code: {machine.machine_code}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            Rate: {machine.production_rate_per_hour} units/hour
                                        </p>
                                        {machine.current_product && (
                                            <p className="text-xs text-blue-600 mt-0.5 font-medium">
                                                Current Product: {machine.current_product}
                                            </p>
                                        )}
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(machine.status)}`}>
                                        {getStatusText(machine.status)}
                                    </div>
                                </div>

                                {/* Today's Loss Display */}
                                {machine.status === 'stopped' && machine.today_loss_quantity > 0 && (
                                    <div className="mb-3 p-2.5 bg-red-50 rounded-lg border border-red-200">
                                        <p className="text-xs sm:text-sm text-red-600 font-semibold">
                                            ⚠️ Today's Loss: {machine.today_loss_quantity} units
                                        </p>
                                        {machine.current_downtime_reason && (
                                            <p className="text-xs text-red-500 mt-0.5">
                                                Reason: {machine.current_downtime_reason}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Control Buttons */}
                                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4">
                                    <button
                                        onClick={() => handleRunningClick(machine)}
                                        disabled={machine.status === 'running'}
                                        className={`px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg text-white font-semibold transition ${
                                            machine.status === 'running'
                                                ? 'bg-green-300 cursor-not-allowed'
                                                : 'bg-green-500 hover:bg-green-600'
                                        }`}
                                    >
                                        Running
                                    </button>
                                    <button
                                        onClick={() => handleStopClick(machine)}
                                        disabled={machine.status === 'stopped'}
                                        className={`px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg text-white font-semibold transition ${
                                            machine.status === 'stopped'
                                                ? 'bg-red-300 cursor-not-allowed'
                                                : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                    >
                                        Stopped
                                    </button>
                                    <button
                                        onClick={() => handleMaintenanceClick(machine)}
                                        disabled={machine.status === 'maintenance'}
                                        className={`px-2 py-2 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg text-white font-semibold transition ${
                                            machine.status === 'maintenance'
                                                ? 'bg-yellow-300 cursor-not-allowed'
                                                : 'bg-yellow-500 hover:bg-yellow-600'
                                        }`}
                                    >
                                        Maintenance
                                    </button>
                                </div>

                                {/* Production Entry Button */}
                                <button
                                    onClick={() => {
                                        setSelectedMachine(machine);
                                        setShowProductionModal(true);
                                    }}
                                    disabled={machine.status !== 'running'}
                                    className={`mt-4 w-full px-3 py-2 rounded-lg transition text-sm font-semibold ${
                                        machine.status === 'running'
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Add Production Entry
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Product Selection Modal for Running */}
            {showProductModal && selectedMachine && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">Select Product</h2>
                        <p className="text-gray-600 mb-4">Machine: {selectedMachine?.name}</p>
                        <p className="text-sm text-gray-500 mb-4">Select the product you will be producing on this machine</p>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Product</label>
                            <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select a product...</option>
                                {products.map(product => (
                                    <option key={product} value={product}>{product}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={handleProductSelect}
                                className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
                            >
                                Start Machine
                            </button>
                            <button
                                onClick={() => {
                                    setShowProductModal(false);
                                    setSelectedProduct('');
                                    setSelectedMachine(null);
                                }}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reason Modal for Stopping Machine */}
            {showReasonModal && selectedMachine && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">Why is the machine stopped?</h2>
                        <p className="text-gray-600 mb-4">Machine: {selectedMachine?.name}</p>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Select Reason</label>
                            <select
                                value={downtimeReason}
                                onChange={(e) => setDowntimeReason(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select a reason...</option>
                                {downtimeReasons.map(reason => (
                                    <option key={reason} value={reason}>{reason}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex space-x-2">
                            <button
                                onClick={handleReasonSubmit}
                                className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
                            >
                                Confirm Stop
                            </button>
                            <button
                                onClick={() => {
                                    setShowReasonModal(false);
                                    setDowntimeReason('');
                                }}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Production Entry Modal */}
            {showProductionModal && selectedMachine && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold mb-4">Add Production Entry</h2>
                        <form onSubmit={handleProductionSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Machine</label>
                                <input
                                    type="text"
                                    value={selectedMachine?.name}
                                    disabled
                                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                                />
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Product</label>
                                <select
                                    value={selectedProduct}
                                    onChange={(e) => setSelectedProduct(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    required
                                >
                                    <option value="">Select Product</option>
                                    {products.map(product => (
                                        <option key={product} value={product}>{product}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Shift</label>
                                <select
                                    value={selectedShift}
                                    onChange={(e) => setSelectedShift(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    {shifts.map(shift => (
                                        <option key={shift} value={shift}>{shift.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Quantity Produced</label>
                                <input
                                    type="number"
                                    value={productionQuantity}
                                    onChange={(e) => setProductionQuantity(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                    required
                                    min="0"
                                />
                            </div>
                            
                            <div className="flex space-x-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                                >
                                    Submit Production
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowProductionModal(false);
                                        setProductionQuantity('');
                                        setSelectedProduct('');
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperatorDashboard;
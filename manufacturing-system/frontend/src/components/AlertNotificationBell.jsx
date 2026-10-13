import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { getCurrentUser, getBaseServerUrl } from '../services/api';
import { playAlertSound } from '../utils/sound';

const AlertNotificationBell = ({ onAlert }) => {
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const user = getCurrentUser();

    // Prune alerts older than 5 minutes every 15 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const cutoff = Date.now() - 5 * 60 * 1000;
            setAlerts(prev => prev.filter(a => a.receivedAt >= cutoff));
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    // Socket.io connection & listener for machine_stopped_alert
    useEffect(() => {
        // Only owner and manager roles should receive the alert
        if (!user || (user.role !== 'owner' && user.role !== 'manager')) {
            return;
        }

        const socket = io(getBaseServerUrl(), {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10
        });

        socket.on('connect', () => {
            console.log('🔔 AlertNotificationBell connected to Socket.io');
        });

        socket.on('machine_stopped_alert', (data) => {
            console.log('⚠️ machine_stopped_alert received:', data);

            // 1. Play chime / beep sound
            playAlertSound();

            // 2. Display red alert toast
            const machineText = data.machine_code || data.machine_name || 'Machine';
            const reasonText = data.reason || 'Unspecified';
            toast.error(`⚠️ Machine ${machineText} stopped – Reason: ${reasonText}`, {
                duration: 6000,
                style: {
                    background: '#FEF2F2',
                    border: '2px solid #EF4444',
                    color: '#991B1B',
                    fontWeight: '600'
                }
            });

            // 3. Add to recent alerts list
            const newAlert = {
                id: Date.now() + Math.random(),
                machine_code: data.machine_code,
                machine_name: data.machine_name,
                reason: reasonText,
                timestamp: data.timestamp || new Date().toISOString(),
                receivedAt: Date.now()
            };

            setAlerts(prev => [newAlert, ...prev]);

            // 4. Trigger parent dashboard reload callback if provided
            if (typeof onAlert === 'function') {
                onAlert(data);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.role]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Count alerts from the last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const activeAlerts = alerts.filter(a => a.receivedAt >= fiveMinutesAgo);
    const count = activeAlerts.length;

    const getTimeAgo = (receivedAt) => {
        const diffSeconds = Math.floor((Date.now() - receivedAt) / 1000);
        if (diffSeconds < 60) return 'Just now';
        const diffMinutes = Math.floor(diffSeconds / 60);
        return `${diffMinutes}m ago`;
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition focus:outline-none"
                title={`${count} alerts in the last 5 minutes`}
            >
                <span className="text-xl">🔔</span>
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="bg-red-50 px-4 py-3 border-b border-red-100 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <span className="text-red-600 font-bold">⚠️ Machine Alerts</span>
                            <span className="bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                Last 5m
                            </span>
                        </div>
                        {activeAlerts.length > 0 && (
                            <button
                                onClick={() => setAlerts([])}
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                        {activeAlerts.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No machine stoppage alerts in the last 5 minutes
                            </div>
                        ) : (
                            activeAlerts.map(alert => (
                                <div key={alert.id} className="p-3 hover:bg-gray-50 transition">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-gray-900 text-sm">
                                            {alert.machine_code} ({alert.machine_name || 'Machine'})
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">
                                            {getTimeAgo(alert.receivedAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-red-600 mt-1">
                                        <span className="font-semibold">Reason:</span> {alert.reason}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertNotificationBell;

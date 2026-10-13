import React, { useState, useEffect } from 'react';
import { getMostStoppedMachinesReport } from '../services/api';
import toast from 'react-hot-toast';

const MostStoppedMachines = ({ refreshTrigger }) => {
    const [range, setRange] = useState('1month');
    const [sortBy, setSortBy] = useState('count');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        most_stopped_machine: null,
        machines: []
    });

    const filterOptions = [
        { label: 'Today', value: 'today' },
        { label: 'Last 1 Month', value: '1month' },
        { label: 'Last 6 Months', value: '6months' },
        { label: 'All Time', value: 'all' }
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getMostStoppedMachinesReport(range, sortBy);
            if (res.success) {
                setData({
                    most_stopped_machine: res.most_stopped_machine,
                    machines: res.machines || []
                });
            } else {
                toast.error(res.error || 'Failed to fetch stoppage analysis');
            }
        } catch (error) {
            console.error('Error fetching most stopped machines:', error);
            if (error.response?.status !== 403) {
                toast.error('Failed to load machine stoppage report');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [range, sortBy, refreshTrigger]);

    // Format minutes into "X mins (Yh Zm)"
    const formatDuration = (mins) => {
        const m = parseInt(mins) || 0;
        const hours = Math.floor(m / 60);
        const remainder = m % 60;
        if (hours === 0) {
            return `${m} mins`;
        }
        return `${m} mins (${hours}h ${remainder > 0 ? remainder + 'm' : ''})`.replace(' )', ')');
    };

    const mostStopped = data.most_stopped_machine;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-gray-100 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span>🛑</span>
                        <span>Machine Stoppage Analysis (Most Stopped Machines)</span>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Identify which machines stop most frequently, reasons behind failures, and total downtime
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Time Filters */}
                    <div className="flex items-center bg-gray-100 p-1.5 rounded-xl gap-1">
                        {filterOptions.map(opt => {
                            const isActive = range === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setRange(opt.value)}
                                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                                        isActive
                                            ? 'bg-white text-blue-700 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setSortBy('count')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                sortBy === 'count'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Sort: Stop Count
                        </button>
                        <button
                            onClick={() => setSortBy('duration')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                                sortBy === 'duration'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Sort: Stop Time
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-14 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-3"></div>
                    <p className="text-gray-500 font-medium">Analyzing machine stoppages...</p>
                </div>
            ) : data.machines.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 my-6">
                    🟢 No machine stoppages recorded for this period.
                </div>
            ) : (
                <>
                    {/* Top Machine Highlight Banner */}
                    {mostStopped && (
                        <div className="my-6 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-orange-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold shadow-md flex-shrink-0">
                                        ⚠️
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-orange-600 text-white text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                                #1 Most Critical Stoppage
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium">
                                                Machine ID: #{mostStopped.machine_id}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 mt-1">
                                            {mostStopped.machine_code} — {mostStopped.machine_name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Primary Stoppage Reason: <span className="font-bold text-red-600">{mostStopped.primary_reason}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 flex-shrink-0 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-orange-200">
                                    <div>
                                        <p className="text-xs uppercase font-bold text-gray-500">Stoppage Count</p>
                                        <p className="text-2xl font-black text-orange-600">
                                            {mostStopped.stop_count} <span className="text-sm font-semibold text-gray-600">stops</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase font-bold text-gray-500">Total Stop Time</p>
                                        <p className="text-2xl font-black text-red-600">
                                            {mostStopped.total_stop_time_minutes} <span className="text-sm font-semibold text-gray-600">mins</span>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {((mostStopped.total_stop_time_minutes || 0) / 60).toFixed(1)} hrs
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Reasons breakdown chips */}
                            {mostStopped.reasons_summary && mostStopped.reasons_summary.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-orange-200/60 flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-bold text-gray-700">Reason Breakdown:</span>
                                    {mostStopped.reasons_summary.map((r, i) => (
                                        <span
                                            key={i}
                                            className="inline-flex items-center gap-1.5 text-xs bg-white text-gray-800 px-3 py-1 rounded-full border border-orange-200 font-medium shadow-sm"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                            <span className="font-semibold">{r.reason}</span>
                                            <span className="text-gray-500">({r.count}x · {r.duration}m)</span>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stoppage Ranking Table */}
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-base font-bold text-gray-800">
                                Stoppage Breakdown for All Impacted Machines
                            </h3>
                            <span className="text-xs text-gray-500">
                                Showing {data.machines.length} machine{data.machines.length === 1 ? '' : 's'}
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                            <table className="w-full text-left divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-16 text-center">
                                            Rank
                                        </th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Machine Code & Name
                                        </th>
                                        <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Times Stopped
                                        </th>
                                        <th className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Total Stop Time
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            Primary Reason
                                        </th>
                                        <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            All Reported Reasons
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {data.machines.map((machine, index) => {
                                        const isTop = index === 0;
                                        return (
                                            <tr key={machine.machine_id} className={`hover:bg-orange-50/30 transition ${isTop ? 'bg-orange-50/20' : ''}`}>
                                                <td className="px-5 py-4 whitespace-nowrap text-center font-bold text-sm">
                                                    {index === 0 ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs">
                                                            1
                                                        </span>
                                                    ) : index === 1 ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-400 text-white text-xs">
                                                            2
                                                        </span>
                                                    ) : index === 2 ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-white text-xs">
                                                            3
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">#{index + 1}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="bg-gray-100 text-gray-900 px-2.5 py-1 rounded-md text-xs font-mono font-bold">
                                                            {machine.machine_code}
                                                        </span>
                                                        <span className="font-semibold text-gray-800 text-sm">
                                                            {machine.machine_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                                                        {machine.stop_count} {machine.stop_count === 1 ? 'stop' : 'stops'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className="font-bold text-red-700 text-sm">
                                                        {formatDuration(machine.total_stop_time_minutes)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                                        {machine.primary_reason}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1.5 max-w-md">
                                                        {machine.reasons_summary && machine.reasons_summary.map((r, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium border border-gray-200"
                                                            >
                                                                {r.reason} ({r.count}x · {r.duration}m)
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MostStoppedMachines;

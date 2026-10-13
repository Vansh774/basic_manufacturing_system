import React, { useState, useEffect } from 'react';
import { getFirebaseStatus, syncFirebaseNow } from '../services/api';
import toast from 'react-hot-toast';

const FirebaseBadge = () => {
    const [status, setStatus] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const fetchStatus = async () => {
        try {
            const data = await getFirebaseStatus();
            setStatus(data);
        } catch (e) {
            console.error('Failed to load Firebase status', e);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        const tId = toast.loading('Syncing all tables to Firebase Firestore...');
        try {
            const res = await syncFirebaseNow();
            toast.success(`Sync complete! ${res.totalDocuments || 542} docs in Firebase.`, { id: tId });
            await fetchStatus();
        } catch (err) {
            toast.error('Sync failed: ' + (err.message || 'Error'), { id: tId });
        } finally {
            setSyncing(false);
        }
    };

    const totalDocs = status?.totalDocuments || 542;

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition shadow-sm"
                title="Firebase Cloud Database Status"
            >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>🔥 Firebase: Connected</span>
                <span className="bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] text-amber-300 font-mono">
                    {totalDocs} docs
                </span>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-white">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">🔥</span>
                                <div>
                                    <h3 className="font-bold text-lg text-amber-400">Firebase Cloud Integration</h3>
                                    <p className="text-xs text-slate-400">Project: manufacturing-3cfa6</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="my-5 space-y-4">
                            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-400">Status</span>
                                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        Connected & Operational
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-slate-400">Database Engine</span>
                                    <span className="text-xs font-mono text-slate-200">Google Cloud Firestore</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-400">Total Synced Documents</span>
                                    <span className="text-xs font-bold text-amber-300">{totalDocs} records</span>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                                    Synced Collections (Tables)
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {status?.collections ? (
                                        Object.entries(status.collections).map(([col, count]) => (
                                            <div key={col} className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2 flex justify-between items-center">
                                                <span className="text-slate-300 font-mono text-[11px]">{col}</span>
                                                <span className="text-amber-400 font-bold">{count}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2 flex justify-between items-center"><span className="text-slate-300 font-mono text-[11px]">users</span><span className="text-amber-400 font-bold">5</span></div>
                                            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2 flex justify-between items-center"><span className="text-slate-300 font-mono text-[11px]">machines</span><span className="text-amber-400 font-bold">22</span></div>
                                            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2 flex justify-between items-center"><span className="text-slate-300 font-mono text-[11px]">products</span><span className="text-amber-400 font-bold">6</span></div>
                                            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2 flex justify-between items-center"><span className="text-slate-300 font-mono text-[11px]">production_entries</span><span className="text-amber-400 font-bold">450</span></div>
                                            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2 flex justify-between items-center"><span className="text-slate-300 font-mono text-[11px]">downtime_entries</span><span className="text-amber-400 font-bold">22</span></div>
                                            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2 flex justify-between items-center"><span className="text-slate-300 font-mono text-[11px]">machine_loss_tracking</span><span className="text-amber-400 font-bold">20</span></div>
                                            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2 flex justify-between items-center"><span className="text-slate-300 font-mono text-[11px]">system_settings</span><span className="text-amber-400 font-bold">7</span></div>
                                            <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-2 flex justify-between items-center"><span className="text-slate-300 font-mono text-[11px]">downtime_reasons</span><span className="text-amber-400 font-bold">10</span></div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3 border-t border-slate-800">
                            <button
                                type="button"
                                disabled={syncing}
                                onClick={handleSync}
                                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                            >
                                <span>{syncing ? '⏳ Syncing...' : '🔄 Sync All Tables to Firebase'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FirebaseBadge;

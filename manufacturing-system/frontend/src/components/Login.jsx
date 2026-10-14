import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getCurrentUser } from '../services/api';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await login(email, password);
            if (response.success) {
                toast.success('Login successful!');
                const user = getCurrentUser();
                // Redirect based on role
                if (user.role === 'owner') {
                    navigate('/owner', { replace: true });
                } else if (user.role === 'manager') {
                    navigate('/manager', { replace: true });
                } else {
                    navigate('/operator', { replace: true });
                }
            } else {
                toast.error(response.error || 'Login failed');
            }
        } catch (error) {
            const msg = error.response?.data?.error || error.response?.data?.details || error.message || 'Invalid credentials';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Manufacturing System</h1>
                    <p className="text-gray-600 mt-2">Production Management Dashboard</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="owner@factory.com"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="mt-6 pt-5 border-t border-gray-200">
                    <p className="text-center text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Quick Demo Login (Tap to Fill)</p>
                    <div className="grid grid-cols-3 gap-2">
                        <button
                            type="button"
                            onClick={() => { setEmail('owner@factory.com'); setPassword('temp123'); }}
                            className="py-2 px-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 text-center transition"
                        >
                            👑 Owner
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEmail('manager@factory.com'); setPassword('temp123'); }}
                            className="py-2 px-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 text-center transition"
                        >
                            👔 Manager
                        </button>
                        <button
                            type="button"
                            onClick={() => { setEmail('operator1@factory.com'); setPassword('temp123'); }}
                            className="py-2 px-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 text-center transition"
                        >
                            ⚙️ Operator
                        </button>
                    </div>

                    <div className="mt-4 pt-3 text-center border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => {
                                const current = localStorage.getItem('api_server_url') || 'http://localhost:5000';
                                const input = prompt('Enter Backend Server URL (e.g. http://192.168.1.100:5000 or http://localhost:5000):', current);
                                if (input !== null && input.trim()) {
                                    localStorage.setItem('api_server_url', input.trim());
                                    toast.success('Server URL updated! Reloading...');
                                    setTimeout(() => window.location.reload(), 500);
                                }
                            }}
                            className="text-xs text-gray-500 hover:text-blue-600 transition inline-flex items-center gap-1 font-mono"
                        >
                            <span>⚙️ Backend: {localStorage.getItem('api_server_url') || 'http://localhost:5000'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
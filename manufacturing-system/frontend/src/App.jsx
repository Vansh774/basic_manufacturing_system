import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import OperatorDashboard from './components/OperatorDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import ProfitLossReport from './components/ProfitLossReport';
import DailyBreakdown from './components/DailyBreakdown';
import { getCurrentUser } from './services/api';
import './index.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                    <p className="text-sm text-slate-400 max-w-sm mb-4">{this.state.error?.message || 'Application error'}</p>
                    <button 
                        onClick={() => { localStorage.clear(); window.location.hash = '#/login'; window.location.reload(); }} 
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-blue-500 transition">
                        Reset & Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const PrivateRoute = ({ children, allowedRoles }) => {
    const user = getCurrentUser();
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

function App() {
    return (
        <ErrorBoundary>
            <Router>
                <Toaster position="top-right" />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/operator" element={
                        <PrivateRoute allowedRoles={['operator']}>
                            <OperatorDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/manager" element={
                        <PrivateRoute allowedRoles={['manager']}>
                            <ManagerDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/owner" element={
                        <PrivateRoute allowedRoles={['owner']}>
                            <OwnerDashboard />
                        </PrivateRoute>
                    } />
                    <Route path="/reports" element={
                        <PrivateRoute allowedRoles={['owner']}>
                            <ProfitLossReport />
                        </PrivateRoute>
                    } />
                    <Route path="/daily-breakdown" element={
                        <PrivateRoute allowedRoles={['owner']}>
                            <DailyBreakdown />
                        </PrivateRoute>
                    } />
                    <Route path="/daily-breakdown/:date" element={
                        <PrivateRoute allowedRoles={['owner']}>
                            <DailyBreakdown />
                        </PrivateRoute>
                    } />
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/index.html" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Router>
        </ErrorBoundary>
    );
}

export default App;
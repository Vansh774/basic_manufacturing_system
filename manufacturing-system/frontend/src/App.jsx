import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import OperatorDashboard from './components/OperatorDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import ProfitLossReport from './components/ProfitLossReport';
import DailyBreakdown from './components/DailyBreakdown';
import { getCurrentUser } from './services/api';
import './index.css';

const PrivateRoute = ({ children, allowedRoles }) => {
    const user = getCurrentUser();
    
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/login" />;
    }
    
    return children;
};

function App() {
    return (
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
                <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);



// Auth functions
export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        return JSON.parse(userStr);
    }
    return null;
};

// Machine functions
export const getMachines = async () => {
    const response = await api.get('/machines');
    return response.data;
};

export const getMachineStats = async () => {
    const response = await api.get('/machines/stats');
    return response.data;
};

export const updateMachineStatus = async (id, status, reason = null) => {
    try {
        console.log('Updating machine status:', { id, status, reason });
        const response = await api.put(`/machines/${id}/status`, { status, reason });
        console.log('Status update response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Status update error:', error.response?.data || error.message);
        throw error;
    }
};

// Production functions
export const addProductionEntry = async (data) => {
    try {
        const response = await api.post('/production', data);
        return response.data;
    } catch (error) {
        console.error('API Error:', error.response?.data);
        throw error;
    }
};

export const getTodayProduction = async () => {
    const response = await api.get('/production/today');
    return response.data;
};

export const getProductionByDate = async (date) => {
    const response = await api.get(`/production/date/${date}`);
    return response.data;
};

export const getShiftProductivity = async (date) => {
    const response = await api.get(`/production/shift/${date}`);
    return response.data;
};

// Downtime functions
export const reportDowntime = async (data) => {
    const response = await api.post('/downtime', data);
    return response.data;
};

export const getOpenDowntime = async () => {
    const response = await api.get('/downtime/open');
    return response.data;
};

export const resolveDowntime = async (id) => {
    const response = await api.put(`/downtime/${id}/resolve`);
    return response.data;
};

export const getLossAnalytics = async () => {
    const response = await api.get('/machines/loss-analytics');
    return response.data;
};

export const getTopLossReasons = async () => {
    const response = await api.get('/machines/top-loss-reasons');
    return response.data;
};

// Profit & Loss Reports
export const getProfitLossSummary = async (periodType, year, month = null) => {
    let url = `/profit-loss/summary?periodType=${periodType}&year=${year}`;
    if (month) {
        url += `&month=${month}`;
    }
    const response = await api.get(url);
    return response.data;
};

export const getDailyReport = async (startDate, endDate) => {
    try {
        const response = await api.get(`/profit-loss/daily?startDate=${startDate}&endDate=${endDate}`);
        console.log('Daily report API response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error in getDailyReport:', error);
        throw error;
    }
};

export const getMonthlyReport = async (year, month) => {
    const response = await api.get(`/profit-loss/monthly/${year}/${month}`);
    return response.data;
};

export const getYearlyReport = async (year) => {
    const response = await api.get(`/profit-loss/yearly/${year}`);
    return response.data;
};

export const getSettings = async () => {
    const response = await api.get('/settings');
    return response.data;
};

export const updateSettings = async (settings) => {
    try {
        console.log('Updating settings:', settings);
        const response = await api.put('/settings', { settings });
        console.log('Update response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Update settings error:', error.response?.data || error.message);
        throw error;
    }
};

export default api;
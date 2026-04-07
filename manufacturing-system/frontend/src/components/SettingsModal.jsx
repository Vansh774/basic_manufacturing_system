import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/api';
import toast from 'react-hot-toast';

const SettingsModal = ({ onClose, onSettingsSaved }) => {
    const [settings, setSettings] = useState({
        unit_price: '4000',
        loss_per_minute: '333.33',
        production_rate_default: '500'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            console.log('Loading settings...');
            const response = await getSettings();
            console.log('Settings response:', response);
            
            if (response.success && response.settings) {
                setSettings({
                    unit_price: response.settings.unit_price || '4000',
                    loss_per_minute: response.settings.loss_per_minute || '333.33',
                    production_rate_default: response.settings.production_rate_default || '500'
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Failed to load settings: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            console.log('Saving settings:', settings);
            const response = await updateSettings(settings);
            console.log('Save response:', response);
            
            if (response.success) {
                toast.success('Settings saved successfully');
                if (onSettingsSaved) onSettingsSaved();
                onClose();
            } else {
                toast.error(response.error || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Failed to save settings: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                
                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Unit Price (₹)</label>
                            <input
                                type="number"
                                value={settings.unit_price}
                                onChange={(e) => setSettings({...settings, unit_price: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Price per unit in INR</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Loss per Minute (₹)</label>
                            <input
                                type="number"
                                value={settings.loss_per_minute}
                                onChange={(e) => setSettings({...settings, loss_per_minute: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Loss amount per minute of downtime</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium mb-1">Default Production Rate (units/hour)</label>
                            <input
                                type="number"
                                value={settings.production_rate_default}
                                onChange={(e) => setSettings({...settings, production_rate_default: e.target.value})}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                            <p className="text-xs text-gray-500 mt-1">Default production rate for new machines</p>
                        </div>
                        
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsModal;
import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/api';
import toast from 'react-hot-toast';

const AlertSettings = () => {
    const [settings, setSettings] = useState({
        enable_whatsapp_alerts: 'false',
        enable_sms_alerts: 'false',
        whatsapp_number: '',
        sms_number: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await getSettings();
            if (response.success) {
                setSettings({
                    enable_whatsapp_alerts: response.settings.enable_whatsapp_alerts || 'false',
                    enable_sms_alerts: response.settings.enable_sms_alerts || 'false',
                    whatsapp_number: response.settings.whatsapp_number || '',
                    sms_number: response.settings.sms_number || ''
                });
            }
        } catch (error) {
            toast.error('Failed to load alert settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings(settings);
            toast.success('Alert settings saved successfully');
        } catch (error) {
            toast.error('Failed to save alert settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📱 Alert Settings</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">WhatsApp Alerts</p>
                        <p className="text-sm text-gray-500">Receive downtime alerts on WhatsApp</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.enable_whatsapp_alerts === 'true'}
                            onChange={(e) => setSettings({...settings, enable_whatsapp_alerts: e.target.checked ? 'true' : 'false'})}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                {settings.enable_whatsapp_alerts === 'true' && (
                    <div>
                        <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                        <input
                            type="tel"
                            value={settings.whatsapp_number}
                            onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})}
                            placeholder="+91XXXXXXXXXX"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +91 for India)</p>
                    </div>
                )}
                
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">SMS Alerts</p>
                        <p className="text-sm text-gray-500">Receive SMS alerts for downtime</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.enable_sms_alerts === 'true'}
                            onChange={(e) => setSettings({...settings, enable_sms_alerts: e.target.checked ? 'true' : 'false'})}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                {settings.enable_sms_alerts === 'true' && (
                    <div>
                        <label className="block text-sm font-medium mb-1">SMS Number</label>
                        <input
                            type="tel"
                            value={settings.sms_number}
                            onChange={(e) => setSettings({...settings, sms_number: e.target.value})}
                            placeholder="+91XXXXXXXXXX"
                            className="w-full px-3 py-2 border rounded-lg"
                        />
                        <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +91 for India)</p>
                    </div>
                )}
                
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Alert Settings'}
                </button>
            </div>
        </div>
    );
};

export default AlertSettings;
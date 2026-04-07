import React, { useState, useEffect } from 'react';
import { getProductionByDate } from '../services/api';

const OperatorRanking = () => {
    const [operators, setOperators] = useState([]);

    useEffect(() => {
        fetchProductionData();
    }, []);

    const fetchProductionData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await getProductionByDate(today);
            if (response.success && response.entries) {
                const operatorMap = new Map();
                response.entries.forEach(entry => {
                    const operatorName = entry.operator_name;
                    if (operatorMap.has(operatorName)) {
                        operatorMap.set(operatorName, operatorMap.get(operatorName) + entry.quantity);
                    } else {
                        operatorMap.set(operatorName, entry.quantity);
                    }
                });
                const operatorList = Array.from(operatorMap.entries()).map(([name, quantity]) => ({
                    name,
                    quantity
                })).sort((a, b) => b.quantity - a.quantity);
                setOperators(operatorList);
            }
        } catch (error) {
            console.error('Error fetching operator data:', error);
        }
    };

    if (operators.length === 0) return null;

    const topOperator = operators[0];
    const bottomOperator = operators[operators.length - 1];

    return (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Operator Performance Ranking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                    <p className="text-sm text-gray-600">🥇 Top Operator</p>
                    <p className="text-2xl font-bold text-green-700">{topOperator?.name}</p>
                    <p className="text-lg font-semibold">{topOperator?.quantity.toLocaleString()} units today</p>
                </div>
                {bottomOperator && bottomOperator.name !== topOperator?.name && (
                    <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                        <p className="text-sm text-gray-600">📉 Needs Improvement</p>
                        <p className="text-2xl font-bold text-red-700">{bottomOperator?.name}</p>
                        <p className="text-lg font-semibold">{bottomOperator?.quantity.toLocaleString()} units today</p>
                    </div>
                )}
            </div>
            <div className="mt-4">
                <div className="space-y-2">
                    {operators.map((op, idx) => (
                        <div key={op.name} className="flex items-center gap-3">
                            <div className="w-8 text-center font-bold">{idx + 1}</div>
                            <div className="flex-1">
                                <div className="flex justify-between text-sm">
                                    <span>{op.name}</span>
                                    <span>{op.quantity.toLocaleString()} units</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${(op.quantity / operators[0].quantity) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OperatorRanking;
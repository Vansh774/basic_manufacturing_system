import React, { useState, useEffect } from 'react';

const ROICalculator = ({ totalLossValue }) => {
    const [monthlyLoss, setMonthlyLoss] = useState(0);
    const [potentialSavings, setPotentialSavings] = useState(0);

    useEffect(() => {
        const estimatedMonthlyLoss = totalLossValue * 30;
        setMonthlyLoss(estimatedMonthlyLoss);
        setPotentialSavings(estimatedMonthlyLoss * 0.2);
    }, [totalLossValue]);

    if (totalLossValue === 0) return null;

    return (
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">💰 Return on Investment (ROI)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-white text-sm">Monthly Loss</p>
                    <p className="text-2xl font-bold text-white">₹{monthlyLoss.toLocaleString()}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-white text-sm">With Our System (20% reduction)</p>
                    <p className="text-2xl font-bold text-green-300">₹{potentialSavings.toLocaleString()}</p>
                    <p className="text-white text-xs">saved per month</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-white text-sm">Annual Savings</p>
                    <p className="text-2xl font-bold text-green-300">₹{(potentialSavings * 12).toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
};

export default ROICalculator;
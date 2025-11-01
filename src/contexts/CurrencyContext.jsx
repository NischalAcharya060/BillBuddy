// src/contexts/CurrencyContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CurrencyContext = createContext();

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('USD');

    // Load currency settings on app start
    useEffect(() => {
        loadCurrencySettings();
    }, []);

    const loadCurrencySettings = async () => {
        try {
            const savedCurrency = await AsyncStorage.getItem('currency');
            if (savedCurrency) {
                setCurrency(savedCurrency);
            }
        } catch (error) {
            console.error('Error loading currency settings:', error);
        }
    };

    const updateCurrency = async (newCurrency) => {
        try {
            setCurrency(newCurrency);
            await AsyncStorage.setItem('currency', newCurrency);
        } catch (error) {
            console.error('Error saving currency:', error);
        }
    };

    // Format currency based on selected currency
    const formatCurrency = (amount, options = {}) => {
        const {
            showSymbol = true,
            decimalPlaces = 2,
            compact = false
        } = options;

        if (currency === 'NPR') {
            const formattedAmount = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces,
            }).format(amount);

            return showSymbol ? `Rs ${formattedAmount}` : formattedAmount;
        } else {
            // USD formatting
            return new Intl.NumberFormat('en-US', {
                style: showSymbol ? 'currency' : 'decimal',
                currency: 'USD',
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces,
            }).format(amount);
        }
    };

    const value = {
        currency,
        formatCurrency,
        updateCurrency,
        isNPR: currency === 'NPR',
        symbol: currency === 'NPR' ? 'Rs' : '$'
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
// src/contexts/CurrencyContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CurrencyContext = createContext();

// Supported currencies with symbols and formatting options
const SUPPORTED_CURRENCIES = {
    USD: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        locale: 'en-US'
    },
    NPR: {
        code: 'NPR',
        name: 'Nepalese Rupee',
        symbol: 'Rs',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        locale: 'en-US'
    },
    EUR: {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: '.',
        decimalSeparator: ',',
        locale: 'de-DE' // European format
    },
    GBP: {
        code: 'GBP',
        name: 'British Pound',
        symbol: '£',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        locale: 'en-GB'
    },
    JPY: {
        code: 'JPY',
        name: 'Japanese Yen',
        symbol: '¥',
        symbolPosition: 'before',
        decimalPlaces: 0, // No decimals for JPY
        thousandsSeparator: ',',
        decimalSeparator: '.',
        locale: 'ja-JP'
    },
    CAD: {
        code: 'CAD',
        name: 'Canadian Dollar',
        symbol: 'CA$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        locale: 'en-CA'
    },
    AUD: {
        code: 'AUD',
        name: 'Australian Dollar',
        symbol: 'A$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        locale: 'en-AU'
    },
    INR: {
        code: 'INR',
        name: 'Indian Rupee',
        symbol: '₹',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        locale: 'en-IN'
    },
    CNY: {
        code: 'CNY',
        name: 'Chinese Yuan',
        symbol: '¥',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        locale: 'zh-CN'
    },
    CHF: {
        code: 'CHF',
        name: 'Swiss Franc',
        symbol: 'CHF',
        symbolPosition: 'after',
        decimalPlaces: 2,
        thousandsSeparator: "'",
        decimalSeparator: '.',
        locale: 'de-CH'
    },
    SGD: {
        code: 'SGD',
        name: 'Singapore Dollar',
        symbol: 'S$',
        symbolPosition: 'before',
        decimalPlaces: 2,
        thousandsSeparator: ',',
        decimalSeparator: '.',
        locale: 'en-SG'
    }
};

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
            if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
                setCurrency(savedCurrency);
            }
        } catch (error) {
            console.error('Error loading currency settings:', error);
        }
    };

    const updateCurrency = async (newCurrency) => {
        try {
            if (SUPPORTED_CURRENCIES[newCurrency]) {
                setCurrency(newCurrency);
                await AsyncStorage.setItem('currency', newCurrency);
            } else {
                console.warn(`Unsupported currency: ${newCurrency}`);
            }
        } catch (error) {
            console.error('Error saving currency:', error);
        }
    };

    // Custom formatting function for currencies
    const formatCurrency = (amount, options = {}) => {
        const {
            showSymbol = true,
            decimalPlaces = null,
            compact = false,
            customSymbol = null
        } = options;

        const currencyInfo = SUPPORTED_CURRENCIES[currency];
        if (!currencyInfo) return 'Invalid Currency';

        // Use custom decimal places if provided, otherwise use currency default
        const finalDecimalPlaces = decimalPlaces !== null ? decimalPlaces : currencyInfo.decimalPlaces;

        // Handle compact formatting (e.g., 1.5K, 2.3M)
        if (compact && amount >= 1000) {
            const formats = [
                { value: 1e9, suffix: 'B' },
                { value: 1e6, suffix: 'M' },
                { value: 1e3, suffix: 'K' }
            ];

            const format = formats.find(f => amount >= f.value);
            if (format) {
                const formatted = (amount / format.value).toFixed(1);
                const baseFormatted = `${formatted}${format.suffix}`;
                return showSymbol ? `${currencyInfo.symbol} ${baseFormatted}` : baseFormatted;
            }
        }

        // Standard formatting
        let formattedAmount;

        try {
            formattedAmount = new Intl.NumberFormat(currencyInfo.locale, {
                minimumFractionDigits: finalDecimalPlaces,
                maximumFractionDigits: finalDecimalPlaces,
            }).format(amount);
        } catch (error) {
            // Fallback formatting
            formattedAmount = amount.toLocaleString('en-US', {
                minimumFractionDigits: finalDecimalPlaces,
                maximumFractionDigits: finalDecimalPlaces,
            });
        }

        // Add symbol
        if (showSymbol) {
            const symbolToUse = customSymbol || currencyInfo.symbol;
            if (currencyInfo.symbolPosition === 'before') {
                return `${symbolToUse} ${formattedAmount}`;
            } else {
                return `${formattedAmount} ${symbolToUse}`;
            }
        }

        return formattedAmount;
    };

    // Get all supported currencies for dropdowns
    const getSupportedCurrencies = () => {
        return Object.values(SUPPORTED_CURRENCIES);
    };

    // Get current currency info
    const getCurrentCurrencyInfo = () => {
        return SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD;
    };

    // Format for input fields (no symbol, proper decimal places)
    const formatForInput = (amount) => {
        const currencyInfo = getCurrentCurrencyInfo();
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: currencyInfo.decimalPlaces,
            maximumFractionDigits: currencyInfo.decimalPlaces,
        }).format(amount);
    };

    // Parse input to number (handle different decimal separators)
    const parseInput = (input) => {
        if (!input) return 0;

        const currencyInfo = getCurrentCurrencyInfo();
        let cleaned = input.replace(/[^\d.,]/g, ''); // Remove non-numeric except . and ,

        // Handle different decimal separators
        if (currencyInfo.decimalSeparator === ',') {
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
            cleaned = cleaned.replace(/,/g, '');
        }

        return parseFloat(cleaned) || 0;
    };

    const value = {
        currency,
        formatCurrency,
        updateCurrency,
        getSupportedCurrencies,
        getCurrentCurrencyInfo,
        formatForInput,
        parseInput,
        symbol: getCurrentCurrencyInfo().symbol,
        currencyInfo: getCurrentCurrencyInfo(),
        isNPR: currency === 'NPR',
        isUSD: currency === 'USD',
        isEUR: currency === 'EUR',
        isGBP: currency === 'GBP',
        isJPY: currency === 'JPY'
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};
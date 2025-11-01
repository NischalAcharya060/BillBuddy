// src/app/(tabs)/converter.jsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, Alert, Dimensions, ActivityIndicator, Keyboard, Modal } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";

const { width, height } = Dimensions.get('window');

// Theme colors
const lightColors = {
    background: '#f8fafc',
    surface: '#ffffff',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    primary: '#9873fe',
    primaryLight: 'rgba(152, 115, 254, 0.1)',
    gradient: ['#9873fe', '#7a5af5'],
    shadow: '#000',
    disabled: '#F9FAFB',
    danger: '#EF4444',
    success: '#10B981',
};

const darkColors = {
    background: '#0f172a',
    surface: '#1e293b',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#64748b',
    border: '#334155',
    primary: '#a78bfa',
    primaryLight: 'rgba(167, 139, 250, 0.1)',
    gradient: ['#a78bfa', '#8b5cf6'],
    shadow: '#000',
    disabled: '#1e293b',
    danger: '#F87171',
    success: '#34D399',
};

// Supported currencies (major currencies + popular ones) - REMOVED DUPLICATES
const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'NZD',
    'SEK', 'KRW', 'SGD', 'NOK', 'MXN', 'INR', 'RUB', 'ZAR', 'TRY', 'BRL',
    'TWD', 'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP',
    'AED', 'COP', 'SAR', 'MYR', 'RON', 'PEN', 'VND', 'BDT', 'EGP',
    'NPR', 'PKR', 'LKR', 'KES', 'NGN', 'ARS', 'UAH', 'QAR', 'KWD', 'OMR',
    'BHD', 'JOD', 'BTC', 'ETH'
];

const CurrencyConverter = () => {
    const { isDark } = useTheme();
    const { currency: userCurrency, symbol: userSymbol } = useCurrency();
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors, isDark);

    // State management
    const [amount, setAmount] = useState('1');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState(userCurrency?.toUpperCase() || 'USD');
    const [convertedAmount, setConvertedAmount] = useState('');
    const [exchangeRate, setExchangeRate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState('');
    const [showFromDropdown, setShowFromDropdown] = useState(false);
    const [showToDropdown, setShowToDropdown] = useState(false);
    const [exchangeRates, setExchangeRates] = useState(null);

    // Refs
    const amountInputRef = useRef(null);
    const dropdownSearchRef = useRef(null);

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    // Initialize animations and fetch rates
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            })
        ]).start();

        // Fetch exchange rates on component mount
        fetchExchangeRates();
    }, []);

    // Convert when inputs change
    useEffect(() => {
        if (exchangeRates && amount && parseFloat(amount) > 0) {
            convertCurrency();
        }
    }, [amount, fromCurrency, toCurrency, exchangeRates]);

    // Auto-focus search input when dropdown opens
    useEffect(() => {
        if ((showFromDropdown || showToDropdown) && dropdownSearchRef.current) {
            const timer = setTimeout(() => {
                dropdownSearchRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showFromDropdown, showToDropdown]);

    // Fetch exchange rates from the free API
    const fetchExchangeRates = async () => {
        setIsLoading(true);
        try {
            // Try multiple endpoints as per API documentation
            const endpoints = [
                'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json',
                'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json',
                'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
                'https://latest.currency-api.pages.dev/v1/currencies/usd.json',
            ];

            let success = false;
            for (const endpoint of endpoints) {
                try {
                    console.log('Trying endpoint:', endpoint);
                    const response = await fetch(endpoint);

                    if (!response.ok) {
                        console.log(`HTTP ${response.status} for ${endpoint}`);
                        continue;
                    }

                    const text = await response.text();

                    // Check if response is HTML (error page)
                    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                        console.log('HTML response received from', endpoint);
                        continue;
                    }

                    const data = JSON.parse(text);

                    if (data && data.usd) {
                        setExchangeRates(data.usd);
                        setLastUpdated(new Date().toLocaleTimeString());
                        console.log('Successfully fetched rates from:', endpoint);
                        success = true;
                        break;
                    }
                } catch (error) {
                    console.log(`Failed to fetch from ${endpoint}:`, error.message);
                    continue;
                }
            }

            if (!success) {
                throw new Error('All API endpoints failed');
            }
        } catch (error) {
            console.error('Error fetching exchange rates:', error);
            // Use fallback rates
            setExchangeRates(getFallbackRates());
            setLastUpdated(new Date().toLocaleTimeString() + ' (Offline)');
            Alert.alert(
                'Offline Mode',
                'Using fallback exchange rates. Some currencies may not be available.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Convert currency function
    const convertCurrency = () => {
        if (!amount || parseFloat(amount) <= 0) {
            setConvertedAmount('');
            setExchangeRate('');
            Alert.alert('Error', 'Please enter a valid amount');
            return;
        }

        if (!exchangeRates) {
            Alert.alert('Error', 'Exchange rates not loaded yet');
            return;
        }

        const fromRate = exchangeRates[fromCurrency.toLowerCase()];
        const toRate = exchangeRates[toCurrency.toLowerCase()];

        if (!fromRate || !toRate) {
            Alert.alert(
                'Conversion Error',
                `Unable to convert ${fromCurrency} to ${toCurrency}. One or both currencies not supported.`
            );
            setConvertedAmount('');
            setExchangeRate('');
            return;
        }

        // Convert: (amount / fromRate) * toRate
        const amountInUSD = parseFloat(amount) / fromRate;
        const converted = amountInUSD * toRate;
        const directRate = toRate / fromRate;

        setConvertedAmount(converted.toFixed(2));
        setExchangeRate(`1 ${fromCurrency} = ${directRate.toFixed(6)} ${toCurrency}`);
    };

    // Fallback rates for when API is unavailable
    const getFallbackRates = () => {
        return {
            usd: 1,
            eur: 0.86,
            gbp: 0.745,
            jpy: 147.5,
            cad: 1.36,
            aud: 1.48,
            chf: 0.93,
            cny: 7.20,
            hkd: 7.85,
            nzd: 1.65,
            sek: 10.5,
            krw: 1400,
            sgd: 1.35,
            nok: 10.5,
            mxn: 17.5,
            inr: 83.0,
            rub: 95.0,
            zar: 18.5,
            try: 27.0,
            brl: 5.2,
            twd: 32.0,
            dkk: 6.95,
            pln: 3.82,
            thb: 38.0,
            idr: 15800,
            huf: 345,
            czk: 23.0,
            ils: 3.65,
            clp: 860,
            php: 56.0,
            aed: 3.67,
            cop: 3900,
            sar: 3.75,
            myr: 4.80,
            ron: 4.35,
            pen: 3.75,
            vnd: 25000,
            bdt: 109.0,
            egp: 32.0,
            npr: 140.8,
            pkr: 280.0,
            lkr: 320.0,
            kes: 160.0,
            ngn: 1000.0,
            ars: 950.0,
            uah: 40.0,
            qar: 3.65,
            kwd: 0.31,
            omr: 0.38,
            bhd: 0.38,
            jod: 0.71,
            btc: 0.000025,
            eth: 0.00034,
        };
    };

    const swapCurrencies = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
    };

    const getCurrencySymbol = (currencyCode) => {
        const symbols = {
            'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': 'CA$',
            'AUD': 'A$', 'CHF': 'CHF', 'CNY': '¥', 'INR': '₹', 'NPR': 'Rs',
            'BTC': '₿', 'ETH': 'Ξ'
        };
        return symbols[currencyCode] || currencyCode;
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const handleOpenDropdown = (isFrom) => {
        // Dismiss keyboard first
        dismissKeyboard();

        // Then open the appropriate dropdown after a small delay
        setTimeout(() => {
            if (isFrom) {
                setShowFromDropdown(true);
            } else {
                setShowToDropdown(true);
            }
        }, 50);
    };

    const handleCloseDropdown = () => {
        setShowFromDropdown(false);
        setShowToDropdown(false);
        dismissKeyboard();
    };

    const handleCurrencySelect = (currency) => {
        if (showFromDropdown) {
            setFromCurrency(currency);
        } else if (showToDropdown) {
            setToCurrency(currency);
        }
        handleCloseDropdown();
    };

    const CurrencyDropdown = ({ isFrom, selectedCurrency }) => {
        const [searchQuery, setSearchQuery] = useState('');
        const isVisible = isFrom ? showFromDropdown : showToDropdown;

        const filteredCurrencies = currencies.filter(currency =>
            currency.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <Modal
                visible={isVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={handleCloseDropdown}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.dropdownContainer}>
                        {/* Header */}
                        <View style={styles.dropdownHeader}>
                            <Text style={styles.dropdownTitle}>
                                Select {isFrom ? 'From' : 'To'} Currency
                            </Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={handleCloseDropdown}
                            >
                                <Ionicons name="close" size={24} color={colors.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search" size={20} color={colors.textTertiary} />
                            <TextInput
                                ref={dropdownSearchRef}
                                style={styles.searchInput}
                                placeholder="Search currencies..."
                                placeholderTextColor={colors.textTertiary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus={true}
                                returnKeyType="search"
                            />
                            {searchQuery ? (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* Currency List */}
                        <ScrollView
                            style={styles.dropdownScroll}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            {filteredCurrencies.map((currency) => (
                                <TouchableOpacity
                                    key={currency}
                                    style={[
                                        styles.currencyOption,
                                        selectedCurrency === currency && styles.currencyOptionSelected
                                    ]}
                                    onPress={() => handleCurrencySelect(currency)}
                                >
                                    <View style={styles.currencyOptionLeft}>
                                        <LinearGradient
                                            colors={colors.gradient}
                                            style={styles.currencyCodeBadge}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Text style={styles.currencyCodeText}>
                                                {currency}
                                            </Text>
                                        </LinearGradient>
                                        <Text style={styles.currencyName}>{currency}</Text>
                                    </View>
                                    {selectedCurrency === currency && (
                                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    const QuickCurrencyButton = ({ currencyCode }) => (
        <TouchableOpacity
            style={[
                styles.quickCurrencyButton,
                toCurrency === currencyCode && styles.quickCurrencyButtonActive
            ]}
            onPress={() => {
                setToCurrency(currencyCode);
                dismissKeyboard();
            }}
        >
            <Text style={[
                styles.quickCurrencyText,
                toCurrency === currencyCode && styles.quickCurrencyTextActive
            ]}>
                {currencyCode}
            </Text>
        </TouchableOpacity>
    );

    const popularCurrencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'NPR', 'CNY', 'CHF', 'BTC'];

    return (
        <View style={styles.container}>
            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.appDetails}>
                    <LinearGradient
                        colors={colors.gradient}
                        style={styles.appIcon}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="cash-outline" size={40} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.appTitle}>Currency Converter</Text>
                </View>
            </Animated.View>

            {/* Converter Card */}
            <Animated.View
                style={[
                    styles.converterCard,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { scale: scaleAnim }
                        ]
                    }
                ]}
            >
                {/* Amount Input */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Amount</Text>
                    <View style={styles.amountContainer}>
                        <Text style={styles.currencySymbol}>
                            {getCurrencySymbol(fromCurrency)}
                        </Text>
                        <TextInput
                            ref={amountInputRef}
                            style={[styles.input, styles.amountInput]}
                            placeholder="0.00"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={(text) => {
                                const cleaned = text.replace(/[^0-9.]/g, '');
                                // Ensure only one decimal point
                                const parts = cleaned.split('.');
                                if (parts.length <= 2) {
                                    setAmount(cleaned);
                                }
                            }}
                            returnKeyType="done"
                            onSubmitEditing={dismissKeyboard}
                        />
                    </View>
                </View>

                {/* Currency Selection */}
                <View style={styles.currencySelection}>
                    <View style={styles.currencyInput}>
                        <Text style={styles.label}>From</Text>
                        <TouchableOpacity
                            style={styles.currencyButton}
                            onPress={() => handleOpenDropdown(true)}
                        >
                            <LinearGradient
                                colors={colors.gradient}
                                style={styles.currencyBadge}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.currencyBadgeText}>
                                    {fromCurrency}
                                </Text>
                            </LinearGradient>
                            <Text style={styles.currencyButtonText}>{fromCurrency}</Text>
                            <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    {/* Swap Button */}
                    <TouchableOpacity style={styles.swapButton} onPress={() => {
                        swapCurrencies();
                        dismissKeyboard();
                    }}>
                        <LinearGradient
                            colors={colors.gradient}
                            style={styles.swapButtonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="swap-horizontal" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.currencyInput}>
                        <Text style={styles.label}>To</Text>
                        <TouchableOpacity
                            style={styles.currencyButton}
                            onPress={() => handleOpenDropdown(false)}
                        >
                            <LinearGradient
                                colors={colors.gradient}
                                style={styles.currencyBadge}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.currencyBadgeText}>
                                    {toCurrency}
                                </Text>
                            </LinearGradient>
                            <Text style={styles.currencyButtonText}>{toCurrency}</Text>
                            <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Currencies */}
                <View style={styles.quickCurrencies}>
                    <Text style={styles.quickCurrenciesLabel}>Popular Currencies</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.quickCurrenciesContainer}>
                            {popularCurrencies
                                .filter(currency => currency !== fromCurrency)
                                .map(currency => (
                                    <QuickCurrencyButton
                                        key={currency}
                                        currencyCode={currency}
                                    />
                                ))
                            }
                        </View>
                    </ScrollView>
                </View>

                {/* Convert Button */}
                <TouchableOpacity
                    style={styles.convertButton}
                    onPress={() => {
                        convertCurrency();
                        dismissKeyboard();
                    }}
                    disabled={isLoading}
                >
                    <LinearGradient
                        colors={colors.gradient}
                        style={styles.convertButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="swap-horizontal" size={20} color="#fff" />
                        )}
                        <Text style={styles.convertButtonText}>
                            {isLoading ? 'Converting...' : 'Convert'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Result */}
                {convertedAmount && (
                    <View style={styles.resultContainer}>
                        <Text style={styles.resultText}>
                            {amount} {fromCurrency} = {convertedAmount} {toCurrency}
                        </Text>
                        {exchangeRate && (
                            <Text style={styles.exchangeRate}>
                                {exchangeRate}
                            </Text>
                        )}
                        {lastUpdated && (
                            <Text style={styles.lastUpdated}>
                                Last updated: {lastUpdated}
                            </Text>
                        )}
                    </View>
                )}

                {/* Refresh Button */}
                <TouchableOpacity style={styles.refreshButton} onPress={() => {
                    fetchExchangeRates();
                    dismissKeyboard();
                }}>
                    <Ionicons name="refresh" size={16} color={colors.primary} />
                    <Text style={styles.refreshButtonText}>Refresh Rates</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Dropdown Modals */}
            <CurrencyDropdown
                isFrom={true}
                selectedCurrency={fromCurrency}
            />
            <CurrencyDropdown
                isFrom={false}
                selectedCurrency={toCurrency}
            />
        </View>
    );
};

const createStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 16,
    },
    appDetails: {
        alignItems: 'center',
        flexDirection: 'column',
    },
    appIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    appTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    converterCard: {
        flex: 1,
        padding: 20,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 8,
    },
    amountContainer: {
        position: 'relative',
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
        position: 'absolute',
        left: 16,
        top: 16,
        zIndex: 1,
    },
    input: {
        borderWidth: 2,
        borderColor: isDark ? colors.border : '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    amountInput: {
        paddingLeft: 50,
    },
    currencySelection: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 24,
        gap: 12,
    },
    currencyInput: {
        flex: 1,
    },
    currencyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: isDark ? colors.border : '#F3F4F6',
        borderRadius: 12,
        padding: 12,
        backgroundColor: colors.surface,
        gap: 8,
    },
    currencyBadge: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currencyBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    currencyButtonText: {
        flex: 1,
        fontSize: 14,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    swapButton: {
        marginBottom: 12,
    },
    swapButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    quickCurrencies: {
        marginBottom: 24,
    },
    quickCurrenciesLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 12,
    },
    quickCurrenciesContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    quickCurrencyButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    quickCurrencyButtonActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    quickCurrencyText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    quickCurrencyTextActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    convertButton: {
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    convertButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    convertButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    resultContainer: {
        backgroundColor: isDark ? '#1e293b' : '#e5dbff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    resultText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    exchangeRate: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 4,
    },
    lastUpdated: {
        fontSize: 12,
        color: colors.textTertiary,
        textAlign: 'center',
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    refreshButtonText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    dropdownContainer: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        backgroundColor: colors.surface,
        borderRadius: 16,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 2,
        borderColor: colors.border,
    },
    dropdownHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    dropdownScroll: {
        maxHeight: 400,
    },
    currencyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    currencyOptionSelected: {
        backgroundColor: colors.primaryLight,
    },
    currencyOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    currencyCodeBadge: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currencyCodeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    currencyName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
});

export default CurrencyConverter;
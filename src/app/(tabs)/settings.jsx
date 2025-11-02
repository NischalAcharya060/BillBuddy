// src/app/(tabs)/settings.jsx
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Switch,
    Alert,
    ActivityIndicator,
    Modal
} from "react-native";
import React, { useState, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { doc, updateDoc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";

// Theme colors
const lightColors = {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSecondary: '#f9fafb',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    primary: '#6366F1',
    primaryLight: 'rgba(99, 102, 241, 0.1)',
    gradient: ['#6366F1', '#8B5CF6'],
    shadow: '#000',
    disabled: '#F9FAFB',
};

const darkColors = {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#64748b',
    border: '#334155',
    primary: '#818cf8',
    primaryLight: 'rgba(129, 140, 248, 0.1)',
    gradient: ['#818cf8', '#a78bfa'],
    shadow: '#000',
    disabled: '#1e293b',
};

// Create styles based on theme
const createStyles = (isDark) => {
    const colors = isDark ? darkColors : lightColors;

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            padding: 24,
            paddingTop: 60,
            paddingBottom: 16,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        headerContent: {
            alignItems: 'center',
        },
        title: {
            fontSize: 28,
            fontWeight: '800',
            color: colors.textPrimary,
            marginBottom: 4,
        },
        subtitle: {
            fontSize: 16,
            color: colors.textSecondary,
            fontWeight: '500',
        },
        tabNavigation: {
            flexDirection: 'row',
            backgroundColor: colors.surface,
            marginHorizontal: 20,
            marginTop: 20,
            borderRadius: 16,
            padding: 4,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 3,
        },
        tabButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 12,
            gap: 8,
        },
        tabButtonActive: {
            backgroundColor: colors.primaryLight,
        },
        tabButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        tabButtonTextActive: {
            color: colors.primary,
        },
        scrollView: {
            flex: 1,
        },
        tabContent: {
            padding: 20,
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: '800',
            color: colors.textPrimary,
            marginBottom: 20,
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
        input: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 14,
            padding: 16,
            fontSize: 16,
            backgroundColor: colors.surface,
            color: colors.textPrimary,
        },
        disabledInput: {
            backgroundColor: colors.disabled,
            color: colors.textSecondary,
        },
        helperText: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 4,
            marginLeft: 4,
        },
        saveButton: {
            borderRadius: 14,
            overflow: 'hidden',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
            marginTop: 8,
        },
        saveButtonGradient: {
            padding: 18,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
        },
        saveButtonText: {
            fontSize: 16,
            fontWeight: '700',
            color: '#fff',
        },
        settingItem: {
            backgroundColor: colors.surface,
            padding: 20,
            borderRadius: 16,
            marginBottom: 16,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 2,
        },
        settingInfo: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 16,
            gap: 12,
        },
        settingText: {
            flex: 1,
        },
        settingTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 4,
        },
        settingDescription: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        themeOptions: {
            flexDirection: 'row',
            gap: 12,
        },
        themeOption: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: colors.border,
            gap: 8,
        },
        themeOptionActive: {
            borderColor: colors.primary,
            backgroundColor: colors.primaryLight,
        },
        themeOptionText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        themeOptionTextActive: {
            color: colors.primary,
        },
        currencyOptions: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 12,
        },
        currencyOption: {
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceSecondary,
        },
        currencyOptionActive: {
            borderColor: colors.primary,
            backgroundColor: colors.primaryLight,
        },
        currencyOptionText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        currencyOptionTextActive: {
            color: colors.primary,
        },
        fullCurrencyButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceSecondary,
            gap: 8,
        },
        fullCurrencyButtonText: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        preferenceItem: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            padding: 20,
            borderRadius: 16,
            marginBottom: 8,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 2,
            gap: 12,
        },
        preferenceText: {
            flex: 1,
            fontSize: 16,
            fontWeight: '600',
            color: colors.textPrimary,
        },
        preferenceValue: {
            fontSize: 14,
            color: colors.textSecondary,
            marginRight: 8,
        },
        switchContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            padding: 20,
            borderRadius: 16,
            marginBottom: 8,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 2,
        },
        switchText: {
            flex: 1,
        },
        switchTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: 4,
        },
        switchDescription: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
        },
        appInfo: {
            alignItems: 'center',
            padding: 40,
            paddingBottom: 60,
        },
        appVersion: {
            fontSize: 14,
            color: colors.textSecondary,
            fontWeight: '600',
            marginBottom: 4,
        },
        appCopyright: {
            fontSize: 12,
            color: colors.textTertiary,
            textAlign: 'center',
        },
        bottomPadding: {
            height: 30,
        },
        // Modal Styles
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        modalContent: {
            width: '100%',
            maxWidth: 400,
            backgroundColor: colors.surface,
            borderRadius: 20,
            padding: 20,
            maxHeight: '80%',
        },
        modalHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.textPrimary,
        },
        currencyList: {
            maxHeight: 400,
        },
        currencyListItem: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        currencyListText: {
            fontSize: 16,
            color: colors.textPrimary,
            fontWeight: '500',
        },
        currencyListSymbol: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        selectedCurrency: {
            backgroundColor: colors.primaryLight,
        },
    });
};

// Currency Modal Component
const CurrencyModal = ({ visible, onClose, currentCurrency, onCurrencySelect, isDark }) => {
    const styles = createStyles(isDark);
    const { getSupportedCurrencies } = useCurrency();
    const currencies = getSupportedCurrencies();

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Currency</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={isDark ? darkColors.textSecondary : lightColors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.currencyList}>
                        {currencies.map((currency) => (
                            <TouchableOpacity
                                key={currency.code}
                                style={[
                                    styles.currencyListItem,
                                    currentCurrency === currency.code && styles.selectedCurrency
                                ]}
                                onPress={() => {
                                    onCurrencySelect(currency.code);
                                    onClose();
                                }}
                            >
                                <View>
                                    <Text style={styles.currencyListText}>
                                        {currency.name}
                                    </Text>
                                    <Text style={styles.currencyListSymbol}>
                                        {currency.symbol} • {currency.code}
                                    </Text>
                                </View>
                                {currentCurrency === currency.code && (
                                    <Ionicons
                                        name="checkmark"
                                        size={20}
                                        color={isDark ? darkColors.primary : lightColors.primary}
                                    />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// Separate ProfileTab component to prevent re-renders
const ProfileTab = ({ user, onProfileUpdate, isDark }) => {
    const styles = createStyles(isDark);
    const [profileData, setProfileData] = useState({
        displayName: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                displayName: user.displayName || '',
                email: user.email || '',
            });
        }
    }, [user]);

    const handleProfileUpdate = async () => {
        if (!profileData.displayName.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        setLoading(true);
        try {
            await onProfileUpdate(profileData);
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Profile Information</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={isDark ? darkColors.textTertiary : lightColors.textTertiary}
                    value={profileData.displayName}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, displayName: text }))}
                    returnKeyType="done"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                    style={[styles.input, styles.disabledInput]}
                    placeholder="Email address"
                    placeholderTextColor={isDark ? darkColors.textTertiary : lightColors.textTertiary}
                    value={profileData.email}
                    editable={false}
                />
                <Text style={styles.helperText}>
                    Email cannot be changed
                </Text>
            </View>

            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleProfileUpdate}
                disabled={loading}
            >
                <LinearGradient
                    colors={isDark ? darkColors.gradient : lightColors.gradient}
                    style={styles.saveButtonGradient}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

// Separate AppearanceTab component to prevent re-renders
const AppearanceTab = ({ isDark, onThemeChange }) => {
    const styles = createStyles(isDark);
    const { currency, updateCurrency, formatCurrency, getSupportedCurrencies } = useCurrency();
    const [appearance, setAppearance] = useState({
        theme: isDark ? 'dark' : 'light',
        notifications: true,
    });
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);

    // Popular currencies for quick selection
    const popularCurrencies = ['USD', 'EUR', 'GBP', 'NPR', 'JPY', 'CAD'];

    useEffect(() => {
        loadAppearanceSettings();
    }, []);

    const loadAppearanceSettings = async () => {
        try {
            const savedNotifications = await AsyncStorage.getItem('notifications_enabled');
            if (savedNotifications !== null) {
                setAppearance(prev => ({
                    ...prev,
                    notifications: savedNotifications === 'true'
                }));
            }
        } catch (error) {
            console.error('Error loading appearance settings:', error);
        }
    };

    const handleThemeChange = async (theme) => {
        setAppearance(prev => ({ ...prev, theme }));
        try {
            await AsyncStorage.setItem('app_theme', theme);
            onThemeChange(theme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    };

    const handleNotificationsChange = async (value) => {
        setAppearance(prev => ({ ...prev, notifications: value }));
        try {
            await AsyncStorage.setItem('notifications_enabled', value.toString());
        } catch (error) {
            console.error('Error saving notification settings:', error);
        }
    };

    const handleCurrencyChange = async (newCurrency) => {
        await updateCurrency(newCurrency);
    };

    // Update local state when theme changes from outside
    useEffect(() => {
        setAppearance(prev => ({
            ...prev,
            theme: isDark ? 'dark' : 'light'
        }));
    }, [isDark]);

    return (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Appearance</Text>

            <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                    <Ionicons name="moon-outline" size={24} color={isDark ? darkColors.primary : lightColors.primary} />
                    <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>Theme</Text>
                        <Text style={styles.settingDescription}>
                            Choose between light and dark mode
                        </Text>
                    </View>
                </View>
                <View style={styles.themeOptions}>
                    <TouchableOpacity
                        style={[
                            styles.themeOption,
                            appearance.theme === 'light' && styles.themeOptionActive
                        ]}
                        onPress={() => handleThemeChange('light')}
                    >
                        <Ionicons
                            name="sunny"
                            size={20}
                            color={appearance.theme === 'light' ? (isDark ? darkColors.primary : lightColors.primary) : (isDark ? darkColors.textSecondary : lightColors.textSecondary)}
                        />
                        <Text style={[
                            styles.themeOptionText,
                            appearance.theme === 'light' && styles.themeOptionTextActive
                        ]}>
                            Light
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.themeOption,
                            appearance.theme === 'dark' && styles.themeOptionActive
                        ]}
                        onPress={() => handleThemeChange('dark')}
                    >
                        <Ionicons
                            name="moon"
                            size={20}
                            color={appearance.theme === 'dark' ? (isDark ? darkColors.primary : lightColors.primary) : (isDark ? darkColors.textSecondary : lightColors.textSecondary)}
                        />
                        <Text style={[
                            styles.themeOptionText,
                            appearance.theme === 'dark' && styles.themeOptionTextActive
                        ]}>
                            Dark
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                    <Ionicons name="cash-outline" size={24} color={isDark ? darkColors.primary : lightColors.primary} />
                    <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>Currency</Text>
                        <Text style={styles.settingDescription}>
                            Display format for all amounts. Example: {formatCurrency(1000)}
                        </Text>
                    </View>
                </View>

                {/* Quick selection for popular currencies */}
                <View style={styles.currencyOptions}>
                    {popularCurrencies.map((curr) => (
                        <TouchableOpacity
                            key={curr}
                            style={[
                                styles.currencyOption,
                                currency === curr && styles.currencyOptionActive
                            ]}
                            onPress={() => handleCurrencyChange(curr)}
                        >
                            <Text style={[
                                styles.currencyOptionText,
                                currency === curr && styles.currencyOptionTextActive
                            ]}>
                                {curr}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Full currency selection */}
                <TouchableOpacity
                    style={styles.fullCurrencyButton}
                    onPress={() => setShowCurrencyModal(true)}
                >
                    <Text style={styles.fullCurrencyButtonText}>
                        View All Currencies ({getSupportedCurrencies().length})
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={isDark ? darkColors.textSecondary : lightColors.textSecondary} />
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Preferences</Text>

            <View style={styles.switchContainer}>
                <View style={styles.switchText}>
                    <Text style={styles.switchTitle}>Push Notifications</Text>
                    <Text style={styles.switchDescription}>
                        Receive bill reminders and important updates
                    </Text>
                </View>
                <Switch
                    value={appearance.notifications}
                    onValueChange={handleNotificationsChange}
                    trackColor={{ false: isDark ? '#334155' : '#D1D5DB', true: isDark ? '#818cf8' : '#6366F1' }}
                    thumbColor={appearance.notifications ? '#fff' : '#f3f4f6'}
                />
            </View>

            <View style={styles.preferenceItem}>
                <Ionicons name="language-outline" size={20} color={isDark ? darkColors.textSecondary : lightColors.textSecondary} />
                <Text style={styles.preferenceText}>Language</Text>
                <Text style={styles.preferenceValue}>English</Text>
                <Ionicons name="chevron-forward" size={20} color={isDark ? darkColors.textTertiary : lightColors.textTertiary} />
            </View>

            <View style={styles.preferenceItem}>
                <Ionicons name="help-circle-outline" size={20} color={isDark ? darkColors.textSecondary : lightColors.textSecondary} />
                <Text style={styles.preferenceText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={20} color={isDark ? darkColors.textTertiary : lightColors.textTertiary} />
            </View>

            {/* Currency Selection Modal */}
            <CurrencyModal
                visible={showCurrencyModal}
                onClose={() => setShowCurrencyModal(false)}
                currentCurrency={currency}
                onCurrencySelect={handleCurrencyChange}
                isDark={isDark}
            />
        </View>
    );
};

const Settings = () => {
    const { user, updateUserProfile } = useAuth();
    const { isDark, setTheme } = useTheme();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');

    const styles = createStyles(isDark);

    const TabButton = ({ title, icon, isActive, onPress }) => (
        <TouchableOpacity
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={onPress}
        >
            <Ionicons
                name={icon}
                size={20}
                color={isActive ? (isDark ? darkColors.primary : lightColors.primary) : (isDark ? darkColors.textSecondary : lightColors.textSecondary)}
            />
            <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    const handleProfileUpdate = async (profileData) => {
        return await updateUserProfile({
            displayName: profileData.displayName.trim(),
        });
    };

    const handleThemeChange = (theme) => {
        setTheme(theme);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Settings</Text>
                    <Text style={styles.subtitle}>Manage your account preferences</Text>
                </View>
            </View>

            {/* Tab Navigation */}
            <View style={styles.tabNavigation}>
                <TabButton
                    title="Profile"
                    icon="person-outline"
                    isActive={activeTab === 'profile'}
                    onPress={() => setActiveTab('profile')}
                />
                <TabButton
                    title="Appearance"
                    icon="color-palette-outline"
                    isActive={activeTab === 'appearance'}
                    onPress={() => setActiveTab('appearance')}
                />
            </View>

            {/* Tab Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {activeTab === 'profile' ? (
                    <ProfileTab
                        user={user}
                        onProfileUpdate={handleProfileUpdate}
                        isDark={isDark}
                    />
                ) : (
                    <AppearanceTab
                        isDark={isDark}
                        onThemeChange={handleThemeChange}
                    />
                )}

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appVersion}>BillTracker Pro v1.0.0</Text>
                    <Text style={styles.appCopyright}>© 2025 BillTracker Pro. All rights reserved.</Text>
                </View>
            </ScrollView>
            <View style={styles.bottomPadding} />
        </View>
    );
};

export default Settings;
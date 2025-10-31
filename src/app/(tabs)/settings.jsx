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
    ActivityIndicator
} from "react-native";
import React, { useState, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { doc, updateDoc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Separate ProfileTab component to prevent re-renders
const ProfileTab = ({ user, onProfileUpdate }) => {
    const [profileData, setProfileData] = useState({
        displayName: '',
        email: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                displayName: user.displayName || '',
                email: user.email || '',
                phone: user.phoneNumber || '',
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
                    value={profileData.email}
                    editable={false}
                />
                <Text style={styles.helperText}>
                    Email cannot be changed
                </Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    value={profileData.phone}
                    onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                    keyboardType="phone-pad"
                    returnKeyType="done"
                />
            </View>

            <TouchableOpacity
                style={styles.saveButton}
                onPress={handleProfileUpdate}
                disabled={loading}
            >
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
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
const AppearanceTab = () => {
    const [appearance, setAppearance] = useState({
        theme: 'light',
        notifications: true,
        currency: 'USD',
    });

    useEffect(() => {
        loadAppearanceSettings();
    }, []);

    const loadAppearanceSettings = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('app_theme');
            const savedNotifications = await AsyncStorage.getItem('notifications_enabled');
            const savedCurrency = await AsyncStorage.getItem('currency');

            if (savedTheme) {
                setAppearance(prev => ({
                    ...prev,
                    theme: savedTheme
                }));
            }
            if (savedNotifications !== null) {
                setAppearance(prev => ({
                    ...prev,
                    notifications: savedNotifications === 'true'
                }));
            }
            if (savedCurrency) {
                setAppearance(prev => ({
                    ...prev,
                    currency: savedCurrency
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

    const handleCurrencyChange = async (currency) => {
        setAppearance(prev => ({ ...prev, currency }));
        try {
            await AsyncStorage.setItem('currency', currency);
        } catch (error) {
            console.error('Error saving currency:', error);
        }
    };

    return (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Appearance</Text>

            <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                    <Ionicons name="moon-outline" size={24} color="#6366F1" />
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
                            color={appearance.theme === 'light' ? "#6366F1" : "#6B7280"}
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
                            color={appearance.theme === 'dark' ? "#6366F1" : "#6B7280"}
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
                    <Ionicons name="notifications-outline" size={24} color="#6366F1" />
                    <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>Push Notifications</Text>
                        <Text style={styles.settingDescription}>
                            Receive notifications for expenses and settlements
                        </Text>
                    </View>
                </View>
                <Switch
                    value={appearance.notifications}
                    onValueChange={handleNotificationsChange}
                    trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
                    thumbColor={appearance.notifications ? '#6366F1' : '#9CA3AF'}
                />
            </View>

            <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                    <Ionicons name="cash-outline" size={24} color="#6366F1" />
                    <View style={styles.settingText}>
                        <Text style={styles.settingTitle}>Currency</Text>
                        <Text style={styles.settingDescription}>
                            Default currency for expenses
                        </Text>
                    </View>
                </View>
                <View style={styles.currencyOptions}>
                    {['USD', 'NPR'].map((currency) => (
                        <TouchableOpacity
                            key={currency}
                            style={[
                                styles.currencyOption,
                                appearance.currency === currency && styles.currencyOptionActive
                            ]}
                            onPress={() => handleCurrencyChange(currency)}
                        >
                            <Text style={[
                                styles.currencyOptionText,
                                appearance.currency === currency && styles.currencyOptionTextActive
                            ]}>
                                {currency}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <Text style={styles.sectionTitle}>Preferences</Text>

            <View style={styles.preferenceItem}>
                <Ionicons name="language-outline" size={20} color="#6B7280" />
                <Text style={styles.preferenceText}>Language</Text>
                <Text style={styles.preferenceValue}>English</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>

            <View style={styles.preferenceItem}>
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                <Text style={styles.preferenceText}>Privacy & Security</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>

            <View style={styles.preferenceItem}>
                <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.preferenceText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
        </View>
    );
};

const Settings = () => {
    const { user, updateUserProfile } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');

    const TabButton = ({ title, icon, isActive, onPress }) => (
        <TouchableOpacity
            style={[styles.tabButton, isActive && styles.tabButtonActive]}
            onPress={onPress}
        >
            <Ionicons
                name={icon}
                size={20}
                color={isActive ? "#6366F1" : "#6B7280"}
            />
            <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    const handleProfileUpdate = async (profileData) => {
        return await updateUserProfile({
            displayName: profileData.displayName.trim(),
            phone: profileData.phone,
        });
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
                    <ProfileTab user={user} onProfileUpdate={handleProfileUpdate} />
                ) : (
                    <AppearanceTab />
                )}

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appVersion}>BillBuddy v1.0.0</Text>
                    <Text style={styles.appCopyright}>© 2025 BillBuddy App. All rights reserved.</Text>
                </View>
            </ScrollView>
            <View style={styles.bottomPadding} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerContent: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    tabNavigation: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        padding: 4,
        shadowColor: '#000',
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
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    tabButtonTextActive: {
        color: '#6366F1',
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
        color: '#1F2937',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#1F2937',
    },
    disabledInput: {
        backgroundColor: '#F9FAFB',
        color: '#6B7280',
    },
    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
        marginLeft: 4,
    },
    saveButton: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#6366F1',
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
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
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
        color: '#1F2937',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 14,
        color: '#6B7280',
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
        borderColor: '#E5E7EB',
        gap: 8,
    },
    themeOptionActive: {
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
    },
    themeOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    themeOptionTextActive: {
        color: '#6366F1',
    },
    currencyOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    currencyOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    currencyOptionActive: {
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    currencyOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    currencyOptionTextActive: {
        color: '#6366F1',
    },
    preferenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 8,
        shadowColor: '#000',
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
        color: '#374151',
    },
    preferenceValue: {
        fontSize: 14,
        color: '#6B7280',
        marginRight: 8,
    },
    appInfo: {
        alignItems: 'center',
        padding: 40,
        paddingBottom: 60,
    },
    appVersion: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    appCopyright: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    bottomPadding: {
        height: 30,
    },
});

export default Settings;
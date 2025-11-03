// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [expoPushToken, setExpoPushToken] = useState('');

    useEffect(() => {
        loadNotificationSettings();
        setupNotificationHandler();
    }, []);

    const loadNotificationSettings = async () => {
        try {
            const enabled = await AsyncStorage.getItem('notifications_enabled');
            setNotificationsEnabled(enabled === 'true');
        } catch (error) {
            console.error('Error loading notification settings:', error);
        }
    };

    const setupNotificationHandler = () => {
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });
    };

    const requestPermissions = async () => {
        if (!Device.isDevice) {
            alert('Must use physical device for Push Notifications');
            return false;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return false;
        }

        // Get push token
        try {
            const token = (await Notifications.getExpoPushTokenAsync()).data;
            setExpoPushToken(token);
        } catch (error) {
            console.error('Error getting push token:', error);
        }

        return true;
    };

    const toggleNotifications = async (enabled) => {
        setNotificationsEnabled(enabled);
        await AsyncStorage.setItem('notifications_enabled', enabled.toString());

        if (enabled) {
            await requestPermissions();
        } else {
            // Cancel all scheduled notifications
            await Notifications.cancelAllScheduledNotificationsAsync();
        }
    };

    const scheduleBillReminder = async (bill) => {
        if (!notificationsEnabled) return;

        const reminderTime = await AsyncStorage.getItem('reminder_time') || '09:00';
        const [hours, minutes] = reminderTime.split(':').map(Number);

        // Schedule for the due date at the reminder time
        const dueDate = new Date(bill.dueDate);
        dueDate.setHours(hours, minutes, 0, 0);

        // If due date is in the past, schedule for tomorrow
        if (dueDate < new Date()) {
            dueDate.setDate(dueDate.getDate() + 1);
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: `💰 Bill Due: ${bill.name}`,
                body: `Amount: $${bill.amount} - Due today!`,
                data: { billId: bill.id, type: 'bill_reminder' },
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: dueDate,
            },
        });
    };

    const cancelBillReminder = async (billId) => {
        // In a real app, you'd need to track notification IDs
        // For simplicity, we'll cancel all and reschedule remaining
        await Notifications.cancelAllScheduledNotificationsAsync();
    };

    const scheduleTestNotification = async () => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Test Notification",
                body: "This is a test notification from BillTracker Pro!",
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 2,
            },
        });
    };

    const value = {
        notificationsEnabled,
        toggleNotifications,
        requestPermissions,
        scheduleBillReminder,
        cancelBillReminder,
        scheduleTestNotification,
        expoPushToken,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
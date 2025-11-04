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
        registerForPushNotifications();
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

    const registerForPushNotifications = async () => {
        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
            return;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        try {
            const token = (await Notifications.getExpoPushTokenAsync()).data;
            setExpoPushToken(token);
            console.log('Push token:', token);
        } catch (error) {
            console.error('Error getting push token:', error);
        }
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
        if (!notificationsEnabled) {
            console.log('Notifications not enabled, skipping reminder');
            return;
        }

        try {
            // Check if we have permission
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                console.log('No notification permissions');
                return;
            }

            const dueDate = new Date(bill.dueTimestamp);
            const now = new Date();

            // If due date is in the past, don't schedule
            if (dueDate < now) {
                console.log('Due date is in the past, skipping notification');
                return;
            }

            console.log('Scheduling notification for:', dueDate);

            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `💰 Bill Due: ${bill.name}`,
                    body: `Amount: ${bill.amount} - Due today!`,
                    data: {
                        billId: bill.id,
                        type: 'bill_reminder',
                        billName: bill.name,
                        amount: bill.amount
                    },
                    sound: 'default',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: dueDate,
                },
            });

            console.log('Notification scheduled with ID:', notificationId);
            return notificationId;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            throw error;
        }
    };

    const cancelBillReminder = async (billId) => {
        try {
            // In a real app, you'd track specific notification IDs
            // For now, we'll cancel all and let the app reschedule active ones
            const allScheduled = await Notifications.getAllScheduledNotificationsAsync();

            // Find and cancel notifications for this bill
            for (const notification of allScheduled) {
                if (notification.content.data?.billId === billId) {
                    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                    console.log('Cancelled notification for bill:', billId);
                }
            }
        } catch (error) {
            console.error('Error cancelling notification:', error);
        }
    };

    const scheduleTestNotification = async () => {
        try {
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Test Notification",
                    body: "This is a test notification from BillTracker",
                    sound: 'default',
                    data: { test: true },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: 2,
                },
            });
            console.log('Test notification scheduled with ID:', notificationId);
            return notificationId;
        } catch (error) {
            console.error('Error scheduling test notification:', error);
            throw error;
        }
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
// src/app/(tabs)/add.jsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, Alert, Dimensions, Switch, Modal } from "react-native";
import React, { useState, useRef } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useNotifications } from "../../contexts/NotificationContext";
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');

// Theme colors
const lightColors = {
    background: '#f8fafc',
    surface: '#ffffff',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    primary: '#6366F1',
    primaryLight: 'rgba(99, 102, 241, 0.1)',
    gradient: ['#6366F1', '#8B5CF6'],
    shadow: '#000',
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
    primary: '#818cf8',
    primaryLight: 'rgba(129, 140, 248, 0.1)',
    gradient: ['#818cf8', '#a78bfa'],
    shadow: '#000',
    danger: '#F87171',
    success: '#34D399',
};

// Time Picker Modal Component
const TimePickerModal = ({ visible, onClose, currentTime, onTimeSelect, isDark }) => {
    const colors = isDark ? darkColors : lightColors;

    const [selectedTime, setSelectedTime] = useState(() => {
        // Convert current time string to Date object
        const [hours, minutes] = currentTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    });

    const styles = StyleSheet.create({
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
        timePickerContainer: {
            alignItems: 'center',
            marginBottom: 20,
        },
        selectedTimeDisplay: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.primary,
            marginBottom: 20,
        },
        timePeriod: {
            fontSize: 16,
            color: colors.textSecondary,
            fontWeight: '600',
        },
        buttonContainer: {
            flexDirection: 'row',
            gap: 12,
        },
        button: {
            flex: 1,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
        },
        cancelButton: {
            backgroundColor: isDark ? '#334155' : '#F3F4F6',
        },
        saveButton: {
            backgroundColor: colors.primary,
        },
        buttonText: {
            fontSize: 16,
            fontWeight: '600',
        },
        cancelButtonText: {
            color: colors.textPrimary,
        },
        saveButtonText: {
            color: '#fff',
        },
    });

    const handleTimeChange = (event, newTime) => {
        if (newTime) {
            setSelectedTime(newTime);
        }
    };

    const handleSave = () => {
        const hours = selectedTime.getHours().toString().padStart(2, '0');
        const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
        onTimeSelect(`${hours}:${minutes}`);
        onClose();
    };

    const formatTimeDisplay = (date) => {
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes} ${period}`;
    };

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
                        <Text style={styles.modalTitle}>Select Reminder Time</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.timePickerContainer}>
                        <Text style={styles.selectedTimeDisplay}>
                            {formatTimeDisplay(selectedTime)}
                        </Text>
                        <DateTimePicker
                            value={selectedTime}
                            mode="time"
                            display="spinner"
                            onChange={handleTimeChange}
                            themeVariant={isDark ? "dark" : "light"}
                            style={styles.timePicker}
                        />
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleSave}
                        >
                            <Text style={[styles.buttonText, styles.saveButtonText]}>Save Time</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const AddBill = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { currency, formatCurrency } = useCurrency();
    const {
        notificationsEnabled,
        scheduleBillReminder,
        requestPermissions,
    } = useNotifications();
    const router = useRouter();
    const [billName, setBillName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [reminderTime, setReminderTime] = useState('09:00'); // Default reminder time
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [notes, setNotes] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [enableReminders, setEnableReminders] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors, isDark);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    React.useEffect(() => {
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
    }, []);

    // Auto-enable reminders when due date is set (which it always is by default)
    React.useEffect(() => {
        // Always enable reminders if notifications are globally enabled and we have a due date
        if (notificationsEnabled && dueDate) {
            setEnableReminders(true);
        }
    }, [notificationsEnabled, dueDate]);

    const categories = [
        { id: 'electricity', name: 'Electricity', icon: 'flash', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
        { id: 'rent', name: 'Rent', icon: 'home', color: colors.primary, gradient: isDark ? ['#818cf8', '#a78bfa'] : ['#6366F1', '#8B5CF6'] },
        { id: 'wifi', name: 'Wi-Fi', icon: 'wifi', color: '#10B981', gradient: ['#10B981', '#059669'] },
        { id: 'subscriptions', name: 'Subscriptions', icon: 'play', color: '#EC4899', gradient: ['#EC4899', '#DB2777'] },
        { id: 'water', name: 'Water', icon: 'water', color: '#06B6D4', gradient: ['#06B6D4', '#0891B2'] },
        { id: 'gas', name: 'Gas', icon: 'flame', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] },
        { id: 'phone', name: 'Phone', icon: 'call', color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] },
        { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: colors.textTertiary, gradient: isDark ? ['#64748b', '#475569'] : ['#6B7280', '#4B5563'] },
    ];

    const handleAddBill = async () => {
        if (!billName.trim() || !amount || !category) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to add bills.');
            return;
        }

        // Validate amount
        const amountValue = parseFloat(amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
            return;
        }

        setIsLoading(true);

        try {
            // Create due date with reminder time
            const dueDateWithTime = new Date(dueDate);
            const [hours, minutes] = reminderTime.split(':').map(Number);
            dueDateWithTime.setHours(hours, minutes, 0, 0);

            // Check if due date is in the future
            const now = new Date();
            if (dueDateWithTime <= now) {
                Alert.alert('Invalid Date', 'Please select a future date and time for the bill.');
                setIsLoading(false);
                return;
            }

            const billData = {
                name: billName.trim(),
                amount: amountValue,
                category,
                dueDate: dueDate.toISOString().split('T')[0], // Date only for display
                dueTimestamp: dueDateWithTime, // Full timestamp with time for notifications
                reminderTime: reminderTime,
                notes: notes.trim(),
                isRecurring,
                enableReminders: enableReminders && notificationsEnabled, // Only enable if globally enabled
                status: 'pending',
                userId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'bills'), billData);
            console.log('Bill created with ID:', docRef.id);

            let notificationScheduled = false;
            let notificationError = null;

            // Schedule notification if reminders are enabled
            if (enableReminders && notificationsEnabled) {
                try {
                    // Double-check permissions
                    const { status } = await Notifications.getPermissionsAsync();
                    if (status !== 'granted') {
                        console.log('No notification permissions, requesting...');
                        const granted = await requestPermissions();
                        if (!granted) {
                            throw new Error('Notification permissions not granted');
                        }
                    }

                    await scheduleBillReminder({
                        ...billData,
                        id: docRef.id
                    });
                    notificationScheduled = true;
                    console.log('Bill reminder scheduled successfully');
                } catch (notificationError) {
                    console.error('Failed to schedule notification:', notificationError);
                    notificationError = notificationError.message;
                    // Don't fail the entire bill creation if notification fails
                }
            }

            const successMessage = `"${billData.name}" has been added successfully.${
                enableReminders && notificationsEnabled
                    ? notificationScheduled
                        ? `\n\n✅ You'll be reminded on ${formatDate(dueDate)} at ${formatTimeDisplay(reminderTime)}`
                        : `\n\n⚠️ Bill saved but reminder failed: ${notificationError}`
                    : ''
            }`;

            Alert.alert(
                'Success! 🎉',
                successMessage,
                [
                    {
                        text: 'Add Another',
                        onPress: resetForm,
                        style: 'default',
                    },
                    {
                        text: 'View Bills',
                        onPress: () => router.push('/(tabs)/bills'),
                        style: 'cancel',
                    },
                ]
            );
        } catch (error) {
            console.error('Error adding bill: ', error);
            Alert.alert('Error', `Failed to add bill: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setBillName('');
        setAmount('');
        setCategory('');
        setDueDate(new Date());
        setReminderTime('09:00');
        setNotes('');
        setIsRecurring(false);
        setEnableReminders(notificationsEnabled);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTimeDisplay = (timeValue) => {
        const [hours, minutes] = timeValue.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setDueDate(selectedDate);
        }
    };

    const QuickAmountButton = ({ amount: quickAmount }) => (
        <TouchableOpacity
            style={styles.quickAmountButton}
            onPress={() => setAmount(quickAmount.toString())}
        >
            <LinearGradient
                colors={colors.gradient}
                style={styles.quickAmountGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.quickAmountText}>{formatCurrency(quickAmount)}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
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
                <Text style={styles.title}>Add New Bill</Text>
                <Text style={styles.subtitle}>Track your expenses effortlessly</Text>
            </Animated.View>

            {/* Form */}
            <Animated.View
                style={[
                    styles.form,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { scale: scaleAnim }
                        ]
                    }
                ]}
            >
                {/* Bill Name */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                        Bill Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Electricity Bill, Netflix, etc."
                        placeholderTextColor={colors.textTertiary}
                        value={billName}
                        onChangeText={setBillName}
                        maxLength={50}
                    />
                </View>

                {/* Amount */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                        Amount <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.amountContainer}>
                        <TextInput
                            style={[styles.input, styles.amountInput]}
                            placeholder="0.00"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={(text) => {
                                // Allow only numbers and one decimal point
                                const formatted = text.replace(/[^0-9.]/g, '');
                                // Ensure only one decimal point
                                const parts = formatted.split('.');
                                if (parts.length > 2) {
                                    setAmount(parts[0] + '.' + parts.slice(1).join(''));
                                } else {
                                    setAmount(formatted);
                                }
                            }}
                        />
                    </View>

                    {/* Quick Amounts */}
                    <View style={styles.quickAmounts}>
                        <Text style={styles.quickAmountsLabel}>Quick Amounts</Text>
                        <View style={styles.quickAmountsContainer}>
                            {[10, 25, 50, 100].map((quickAmount) => (
                                <QuickAmountButton key={quickAmount} amount={quickAmount} />
                            ))}
                        </View>
                    </View>
                </View>

                {/* Category */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                        Category <Text style={styles.required}>*</Text>
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoriesScroll}
                        contentContainerStyle={styles.categoriesContent}
                    >
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryButton,
                                    category === cat.id && styles.categoryButtonActive
                                ]}
                                onPress={() => setCategory(cat.id)}
                            >
                                <LinearGradient
                                    colors={cat.gradient}
                                    style={[
                                        styles.categoryIcon,
                                        category === cat.id && styles.categoryIconActive
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name={cat.icon} size={18} color="#fff" />
                                </LinearGradient>
                                <Text style={[
                                    styles.categoryText,
                                    category === cat.id && styles.categoryTextActive
                                ]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Due Date */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Due Date</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <LinearGradient
                            colors={colors.gradient}
                            style={styles.dateIcon}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="calendar-outline" size={18} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.dateText}>
                            {formatDate(dueDate)}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={dueDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                            minimumDate={new Date()}
                            themeVariant={isDark ? "dark" : "light"}
                        />
                    )}
                </View>

                {/* Reminder Time */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Reminder Time</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowTimePicker(true)}
                    >
                        <LinearGradient
                            colors={colors.gradient}
                            style={styles.dateIcon}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="time-outline" size={18} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.dateText}>
                            {formatTimeDisplay(reminderTime)}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Recurring Bill */}
                <View style={styles.switchGroup}>
                    <View style={styles.switchLabel}>
                        <LinearGradient
                            colors={colors.gradient}
                            style={styles.switchIcon}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="repeat" size={18} color="#fff" />
                        </LinearGradient>
                        <View>
                            <Text style={styles.switchText}>Recurring Bill</Text>
                            <Text style={styles.switchSubtitle}>
                                {isRecurring ? 'Will repeat monthly' : 'One-time bill'}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.toggle,
                            isRecurring && styles.toggleActive
                        ]}
                        onPress={() => setIsRecurring(!isRecurring)}
                    >
                        <LinearGradient
                            colors={isRecurring ? colors.gradient : isDark ? ['#475569', '#64748b'] : ['#D1D5DB', '#9CA3AF']}
                            style={[
                                styles.toggleCircle,
                                isRecurring && styles.toggleCircleActive
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        />
                    </TouchableOpacity>
                </View>

                {/* Notification Reminders - Always enabled when due date exists */}
                <View style={styles.switchGroup}>
                    <View style={styles.switchLabel}>
                        <LinearGradient
                            colors={enableReminders ? colors.gradient : isDark ? ['#64748b', '#475569'] : ['#9CA3AF', '#6B7280']}
                            style={styles.switchIcon}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons
                                name={enableReminders ? "notifications" : "notifications-off"}
                                size={18}
                                color="#fff"
                            />
                        </LinearGradient>
                        <View>
                            <Text style={styles.switchText}>Enable Reminders</Text>
                            <Text style={styles.switchSubtitle}>
                                {enableReminders ?
                                    `Get reminded on ${formatDate(dueDate)} at ${formatTimeDisplay(reminderTime)}` :
                                    'No reminders for this bill'
                                }
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={enableReminders}
                        onValueChange={setEnableReminders}
                        trackColor={{ false: isDark ? '#334155' : '#D1D5DB', true: isDark ? '#818cf8' : '#6366F1' }}
                        thumbColor={enableReminders ? '#fff' : '#f3f4f6'}
                        disabled={!notificationsEnabled}
                    />
                </View>

                {!notificationsEnabled && (
                    <View style={styles.notificationWarning}>
                        <Ionicons name="information-circle" size={16} color={colors.textSecondary} />
                        <Text style={styles.notificationWarningText}>
                            Enable notifications in Settings to receive bill reminders
                        </Text>
                    </View>
                )}

                {/* Notes */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Notes (Optional)</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Add any additional notes..."
                        placeholderTextColor={colors.textTertiary}
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        maxLength={200}
                    />
                    <Text style={styles.charCount}>
                        {notes.length}/200
                    </Text>
                </View>

                {/* Add Bill Button */}
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleAddBill}
                    disabled={isLoading}
                >
                    <LinearGradient
                        colors={colors.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                    >
                        {isLoading ? (
                            <Ionicons name="refresh" size={22} color="#fff" style={styles.loadingIcon} />
                        ) : (
                            <Ionicons name="add-circle" size={22} color="#fff" />
                        )}
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Adding Bill...' : 'Add Bill'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Time Picker Modal */}
                <TimePickerModal
                    visible={showTimePicker}
                    onClose={() => setShowTimePicker(false)}
                    currentTime={reminderTime}
                    onTimeSelect={setReminderTime}
                    isDark={isDark}
                />
            </Animated.View>
        </ScrollView>
    );
};

const createStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 28,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 12,
    },
    required: {
        color: colors.danger,
    },
    input: {
        borderWidth: 2,
        borderColor: isDark ? colors.border : '#F3F4F6',
        borderRadius: 16,
        padding: 18,
        fontSize: 16,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        fontWeight: '500',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    amountContainer: {
        marginBottom: 16,
    },
    amountInput: {
        // Normal input styling
    },
    quickAmounts: {
        marginTop: 8,
    },
    quickAmountsLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 12,
    },
    quickAmountsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    quickAmountButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    quickAmountGradient: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    quickAmountText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    categoriesScroll: {
        marginHorizontal: -20,
    },
    categoriesContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    categoryButton: {
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: isDark ? colors.border : '#F3F4F6',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        minWidth: 80,
    },
    categoryButtonActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    categoryIconActive: {
        shadowColor: colors.primary,
        shadowOpacity: 0.4,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        textAlign: 'center',
    },
    categoryTextActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: isDark ? colors.border : '#F3F4F6',
        borderRadius: 16,
        padding: 18,
        backgroundColor: colors.surface,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    dateIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    switchGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        padding: 20,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: isDark ? colors.border : '#F3F4F6',
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    switchLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    switchIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    switchText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    switchSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    toggle: {
        width: 56,
        height: 32,
        borderRadius: 16,
        padding: 2,
        justifyContent: 'center',
        backgroundColor: isDark ? colors.surfaceSecondary : '#F3F4F6',
    },
    toggleActive: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    toggleCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    toggleCircleActive: {
        transform: [{ translateX: 24 }],
    },
    notificationWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(156, 163, 175, 0.2)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 28,
        gap: 8,
    },
    notificationWarningText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
        flex: 1,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: colors.textTertiary,
        textAlign: 'right',
        marginTop: 4,
    },
    button: {
        borderRadius: 20,
        marginBottom: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        borderRadius: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    loadingIcon: {
        transform: [{ rotate: '0deg' }],
    },
});

export default AddBill;
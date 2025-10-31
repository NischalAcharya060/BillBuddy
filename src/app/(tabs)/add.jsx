// src/app/(tabs)/add.jsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, Alert, Dimensions } from "react-native";
import React, { useState, useRef } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

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
    disabled: '#F9FAFB',
    danger: '#EF4444',
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
    disabled: '#1e293b',
    danger: '#F87171',
};

const AddBill = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const router = useRouter();
    const [billName, setBillName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [notes, setNotes] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
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

        setIsLoading(true);

        try {
            const billData = {
                name: billName.trim(),
                amount: parseFloat(amount),
                category,
                dueDate: dueDate.toISOString().split('T')[0],
                dueTimestamp: dueDate,
                notes: notes.trim(),
                isRecurring,
                status: 'pending',
                userId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'bills'), billData);

            Alert.alert(
                'Success! 🎉',
                `"${billData.name}" has been added successfully.`,
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
            Alert.alert('Error', 'Failed to add bill. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setBillName('');
        setAmount('');
        setCategory('');
        setDueDate(new Date());
        setNotes('');
        setIsRecurring(false);
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
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
                <Text style={styles.quickAmountText}>${quickAmount}</Text>
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
                    />
                </View>

                {/* Amount */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                        Amount <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.amountContainer}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                            style={[styles.input, styles.amountInput]}
                            placeholder="0.00"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
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
                    >
                        <View style={styles.categoriesContainer}>
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
                        </View>
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
                            display={isDark ? "spinner" : "default"}
                            onChange={onDateChange}
                            themeVariant={isDark ? "dark" : "light"}
                        />
                    )}
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
                            <Text style={styles.switchSubtitle}>Repeat monthly</Text>
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
                    />
                </View>

                {/* Add Bill Button */}
                <TouchableOpacity
                    style={[
                        styles.button,
                        (!billName || !amount || !category || isLoading) && styles.buttonDisabled
                    ]}
                    onPress={handleAddBill}
                    disabled={!billName || !amount || !category || isLoading}
                >
                    <LinearGradient
                        colors={colors.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                    >
                        {isLoading ? (
                            <Ionicons name="refresh" size={22} color="#fff" />
                        ) : (
                            <Ionicons name="add-circle" size={22} color="#fff" />
                        )}
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Adding Bill...' : 'Add Bill'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
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
    currencySymbol: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        position: 'absolute',
        left: 18,
        top: 18,
        zIndex: 1,
    },
    amountInput: {
        paddingLeft: 40,
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
    categoriesContainer: {
        flexDirection: 'row',
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
        marginBottom: 28,
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
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
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
    buttonDisabled: {
        opacity: 0.6,
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
});

export default AddBill;
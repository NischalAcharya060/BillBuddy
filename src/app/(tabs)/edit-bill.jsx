// src/app/(tabs)/edit-bill.jsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, Alert, ActivityIndicator, Dimensions } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";

const { width } = Dimensions.get('window');

const EditBill = () => {
    const { billId } = useLocalSearchParams();
    const router = useRouter();
    const { user } = useAuth();

    const [billName, setBillName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [notes, setNotes] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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
        { id: 'rent', name: 'Rent', icon: 'home', color: '#6366F1', gradient: ['#6366F1', '#8B5CF6'] },
        { id: 'wifi', name: 'Wi-Fi', icon: 'wifi', color: '#10B981', gradient: ['#10B981', '#059669'] },
        { id: 'subscriptions', name: 'Subscriptions', icon: 'play', color: '#EC4899', gradient: ['#EC4899', '#DB2777'] },
        { id: 'water', name: 'Water', icon: 'water', color: '#06B6D4', gradient: ['#06B6D4', '#0891B2'] },
        { id: 'gas', name: 'Gas', icon: 'flame', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] },
        { id: 'phone', name: 'Phone', icon: 'call', color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] },
        { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280', gradient: ['#6B7280', '#4B5563'] },
    ];

    useEffect(() => {
        if (billId) {
            fetchBill();
        }
    }, [billId]);

    const fetchBill = async () => {
        try {
            setIsLoading(true);
            const billDoc = await getDoc(doc(db, 'bills', billId));

            if (billDoc.exists()) {
                const billData = billDoc.data();
                setBillName(billData.name);
                setAmount(billData.amount.toString());
                setCategory(billData.category || 'other');
                setDueDate(billData.dueTimestamp?.toDate() || new Date(billData.dueDate));
                setNotes(billData.notes || '');
                setIsRecurring(billData.isRecurring || false);
            } else {
                Alert.alert('Error', 'Bill not found');
                router.back();
            }
        } catch (error) {
            console.error('Error fetching bill:', error);
            Alert.alert('Error', 'Failed to load bill');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveBill = async () => {
        if (!billName.trim() || !amount || !category) {
            Alert.alert('Missing Information', 'Please fill in all required fields.');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to edit bills.');
            return;
        }

        setIsSaving(true);

        try {
            const billData = {
                name: billName.trim(),
                amount: parseFloat(amount),
                category,
                dueDate: dueDate.toISOString().split('T')[0],
                dueTimestamp: dueDate,
                notes: notes.trim(),
                isRecurring,
                updatedAt: new Date(),
            };

            await updateDoc(doc(db, 'bills', billId), billData);

            Alert.alert(
                'Success! 🎉',
                `"${billData.name}" has been updated successfully.`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error) {
            console.error('Error updating bill: ', error);
            Alert.alert('Error', 'Failed to update bill. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteBill = () => {
        Alert.alert(
            "Delete Bill",
            `Are you sure you want to delete "${billName}"? This action cannot be undone.`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: deleteBill
                }
            ]
        );
    };

    const deleteBill = async () => {
        try {
            await deleteDoc(doc(db, 'bills', billId));
            Alert.alert('Success', 'Bill deleted successfully');
            router.back();
        } catch (error) {
            console.error('Error deleting bill:', error);
            Alert.alert('Error', 'Failed to delete bill. Please try again.');
        }
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
                colors={['#6366F1', '#8B5CF6']}
                style={styles.quickAmountGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.quickAmountText}>${quickAmount}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Loading bill...</Text>
            </View>
        );
    }

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
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.backButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="arrow-back" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Edit Bill</Text>
                    <Text style={styles.subtitle}>Update your bill information</Text>
                </View>
                <View style={styles.headerSpacer} />
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
                        placeholderTextColor="#9CA3AF"
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
                            placeholderTextColor="#9CA3AF"
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
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.dateIcon}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="calendar-outline" size={18} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.dateText}>
                            {formatDate(dueDate)}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker
                            value={dueDate}
                            mode="date"
                            display="default"
                            onChange={onDateChange}
                        />
                    )}
                </View>

                {/* Recurring Bill */}
                <View style={styles.switchGroup}>
                    <View style={styles.switchLabel}>
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
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
                            colors={isRecurring ? ['#6366F1', '#8B5CF6'] : ['#D1D5DB', '#9CA3AF']}
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
                        placeholderTextColor="#9CA3AF"
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[
                        styles.button,
                        (!billName || !amount || !category || isSaving) && styles.buttonDisabled
                    ]}
                    onPress={handleSaveBill}
                    disabled={!billName || !amount || !category || isSaving}
                >
                    <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                    >
                        {isSaving ? (
                            <Ionicons name="refresh" size={22} color="#fff" />
                        ) : (
                            <Ionicons name="save" size={22} color="#fff" />
                        )}
                        <Text style={styles.buttonText}>
                            {isSaving ? 'Saving Changes...' : 'Save Changes'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteBill}
                >
                    <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        style={styles.deleteButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.deleteButtonText}>Delete Bill</Text>
                </TouchableOpacity>
            </Animated.View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        paddingTop: 60,
        paddingBottom: 16,
    },
    backButton: {
        marginRight: 16,
    },
    backButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    headerText: {
        flex: 1,
    },
    headerSpacer: {
        width: 44,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
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
        color: '#374151',
        marginBottom: 12,
    },
    required: {
        color: '#EF4444',
    },
    input: {
        borderWidth: 2,
        borderColor: '#F3F4F6',
        borderRadius: 16,
        padding: 18,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#1F2937',
        fontWeight: '500',
        shadowColor: '#000',
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
        color: '#374151',
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
        color: '#6B7280',
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
        shadowColor: '#6366F1',
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
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    categoryButtonActive: {
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.05)',
        shadowColor: '#6366F1',
        shadowOpacity: 0.2,
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    categoryIconActive: {
        shadowColor: '#6366F1',
        shadowOpacity: 0.4,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    categoryTextActive: {
        color: '#6366F1',
        fontWeight: '700',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F3F4F6',
        borderRadius: 16,
        padding: 18,
        backgroundColor: '#fff',
        shadowColor: '#000',
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
        color: '#1F2937',
        fontWeight: '500',
    },
    switchGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 28,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
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
        color: '#374151',
        marginBottom: 2,
    },
    switchSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    toggle: {
        width: 56,
        height: 32,
        borderRadius: 16,
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    toggleCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        shadowColor: '#000',
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
        marginBottom: 16,
        shadowColor: '#6366F1',
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
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#FEF2F2',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    deleteButtonGradient: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#EF4444',
    },
});

export default EditBill;
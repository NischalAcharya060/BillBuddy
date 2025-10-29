// src/app/(tabs)/edit-bill.jsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, Alert, ActivityIndicator } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";

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

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const categories = [
        { id: 'electricity', name: 'Electricity', icon: 'flash', color: '#F59E0B' },
        { id: 'rent', name: 'Rent', icon: 'home', color: '#6366F1' },
        { id: 'wifi', name: 'Wi-Fi', icon: 'wifi', color: '#10B981' },
        { id: 'subscriptions', name: 'Subscriptions', icon: 'play', color: '#EC4899' },
        { id: 'water', name: 'Water', icon: 'water', color: '#06B6D4' },
        { id: 'gas', name: 'Gas', icon: 'flame', color: '#EF4444' },
        { id: 'phone', name: 'Phone', icon: 'call', color: '#8B5CF6' },
        { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
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

                // Populate form fields
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

            // Update in Firestore
            await updateDoc(doc(db, 'bills', billId), billData);

            Alert.alert(
                'Success!',
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

    const getCategoryColor = () => {
        const selectedCat = categories.find(cat => cat.id === category);
        return selectedCat ? selectedCat.color : '#6366F1';
    };

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
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
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
                        transform: [{ translateY: slideAnim }]
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
                        placeholder="e.g., Electricity Bill, Netflix Subscription"
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
                                        category === cat.id && {
                                            backgroundColor: `${cat.color}20`,
                                            borderColor: cat.color
                                        }
                                    ]}
                                    onPress={() => setCategory(cat.id)}
                                >
                                    <View style={[styles.categoryIcon, { backgroundColor: cat.color }]}>
                                        <Ionicons name={cat.icon} size={16} color="#fff" />
                                    </View>
                                    <Text style={[
                                        styles.categoryText,
                                        category === cat.id && { color: cat.color, fontWeight: '600' }
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
                        <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                        <Text style={styles.dateText}>
                            {formatDate(dueDate)}
                        </Text>
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
                        <Ionicons name="repeat-outline" size={20} color="#6B7280" />
                        <Text style={styles.switchText}>Recurring Bill</Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.toggle,
                            isRecurring && { backgroundColor: getCategoryColor() }
                        ]}
                        onPress={() => setIsRecurring(!isRecurring)}
                    >
                        <View style={[
                            styles.toggleCircle,
                            isRecurring && { transform: [{ translateX: 20 }] }
                        ]} />
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
                        numberOfLines={3}
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
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        {isSaving ? (
                            <Ionicons name="refresh" size={20} color="#fff" />
                        ) : (
                            <Ionicons name="save-outline" size={20} color="#fff" />
                        )}
                        <Text style={styles.buttonText}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Quick Amount Buttons */}
                <View style={styles.quickAmounts}>
                    <Text style={styles.quickAmountsLabel}>Quick Amounts</Text>
                    <View style={styles.quickAmountsContainer}>
                        {[10, 25, 50, 100].map((quickAmount) => (
                            <TouchableOpacity
                                key={quickAmount}
                                style={styles.quickAmountButton}
                                onPress={() => setAmount(quickAmount.toString())}
                            >
                                <Text style={styles.quickAmountText}>${quickAmount}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeleteBill}
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        paddingTop: 60,
        paddingBottom: 10,
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    headerSpacer: {
        width: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    form: {
        padding: 20,
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
    required: {
        color: '#EF4444',
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#1F2937',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginRight: 12,
        marginLeft: 16,
        position: 'absolute',
        zIndex: 1,
    },
    amountInput: {
        paddingLeft: 30,
    },
    categoriesScroll: {
        marginHorizontal: -20,
    },
    categoriesContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 8,
    },
    categoryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
        marginRight: 8,
    },
    categoryIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 6,
    },
    categoryText: {
        fontSize: 14,
        color: '#6B7280',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#fff',
    },
    dateText: {
        fontSize: 16,
        color: '#1F2937',
        marginLeft: 12,
    },
    switchGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    switchLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    switchText: {
        fontSize: 16,
        color: '#374151',
        marginLeft: 8,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#D1D5DB',
        padding: 2,
        justifyContent: 'center',
    },
    toggleCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    textArea: {
        minHeight: 80,
    },
    button: {
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    quickAmounts: {
        marginTop: 8,
        marginBottom: 24,
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
    },
    quickAmountButton: {
        flex: 1,
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    quickAmountText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6366F1',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
        marginTop: 8,
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
        marginLeft: 8,
    },
});

export default EditBill;
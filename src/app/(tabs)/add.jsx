// src/app/(tabs)/add.jsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, Alert } from "react-native";
import React, { useState, useRef } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const AddBill = () => {
    const { user } = useAuth();
    const [billName, setBillName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [notes, setNotes] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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

            // Save to Firestore
            const docRef = await addDoc(collection(db, 'bills'), billData);

            console.log('Bill added with ID: ', docRef.id);

            Alert.alert(
                'Success!',
                `"${billData.name}" has been added successfully.`,
                [
                    {
                        text: 'Add Another',
                        onPress: resetForm,
                        style: 'default',
                    },
                    {
                        text: 'View Bills',
                        onPress: () => console.log('Navigate to bills'),
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

    const getCategoryColor = () => {
        const selectedCat = categories.find(cat => cat.id === category);
        return selectedCat ? selectedCat.color : '#6366F1';
    };

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
                <Text style={styles.title}>Add New Bill</Text>
                <Text style={styles.subtitle}>Track your expenses effortlessly</Text>
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
                        colors={['#6366F1', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.buttonGradient}
                    >
                        {isLoading ? (
                            <Ionicons name="refresh" size={20} color="#fff" />
                        ) : (
                            <Ionicons name="add-circle-outline" size={20} color="#fff" />
                        )}
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Adding...' : 'Add Bill'}
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
            </Animated.View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 20,
        paddingBottom: 10,
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
});

export default AddBill;
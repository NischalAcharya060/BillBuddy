// src/app/(tabs)/add.jsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import React, { useState } from "react";

const AddBill = () => {
    const [billName, setBillName] = useState('');
    const [amount, setAmount] = useState('');

    const handleAddBill = () => {
        // Will implement later
        alert('Add bill functionality coming soon!');
        setBillName('');
        setAmount('');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Add New Bill</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Bill Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Electricity Bill"
                        value={billName}
                        onChangeText={setBillName}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Amount</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                        value={amount}
                        onChangeText={setAmount}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, (!billName || !amount) && styles.buttonDisabled]}
                    onPress={handleAddBill}
                    disabled={!billName || !amount}
                >
                    <Text style={styles.buttonText}>Add Bill</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 20,
    },
    header: {
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#374151',
    },
    form: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9fafb',
    },
    button: {
        backgroundColor: '#6366F1',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddBill;
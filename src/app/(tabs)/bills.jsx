// src/app/(tabs)/bills.jsx
import { View, Text, StyleSheet, FlatList } from "react-native";
import React from "react";

const Bills = () => {
    const bills = []; // Empty for now

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Bills</Text>
            </View>

            {bills.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No bills yet</Text>
                    <Text style={styles.emptySubtext}>
                        Add your first bill to get started!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={bills}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.billItem}>
                            <Text style={styles.billName}>{item.name}</Text>
                            <Text style={styles.billAmount}>${item.amount}</Text>
                        </View>
                    )}
                />
            )}
        </View>
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#374151',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    billItem: {
        backgroundColor: '#fff',
        margin: 16,
        marginVertical: 8,
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    billName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#374151',
    },
    billAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6366F1',
    },
});

export default Bills;
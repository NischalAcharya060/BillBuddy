// src/app/(tabs)/index.jsx
import { View, Text, StyleSheet, ScrollView } from "react-native";
import React from "react";

const Dashboard = () => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Dashboard</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Monthly Summary</Text>
                <Text style={styles.amount}>$0.00</Text>
                <Text style={styles.subtitle}>Total spent this month</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Upcoming Bills</Text>
                <Text style={styles.text}>No upcoming bills</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Recent Activity</Text>
                <Text style={styles.text}>No recent activity</Text>
            </View>
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
        fontSize: 28,
        fontWeight: 'bold',
        color: '#374151',
    },
    card: {
        backgroundColor: '#fff',
        margin: 16,
        marginVertical: 8,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    amount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#6366F1',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    text: {
        fontSize: 16,
        color: '#6b7280',
    },
});

export default Dashboard;
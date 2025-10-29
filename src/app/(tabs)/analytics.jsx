import { View, Text, StyleSheet, ScrollView } from "react-native";
import React from "react";

const Analytics = () => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Analytics</Text>
                <Text style={styles.subtitle}>Track your spending patterns</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.comingSoon}>Analytics Dashboard</Text>
                <Text style={styles.description}>
                    Detailed charts and insights coming soon...
                </Text>
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
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    comingSoon: {
        fontSize: 24,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default Analytics;
// src/app/index.jsx
import { View, Text, StyleSheet, ScrollView } from "react-native";
import React from "react";
import { Link } from "expo-router";

const Home = () => {
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>BillBuddy</Text>
                    <Text style={styles.subtitle}>Track your bills. Split your expenses.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Welcome! 👋</Text>
                    <Text style={styles.cardText}>
                        Get started by adding your first bill or exploring the app features.
                    </Text>

                    <Link href="/(tabs)" style={styles.button}>
                        <Text style={styles.buttonText}>Open BillBuddy</Text>
                    </Link>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#6366F1',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    cardText: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 24,
        lineHeight: 22,
    },
    button: {
        backgroundColor: '#6366F1',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Home;
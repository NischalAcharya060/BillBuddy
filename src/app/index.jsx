// src/app/index.jsx
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity } from "react-native";
import React, { useEffect, useRef } from "react";
import { Link } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const Home = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
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
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const FeatureCard = ({ icon, title, description, color }) => (
        <View style={[styles.featureCard, { borderLeftColor: color }]}>
            <View style={[styles.featureIcon, { backgroundColor: color }]}>
                <Ionicons name={icon} size={20} color="#fff" />
            </View>
            <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDescription}>{description}</Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={styles.background}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={['#fff', '#f0f9ff']}
                            style={styles.logo}
                        >
                            <Text style={styles.logoText}>💰</Text>
                        </LinearGradient>
                    </View>
                    <Text style={styles.title}>BillBuddy</Text>
                    <Text style={styles.subtitle}>Track your bills. Split your expenses. Stay stress-free.</Text>
                </Animated.View>

                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ]
                        }
                    ]}
                >
                    <Text style={styles.cardTitle}>Welcome! 👋</Text>
                    <Text style={styles.cardText}>
                        Take control of your finances with our all-in-one bill management solution.
                        Track expenses, split payments, and get insights into your spending habits.
                    </Text>

                    <View style={styles.featuresContainer}>
                        <FeatureCard
                            icon="document-text-outline"
                            title="Smart Bill Tracking"
                            description="Never miss a payment with automated reminders"
                            color="#10B981"
                        />
                        <FeatureCard
                            icon="pie-chart-outline"
                            title="Expense Analytics"
                            description="Visual insights into your spending patterns"
                            color="#F59E0B"
                        />
                        <FeatureCard
                            icon="people-outline"
                            title="Easy Bill Splitting"
                            description="Split expenses with friends effortlessly"
                            color="#EC4899"
                        />
                    </View>

                    {/* FIXED BUTTON - Remove asChild and use TouchableOpacity */}
                    <Link href="/(tabs)" asChild>
                        <TouchableOpacity>
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>Get Started</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </Link>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.4,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        marginBottom: 20,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    logoText: {
        fontSize: 32,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 22,
    },
    card: {
        backgroundColor: '#fff',
        padding: 28,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    cardText: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 30,
        lineHeight: 24,
    },
    featuresContainer: {
        marginBottom: 30,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 18,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
});

export default Home;
// src/app/index.jsx
import { View, Text, StyleSheet, ScrollView, Animated, Dimensions, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useEffect, useRef } from "react";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../contexts/AuthContext";

const { width, height } = Dimensions.get('window');

const Home = () => {
    const { user, loading } = useAuth();
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        // If user is already logged in, redirect to tabs
        if (user && !loading) {
            router.replace('/(tabs)');
            return;
        }

        // Only run animations if we're not redirecting
        if (!loading) {
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
        }
    }, [user, loading]);

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

    // Show loading indicator while checking auth state
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.loadingBackground}
                />
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Loading BillBuddy...</Text>
            </View>
        );
    }

    // If user exists, we'll redirect in useEffect, but show loading until then
    if (user) {
        return (
            <View style={styles.loadingContainer}>
                <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    style={styles.loadingBackground}
                />
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Welcome back!</Text>
            </View>
        );
    }

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

                    {/* Authentication Buttons */}
                    <View style={styles.authButtons}>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity style={styles.primaryButton}>
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.buttonGradient}
                                >
                                    <Ionicons name="person-add-outline" size={20} color="#fff" />
                                    <Text style={styles.primaryButtonText}>Get Started Free</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </Link>

                        <Link href="/(auth)/login" asChild>
                            <TouchableOpacity style={styles.secondaryButton}>
                                <Ionicons name="log-in-outline" size={20} color="#6366F1" />
                                <Text style={styles.secondaryButtonText}>Sign In</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>

                    {/* Quick Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>10K+</Text>
                            <Text style={styles.statLabel}>Users</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>$2M+</Text>
                            <Text style={styles.statLabel}>Bills Managed</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>4.8</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Additional Info Section */}
                <Animated.View
                    style={[
                        styles.infoCard,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <View style={styles.infoHeader}>
                        <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" />
                        <Text style={styles.infoTitle}>Secure & Private</Text>
                    </View>
                    <Text style={styles.infoText}>
                        Your financial data is encrypted and secure. We never share your personal
                        information with third parties.
                    </Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#6366F1',
    },
    loadingBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.45,
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
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    logoText: {
        fontSize: 40,
    },
    title: {
        fontSize: 42,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
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
        textAlign: 'center',
    },
    cardText: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 30,
        lineHeight: 24,
        textAlign: 'center',
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
    authButtons: {
        gap: 12,
        marginBottom: 24,
    },
    primaryButton: {
        borderRadius: 16,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#6366F1',
        backgroundColor: 'transparent',
    },
    secondaryButtonText: {
        color: '#6366F1',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6366F1',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E5E7EB',
    },
    infoCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
});

export default Home;
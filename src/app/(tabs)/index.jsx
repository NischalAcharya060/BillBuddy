// src/app/(tabs)/index.jsx
import { View, Text, StyleSheet, ScrollView, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const Dashboard = () => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
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

    const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
        <Animated.View
            style={[
                styles.statCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <LinearGradient
                colors={[color, `${color}DD`]}
                style={styles.statIcon}
            >
                <Ionicons name={icon} size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.statContent}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
                <Text style={styles.statSubtitle}>{subtitle}</Text>
            </View>
            {trend && (
                <View style={[styles.trend, trend.type === 'up' ? styles.trendUp : styles.trendDown]}>
                    <Ionicons
                        name={trend.type === 'up' ? "trending-up" : "trending-down"}
                        size={16}
                        color={trend.type === 'up' ? '#10B981' : '#EF4444'}
                    />
                    <Text style={[
                        styles.trendText,
                        { color: trend.type === 'up' ? '#10B981' : '#EF4444' }
                    ]}>
                        {trend.value}
                    </Text>
                </View>
            )}
        </Animated.View>
    );

    const QuickAction = ({ title, icon, color, onPress }) => (
        <View style={styles.quickAction}>
            <View style={[styles.actionIcon, { backgroundColor: color }]}>
                <Ionicons name={icon} size={24} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>{title}</Text>
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Good morning! 👋</Text>
                    <Text style={styles.title}>Dashboard Overview</Text>
                </View>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>U</Text>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <StatCard
                    title="Monthly Spending"
                    value="$0.00"
                    subtitle="This month"
                    icon="wallet-outline"
                    color="#6366F1"
                />
                <StatCard
                    title="Upcoming Bills"
                    value="0"
                    subtitle="Due this week"
                    icon="calendar-outline"
                    color="#10B981"
                />
                <StatCard
                    title="Bills Paid"
                    value="0"
                    subtitle="This month"
                    icon="checkmark-circle-outline"
                    color="#F59E0B"
                />
                <StatCard
                    title="Savings"
                    value="$0.00"
                    subtitle="Total saved"
                    icon="trending-up-outline"
                    color="#EC4899"
                />
            </View>

            {/* Quick Actions */}
            <Animated.View
                style={[
                    styles.section,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                    <QuickAction
                        title="Add Bill"
                        icon="add-circle"
                        color="#6366F1"
                    />
                    <QuickAction
                        title="Split Bill"
                        icon="people"
                        color="#10B981"
                    />
                    <QuickAction
                        title="Analytics"
                        icon="bar-chart"
                        color="#F59E0B"
                    />
                    <QuickAction
                        title="Export"
                        icon="download"
                        color="#EC4899"
                    />
                </View>
            </Animated.View>

            {/* Upcoming Bills */}
            <Animated.View
                style={[
                    styles.section,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Upcoming Bills</Text>
                    <Text style={styles.seeAll}>See all</Text>
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>No upcoming bills</Text>
                    <Text style={styles.emptySubtitle}>Add your first bill to get started</Text>
                </View>
            </Animated.View>

            {/* Recent Activity */}
            <Animated.View
                style={[
                    styles.section,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <Text style={styles.seeAll}>See all</Text>
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>No recent activity</Text>
                    <Text style={styles.emptySubtitle}>Your activity will appear here</Text>
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
    scrollContent: {
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 10,
    },
    greeting: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: '47%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    statTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    statSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    trend: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    trendUp: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    trendDown: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 2,
    },
    section: {
        marginTop: 8,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    seeAll: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    quickAction: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    emptyState: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginTop: 12,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default Dashboard;
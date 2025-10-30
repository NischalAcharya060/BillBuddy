// src/app/(tabs)/index.jsx
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Alert, RefreshControl, Dimensions } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

const { width, height } = Dimensions.get('window');

const Dashboard = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (!user) return;

        const billsQuery = query(
            collection(db, 'bills'),
            where('userId', '==', user.uid),
            orderBy('dueTimestamp', 'asc')
        );

        const unsubscribe = onSnapshot(billsQuery,
            (querySnapshot) => {
                const billsData = [];
                querySnapshot.forEach((doc) => {
                    const billData = doc.data();
                    billsData.push({
                        id: doc.id,
                        ...billData,
                        dueTimestamp: billData.dueTimestamp?.toDate?.() || new Date(billData.dueDate),
                        createdAt: billData.createdAt?.toDate?.() || new Date(),
                    });
                });

                const billsWithStatus = billsData.map(bill => {
                    const status = calculateBillStatus(bill);
                    return {
                        ...bill,
                        status,
                        isPaid: status === 'paid'
                    };
                });

                setBills(billsWithStatus);
                setLoading(false);
                setRefreshing(false);

                // Enhanced animations
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
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        tension: 20,
                        friction: 7,
                        useNativeDriver: true,
                    })
                ]).start();
            },
            (error) => {
                console.error('Error fetching bills:', error);
                setLoading(false);
                setRefreshing(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const calculateBillStatus = (bill) => {
        const today = new Date();
        const dueDate = bill.dueTimestamp;

        if (bill.status === 'paid') return 'paid';
        if (dueDate < today) return 'overdue';
        return 'pending';
    };

    const calculateStats = () => {
        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();

        const monthlySpending = bills
            .filter(bill => {
                if (bill.status !== 'paid') return false;
                const paidDate = bill.paidAt?.toDate?.() || bill.updatedAt?.toDate?.() || new Date();
                return paidDate.getMonth() === thisMonth && paidDate.getFullYear() === thisYear;
            })
            .reduce((sum, bill) => sum + bill.amount, 0);

        const upcomingBills = bills.filter(bill => {
            if (bill.status === 'paid') return false;
            const dueDate = bill.dueTimestamp;
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
        });

        const billsPaidThisMonth = bills.filter(bill => {
            if (bill.status !== 'paid') return false;
            const paidDate = bill.paidAt?.toDate?.() || bill.updatedAt?.toDate?.() || new Date();
            return paidDate.getMonth() === thisMonth && paidDate.getFullYear() === thisYear;
        });

        const totalSavings = monthlySpending * 0.1;

        return {
            monthlySpending,
            upcomingBills: upcomingBills.length,
            billsPaid: billsPaidThisMonth.length,
            totalSavings
        };
    };

    const stats = calculateStats();

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        const result = await logout();
                        if (result.success) {
                            router.replace('/(auth)/login');
                        } else {
                            Alert.alert('Logout Failed', result.error);
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
    };

    const getUserInitial = () => {
        if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
        if (user?.email) return user.email.charAt(0).toUpperCase();
        return "U";
    };

    const getUserName = () => {
        if (user?.displayName) return user.displayName;
        if (user?.email) return user.email.split('@')[0];
        return "User";
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const StatCard = ({ title, value, subtitle, icon, color, gradient }) => (
        <Animated.View
            style={[
                styles.statCard,
                {
                    opacity: fadeAnim,
                    transform: [
                        { translateY: slideAnim },
                        { scale: scaleAnim }
                    ]
                }
            ]}
        >
            <LinearGradient
                colors={gradient}
                style={styles.statGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.statHeader}>
                    <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Ionicons name={icon} size={20} color="#fff" />
                    </View>
                    <View style={styles.statTrend}>
                        <Ionicons name="trending-up" size={14} color="#fff" />
                    </View>
                </View>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
                <Text style={styles.statSubtitle}>{subtitle}</Text>
            </LinearGradient>
        </Animated.View>
    );

    const QuickAction = ({ title, icon, color, gradient, onPress }) => (
        <TouchableOpacity onPress={onPress}>
            <Animated.View
                style={[
                    styles.quickAction,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { scale: scaleAnim }
                        ]
                    }
                ]}
            >
                <LinearGradient
                    colors={gradient}
                    style={styles.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name={icon} size={24} color="#fff" />
                </LinearGradient>
                <Text style={styles.actionTitle}>{title}</Text>
            </Animated.View>
        </TouchableOpacity>
    );

    const UpcomingBillItem = ({ bill, index }) => {
        const categoryColors = {
            electricity: '#F59E0B',
            rent: '#6366F1',
            wifi: '#10B981',
            subscriptions: '#EC4899',
            water: '#06B6D4',
            gas: '#EF4444',
            phone: '#8B5CF6',
            other: '#6B7280',
        };

        const getDaysUntilDue = (dueDate) => {
            const today = new Date();
            const due = new Date(dueDate);
            const diffTime = due - today;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        };

        const daysUntilDue = getDaysUntilDue(bill.dueTimestamp || bill.dueDate);
        const isOverdue = daysUntilDue < 0;

        return (
            <Animated.View
                style={[
                    styles.upcomingBillItem,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { translateX: new Animated.Value(0) }
                        ]
                    }
                ]}
            >
                <View style={styles.billLeft}>
                    <View style={[styles.billColorDot, { backgroundColor: categoryColors[bill.category] || '#6B7280' }]} />
                    <View style={styles.billInfo}>
                        <Text style={styles.billName}>{bill.name}</Text>
                        <Text style={[
                            styles.billDueDate,
                            isOverdue && styles.overdueText
                        ]}>
                            {isOverdue ? 'Overdue' : `Due in ${daysUntilDue} days`}
                        </Text>
                    </View>
                </View>
                <Text style={styles.billAmount}>${bill.amount.toFixed(2)}</Text>
            </Animated.View>
        );
    };

    const upcomingBills = bills
        .filter(bill => bill.status === 'pending' || bill.status === 'overdue')
        .slice(0, 3);

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#6366F1']}
                        tintColor="#6366F1"
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()} 🌟</Text>
                        <Text style={styles.title}>Welcome back, {getUserName()}</Text>
                    </View>
                    <TouchableOpacity style={styles.avatarContainer} onPress={handleLogout}>
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.avatar}
                        >
                            <Text style={styles.avatarText}>{getUserInitial()}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Monthly Spend"
                        value={`$${stats.monthlySpending.toFixed(0)}`}
                        subtitle="This month"
                        icon="wallet-outline"
                        gradient={['#6366F1', '#8B5CF6']}
                    />
                    <StatCard
                        title="Upcoming"
                        value={stats.upcomingBills.toString()}
                        subtitle="Due this week"
                        icon="calendar-outline"
                        gradient={['#10B981', '#34D399']}
                    />
                    <StatCard
                        title="Paid"
                        value={stats.billsPaid.toString()}
                        subtitle="This month"
                        icon="checkmark-done"
                        gradient={['#F59E0B', '#FBBF24']}
                    />
                    <StatCard
                        title="Savings"
                        value={`$${stats.totalSavings.toFixed(0)}`}
                        subtitle="Total saved"
                        icon="trending-up"
                        gradient={['#EC4899', '#F472B6']}
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
                            icon="add"
                            gradient={['#6366F1', '#8B5CF6']}
                            onPress={() => router.push('/(tabs)/add')}
                        />
                        <QuickAction
                            title="My Bills"
                            icon="document-text"
                            gradient={['#10B981', '#34D399']}
                            onPress={() => router.push('/(tabs)/bills')}
                        />
                        <QuickAction
                            title="Analytics"
                            icon="bar-chart"
                            gradient={['#F59E0B', '#FBBF24']}
                            onPress={() => router.push('/(tabs)/analytics')}
                        />
                        <QuickAction
                            title="Split"
                            icon="people"
                            gradient={['#EC4899', '#F472B6']}
                            onPress={() => router.push('/(tabs)/split')}
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
                        <TouchableOpacity
                            style={styles.seeAllButton}
                            onPress={() => router.push('/(tabs)/bills')}
                        >
                            <Text style={styles.seeAllText}>View All</Text>
                            <Ionicons name="chevron-forward" size={16} color="#6366F1" />
                        </TouchableOpacity>
                    </View>
                    {upcomingBills.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>No upcoming bills</Text>
                            <Text style={styles.emptySubtitle}>All caught up! 🎉</Text>
                        </View>
                    ) : (
                        <View style={styles.upcomingBillsList}>
                            {upcomingBills.map((bill, index) => (
                                <UpcomingBillItem key={bill.id} bill={bill} index={index} />
                            ))}
                        </View>
                    )}
                </Animated.View>

                {/* Profile Card */}
                <Animated.View
                    style={[
                        styles.section,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.profileCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.profileInfo}>
                            <View style={styles.profileAvatar}>
                                <Text style={styles.profileAvatarText}>{getUserInitial()}</Text>
                            </View>
                            <View style={styles.profileDetails}>
                                <Text style={styles.profileName}>
                                    {user?.displayName || getUserName()}
                                </Text>
                                <Text style={styles.profileEmail}>{user?.email}</Text>
                                <View style={styles.profileStats}>
                                    <Text style={styles.profileStat}>
                                        {bills.length} bills
                                    </Text>
                                    <Text style={styles.profileStat}>
                                        ${stats.monthlySpending.toFixed(0)} spent
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#fff" />
                        </TouchableOpacity>
                    </LinearGradient>
                </Animated.View>

                {/* Extra padding at the bottom for better scrolling */}
                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 16,
    },
    greeting: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    avatarContainer: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 12,
    },
    statCard: {
        flex: 1,
        minWidth: (width - 56) / 2,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
        overflow: 'hidden',
        marginBottom: 8,
    },
    statGradient: {
        padding: 20,
        borderRadius: 20,
        minHeight: 140,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statTrend: {
        opacity: 0.8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 2,
    },
    statSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    section: {
        marginTop: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderRadius: 12,
    },
    seeAllText: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
        marginRight: 4,
    },
    actionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    quickAction: {
        flex: 1,
        alignItems: 'center',
        minWidth: (width - 80) / 4, // Calculate width for 4 items
    },
    actionGradient: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    actionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
        textAlign: 'center',
    },
    upcomingBillsList: {
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
        overflow: 'hidden',
    },
    upcomingBillItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    billLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    billColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    billInfo: {
        flex: 1,
    },
    billName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    billDueDate: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    overdueText: {
        color: '#EF4444',
        fontWeight: '600',
    },
    billAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
    },
    profileCard: {
        borderRadius: 24,
        padding: 24,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    profileAvatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    profileDetails: {
        flex: 1,
    },
    profileName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 8,
    },
    profileStats: {
        flexDirection: 'row',
        gap: 12,
    },
    profileStat: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    logoutButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        backgroundColor: '#fff',
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginTop: 12,
        marginBottom: 4,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    bottomPadding: {
        height: 30,
    },
});

export default Dashboard;
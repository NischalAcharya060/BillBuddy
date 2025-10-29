// src/app/(tabs)/index.jsx
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Alert, RefreshControl } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

const Dashboard = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (!user) return;

        // Set up real-time listener for user's bills
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

                // Calculate status for each bill
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

                // Start animations after data loads
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

        // If bill is marked as paid in Firestore
        if (bill.status === 'paid') return 'paid';

        // If due date is in the past
        if (dueDate < today) return 'overdue';

        // Otherwise pending
        return 'pending';
    };

    // Calculate dashboard statistics
    const calculateStats = () => {
        const today = new Date();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();

        // Monthly spending (paid bills this month)
        const monthlySpending = bills
            .filter(bill => {
                if (bill.status !== 'paid') return false;
                const paidDate = bill.paidAt?.toDate?.() || bill.updatedAt?.toDate?.() || new Date();
                return paidDate.getMonth() === thisMonth && paidDate.getFullYear() === thisYear;
            })
            .reduce((sum, bill) => sum + bill.amount, 0);

        // Upcoming bills (due within next 7 days)
        const upcomingBills = bills.filter(bill => {
            if (bill.status === 'paid') return false;
            const dueDate = bill.dueTimestamp;
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
        });

        // Bills paid this month
        const billsPaidThisMonth = bills.filter(bill => {
            if (bill.status !== 'paid') return false;
            const paidDate = bill.paidAt?.toDate?.() || bill.updatedAt?.toDate?.() || new Date();
            return paidDate.getMonth() === thisMonth && paidDate.getFullYear() === thisYear;
        });

        // Total savings (placeholder - you might want to calculate this differently)
        const totalSavings = monthlySpending * 0.1; // Example: 10% of spending as savings

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
                {
                    text: "Cancel",
                    style: "cancel"
                },
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
        // The real-time listener will automatically update the data
    };

    const getUserInitial = () => {
        if (user?.displayName) {
            return user.displayName.charAt(0).toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return "U";
    };

    const getUserName = () => {
        if (user?.displayName) {
            return user.displayName;
        }
        if (user?.email) {
            return user.email.split('@')[0];
        }
        return "User";
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

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
        <TouchableOpacity style={styles.quickAction} onPress={onPress}>
            <View style={[styles.actionIcon, { backgroundColor: color }]}>
                <Ionicons name={icon} size={24} color="#fff" />
            </View>
            <Text style={styles.actionTitle}>{title}</Text>
        </TouchableOpacity>
    );

    const UpcomingBillItem = ({ bill }) => {
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
            <View style={styles.upcomingBillItem}>
                <View style={[styles.billColorDot, { backgroundColor: categoryColors[bill.category] || '#6B7280' }]} />
                <View style={styles.billInfo}>
                    <Text style={styles.billName}>{bill.name}</Text>
                    <Text style={styles.billDueDate}>
                        Due {isOverdue ? 'Overdue' : `in ${daysUntilDue} days`}
                    </Text>
                </View>
                <Text style={styles.billAmount}>${bill.amount.toFixed(2)}</Text>
            </View>
        );
    };

    const upcomingBills = bills
        .filter(bill => bill.status === 'pending' || bill.status === 'overdue')
        .slice(0, 3); // Show only 3 upcoming bills

    return (
        <ScrollView
            style={styles.container}
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
                    <Text style={styles.greeting}>{getGreeting()}, {getUserName()}! 👋</Text>
                    <Text style={styles.title}>Dashboard Overview</Text>
                </View>
                <TouchableOpacity style={styles.avatarContainer} onPress={handleLogout}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getUserInitial()}</Text>
                    </View>
                    <View style={styles.logoutBadge}>
                        <Ionicons name="log-out-outline" size={12} color="#fff" />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <StatCard
                    title="Monthly Spending"
                    value={`$${stats.monthlySpending.toFixed(2)}`}
                    subtitle="This month"
                    icon="wallet-outline"
                    color="#6366F1"
                />
                <StatCard
                    title="Upcoming Bills"
                    value={stats.upcomingBills.toString()}
                    subtitle="Due this week"
                    icon="calendar-outline"
                    color="#10B981"
                />
                <StatCard
                    title="Bills Paid"
                    value={stats.billsPaid.toString()}
                    subtitle="This month"
                    icon="checkmark-circle-outline"
                    color="#F59E0B"
                />
                <StatCard
                    title="Savings"
                    value={`$${stats.totalSavings.toFixed(2)}`}
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
                        onPress={() => router.push('/(tabs)/add')}
                    />
                    <QuickAction
                        title="My Bills"
                        icon="document-text"
                        color="#10B981"
                        onPress={() => router.push('/(tabs)/bills')}
                    />
                    <QuickAction
                        title="Analytics"
                        icon="bar-chart"
                        color="#F59E0B"
                        onPress={() => router.push('/(tabs)/analytics')}
                    />
                    <QuickAction
                        title="Split Bill"
                        icon="people"
                        color="#8B5CF6"
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
                    <TouchableOpacity onPress={() => router.push('/(tabs)/bills')}>
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>
                {upcomingBills.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>No upcoming bills</Text>
                        <Text style={styles.emptySubtitle}>Add your first bill to get started</Text>
                    </View>
                ) : (
                    <View style={styles.upcomingBillsList}>
                        {upcomingBills.map((bill) => (
                            <UpcomingBillItem key={bill.id} bill={bill} />
                        ))}
                    </View>
                )}
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
                    <TouchableOpacity onPress={() => router.push('/(tabs)/bills')}>
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyTitle}>No recent activity</Text>
                    <Text style={styles.emptySubtitle}>Your activity will appear here</Text>
                </View>
            </Animated.View>

            {/* Profile Section */}
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
                    <Text style={styles.sectionTitle}>Your Profile</Text>
                </View>
                <View style={styles.profileCard}>
                    <View style={styles.profileInfo}>
                        <View style={styles.profileAvatar}>
                            <Text style={styles.profileAvatarText}>{getUserInitial()}</Text>
                        </View>
                        <View style={styles.profileDetails}>
                            <Text style={styles.profileName}>
                                {user?.displayName || getUserName()}
                            </Text>
                            <Text style={styles.profileEmail}>{user?.email}</Text>
                            <Text style={styles.profileStats}>
                                {bills.length} bills • ${stats.monthlySpending.toFixed(2)} spent this month
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
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
    avatarContainer: {
        position: 'relative',
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
    logoutBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#EF4444',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
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
    upcomingBillsList: {
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    upcomingBillItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
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
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    billDueDate: {
        fontSize: 14,
        color: '#6B7280',
    },
    billAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    profileCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    profileAvatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    profileDetails: {
        flex: 1,
    },
    profileName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    profileEmail: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    profileStats: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    logoutButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
        marginLeft: 6,
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
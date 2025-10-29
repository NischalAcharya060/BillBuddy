import { View, Text, StyleSheet, ScrollView, Dimensions, Animated, RefreshControl } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

const { width: screenWidth } = Dimensions.get('window');

const Analytics = () => {
    const { user } = useAuth();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState('month');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

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
                setBills(billsData);
                setLoading(false);
                setRefreshing(false);

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

    const onRefresh = () => {
        setRefreshing(true);
    };

    // Calculate analytics data
    const calculateAnalytics = () => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filter bills based on time range
        const filteredBills = bills.filter(bill => {
            const billDate = bill.paidAt?.toDate?.() || bill.dueTimestamp || bill.createdAt;
            if (timeRange === 'month') {
                return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
            } else if (timeRange === 'quarter') {
                const quarterStart = Math.floor(currentMonth / 3) * 3;
                return billDate.getMonth() >= quarterStart &&
                    billDate.getMonth() < quarterStart + 3 &&
                    billDate.getFullYear() === currentYear;
            } else { // year
                return billDate.getFullYear() === currentYear;
            }
        });

        // Category spending
        const categorySpending = {};
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

        filteredBills.forEach(bill => {
            if (bill.status === 'paid') {
                categorySpending[bill.category] = (categorySpending[bill.category] || 0) + bill.amount;
            }
        });

        // Monthly trend (last 6 months)
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();

            const monthlyTotal = bills
                .filter(bill => {
                    const billDate = bill.paidAt?.toDate?.() || bill.dueTimestamp || bill.createdAt;
                    return billDate.getMonth() === date.getMonth() &&
                        billDate.getFullYear() === date.getFullYear() &&
                        bill.status === 'paid';
                })
                .reduce((sum, bill) => sum + bill.amount, 0);

            monthlyTrend.push({
                month: month,
                amount: monthlyTotal
            });
        }

        // Statistics
        const totalSpent = filteredBills
            .filter(bill => bill.status === 'paid')
            .reduce((sum, bill) => sum + bill.amount, 0);

        const averageBill = filteredBills.length > 0 ? totalSpent / filteredBills.length : 0;
        const paidBills = filteredBills.filter(bill => bill.status === 'paid').length;
        const pendingBills = filteredBills.filter(bill => bill.status === 'pending').length;
        const recurringBills = filteredBills.filter(bill => bill.isRecurring).length;

        // Top categories
        const topCategories = Object.entries(categorySpending)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([category, amount]) => ({
                category,
                amount,
                color: categoryColors[category] || '#6B7280',
                percentage: totalSpent > 0 ? (amount / totalSpent * 100) : 0
            }));

        return {
            totalSpent,
            averageBill,
            paidBills,
            pendingBills,
            recurringBills,
            topCategories,
            monthlyTrend,
            categorySpending
        };
    };

    const analytics = calculateAnalytics();

    const StatCard = ({ title, value, subtitle, icon, color }) => (
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
                <Ionicons name={icon} size={20} color="#fff" />
            </LinearGradient>
            <View style={styles.statContent}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statTitle}>{title}</Text>
                <Text style={styles.statSubtitle}>{subtitle}</Text>
            </View>
        </Animated.View>
    );

    const TimeRangeSelector = () => (
        <View style={styles.timeRangeContainer}>
            {['month', 'quarter', 'year'].map((range) => (
                <TouchableOpacity
                    key={range}
                    style={[
                        styles.timeRangeButton,
                        timeRange === range && styles.timeRangeButtonActive
                    ]}
                    onPress={() => setTimeRange(range)}
                >
                    <Text style={[
                        styles.timeRangeText,
                        timeRange === range && styles.timeRangeTextActive
                    ]}>
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // Custom Bar Chart Component
    const BarChart = ({ data }) => {
        const maxValue = Math.max(...data.map(item => item.amount));

        return (
            <View style={styles.barChartContainer}>
                {data.map((item, index) => (
                    <View key={index} style={styles.barChartItem}>
                        <View style={styles.barLabelContainer}>
                            <Text style={styles.barLabel}>{item.month}</Text>
                            <Text style={styles.barValue}>${item.amount.toFixed(0)}</Text>
                        </View>
                        <View style={styles.barBackground}>
                            <View
                                style={[
                                    styles.barFill,
                                    {
                                        width: `${maxValue > 0 ? (item.amount / maxValue) * 100 : 0}%`,
                                        backgroundColor: '#6366F1'
                                    }
                                ]}
                            />
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    // Custom Progress Bar for Categories
    const CategoryProgress = ({ category, amount, percentage, color }) => (
        <View style={styles.categoryProgressItem}>
            <View style={styles.categoryProgressHeader}>
                <View style={styles.categoryInfo}>
                    <View style={[styles.categoryColor, { backgroundColor: color }]} />
                    <Text style={styles.categoryName}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                </View>
                <View style={styles.categoryAmount}>
                    <Text style={styles.categoryValue}>${amount.toFixed(2)}</Text>
                    <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}%</Text>
                </View>
            </View>
            <View style={styles.progressBarBackground}>
                <View
                    style={[
                        styles.progressBarFill,
                        { width: `${percentage}%`, backgroundColor: color }
                    ]}
                />
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Analytics</Text>
                    <Text style={styles.subtitle}>Track your spending patterns</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Ionicons name="stats-chart" size={48} color="#6366F1" />
                    <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
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
                    <Text style={styles.title}>Analytics</Text>
                    <Text style={styles.subtitle}>Track your spending patterns</Text>
                </View>
                <TimeRangeSelector />
            </View>

            {/* Overview Stats */}
            <Animated.View
                style={[
                    styles.statsGrid,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <StatCard
                    title="Total Spent"
                    value={`$${analytics.totalSpent.toFixed(2)}`}
                    subtitle={`${timeRange}ly total`}
                    icon="wallet-outline"
                    color="#6366F1"
                />
                <StatCard
                    title="Avg. Bill"
                    value={`$${analytics.averageBill.toFixed(2)}`}
                    subtitle="Per bill"
                    icon="calculator-outline"
                    color="#10B981"
                />
                <StatCard
                    title="Paid Bills"
                    value={analytics.paidBills.toString()}
                    subtitle="Completed"
                    icon="checkmark-circle-outline"
                    color="#F59E0B"
                />
                <StatCard
                    title="Recurring"
                    value={analytics.recurringBills.toString()}
                    subtitle="Auto-pay bills"
                    icon="repeat-outline"
                    color="#EC4899"
                />
            </Animated.View>

            {/* Spending Trend */}
            {analytics.monthlyTrend.some(item => item.amount > 0) && (
                <Animated.View
                    style={[
                        styles.chartSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={styles.sectionTitle}>Spending Trend</Text>
                    <BarChart data={analytics.monthlyTrend} />
                </Animated.View>
            )}

            {/* Category Breakdown */}
            {analytics.topCategories.length > 0 && (
                <Animated.View
                    style={[
                        styles.chartSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={styles.sectionTitle}>Spending by Category</Text>
                    <View style={styles.categoriesList}>
                        {analytics.topCategories.map((item, index) => (
                            <CategoryProgress
                                key={item.category}
                                category={item.category}
                                amount={item.amount}
                                percentage={item.percentage}
                                color={item.color}
                            />
                        ))}
                    </View>
                </Animated.View>
            )}

            {/* Insights */}
            <Animated.View
                style={[
                    styles.insightsSection,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <Text style={styles.sectionTitle}>Spending Insights</Text>
                <View style={styles.insightsGrid}>
                    <View style={styles.insightCard}>
                        <Ionicons name="trending-up" size={24} color="#10B981" />
                        <Text style={styles.insightTitle}>Highest Category</Text>
                        <Text style={styles.insightValue}>
                            {analytics.topCategories[0]?.category ? analytics.topCategories[0].category.charAt(0).toUpperCase() + analytics.topCategories[0].category.slice(1) : 'N/A'}
                        </Text>
                        <Text style={styles.insightSubtitle}>
                            ${analytics.topCategories[0]?.amount.toFixed(2) || '0'}
                        </Text>
                    </View>

                    <View style={styles.insightCard}>
                        <Ionicons name="calendar" size={24} color="#6366F1" />
                        <Text style={styles.insightTitle}>Bills Status</Text>
                        <Text style={styles.insightValue}>
                            {analytics.paidBills}/{analytics.paidBills + analytics.pendingBills}
                        </Text>
                        <Text style={styles.insightSubtitle}>
                            Paid bills
                        </Text>
                    </View>

                    <View style={styles.insightCard}>
                        <Ionicons name="cash" size={24} color="#F59E0B" />
                        <Text style={styles.insightTitle}>Monthly Avg</Text>
                        <Text style={styles.insightValue}>
                            ${analytics.averageBill.toFixed(2)}
                        </Text>
                        <Text style={styles.insightSubtitle}>
                            Per bill
                        </Text>
                    </View>

                    <View style={styles.insightCard}>
                        <Ionicons name="repeat" size={24} color="#EC4899" />
                        <Text style={styles.insightTitle}>Recurring</Text>
                        <Text style={styles.insightValue}>
                            {analytics.recurringBills}
                        </Text>
                        <Text style={styles.insightSubtitle}>
                            Auto-pay bills
                        </Text>
                    </View>
                </View>
            </Animated.View>

            {/* Empty State */}
            {analytics.totalSpent === 0 && (
                <Animated.View
                    style={[
                        styles.emptyState,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Ionicons name="stats-chart" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No data yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Add and pay some bills to see your analytics
                    </Text>
                </Animated.View>
            )}
        </ScrollView>
    );
};

// Add TouchableOpacity component
const TouchableOpacity = ({ style, onPress, children }) => (
    <View style={style} onStartShouldSetResponder={() => true} onResponderRelease={onPress}>
        {children}
    </View>
);

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
        fontSize: 32,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 16,
    },
    timeRangeContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        marginTop: 8,
    },
    timeRangeButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    timeRangeButtonActive: {
        backgroundColor: '#6366F1',
    },
    timeRangeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    timeRangeTextActive: {
        color: '#fff',
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
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statContent: {
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    statTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    statSubtitle: {
        fontSize: 10,
        color: '#6B7280',
    },
    chartSection: {
        backgroundColor: '#fff',
        margin: 16,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
    },
    // Custom Bar Chart Styles
    barChartContainer: {
        marginTop: 8,
    },
    barChartItem: {
        marginBottom: 16,
    },
    barLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    barLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    barValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6366F1',
    },
    barBackground: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    // Category Progress Styles
    categoriesList: {
        marginTop: 8,
    },
    categoryProgressItem: {
        marginBottom: 16,
    },
    categoryProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    categoryName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        textTransform: 'capitalize',
    },
    categoryAmount: {
        alignItems: 'flex-end',
    },
    categoryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    categoryPercentage: {
        fontSize: 12,
        color: '#6B7280',
    },
    progressBarBackground: {
        height: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    insightsSection: {
        padding: 16,
    },
    insightsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    insightCard: {
        flex: 1,
        minWidth: '47%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        alignItems: 'center',
    },
    insightTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 8,
        marginBottom: 4,
        textAlign: 'center',
    },
    insightValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
        textAlign: 'center',
    },
    insightSubtitle: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        marginTop: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
});

export default Analytics;
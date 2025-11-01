import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    Animated,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useTheme } from "../../contexts/ThemeContext";
import { useCurrency } from "../../contexts/CurrencyContext"; // Add currency context

const { width: screenWidth } = Dimensions.get('window');

// Theme colors
const lightColors = {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSecondary: '#f9fafb',
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    border: '#E5E7EB',
    primary: '#6366F1',
    primaryLight: 'rgba(99, 102, 241, 0.1)',
    gradient: ['#6366F1', '#8B5CF6'],
    shadow: '#000',
    disabled: '#F9FAFB',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
};

const darkColors = {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#64748b',
    border: '#334155',
    primary: '#818cf8',
    primaryLight: 'rgba(129, 140, 248, 0.1)',
    gradient: ['#818cf8', '#a78bfa'],
    shadow: '#000',
    disabled: '#1e293b',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
};

const Analytics = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const { formatCurrency } = useCurrency(); // Add currency hook
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [timeRange, setTimeRange] = useState('month');

    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors, isDark);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

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
            electricity: { color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
            rent: { color: colors.primary, gradient: isDark ? ['#818cf8', '#a78bfa'] : ['#6366F1', '#8B5CF6'] },
            wifi: { color: '#10B981', gradient: ['#10B981', '#059669'] },
            subscriptions: { color: '#EC4899', gradient: ['#EC4899', '#DB2777'] },
            water: { color: '#06B6D4', gradient: ['#06B6D4', '#0891B2'] },
            gas: { color: '#EF4444', gradient: ['#EF4444', '#DC2626'] },
            phone: { color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] },
            other: { color: colors.textTertiary, gradient: isDark ? ['#64748b', '#475569'] : ['#6B7280', '#4B5563'] },
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
                amount: monthlyTotal,
                fullMonth: date.toLocaleString('default', { month: 'long' })
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
                color: categoryColors[category]?.color || colors.textTertiary,
                gradient: categoryColors[category]?.gradient || (isDark ? ['#64748b', '#475569'] : ['#6B7280', '#4B5563']),
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

    const StatCard = ({ title, value, subtitle, icon, gradient }) => (
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
                    <View style={styles.statIconContainer}>
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

    const TimeRangeSelector = () => (
        <View style={styles.timeRangeContainer}>
            {[
                { id: 'month', label: 'Month', icon: 'calendar' },
                { id: 'quarter', label: 'Quarter', icon: 'calendar-outline' },
                { id: 'year', label: 'Year', icon: 'calendar-sharp' }
            ].map((range) => (
                <TouchableOpacity
                    key={range.id}
                    style={[
                        styles.timeRangeButton,
                        timeRange === range.id && styles.timeRangeButtonActive
                    ]}
                    onPress={() => setTimeRange(range.id)}
                >
                    <LinearGradient
                        colors={timeRange === range.id ? colors.gradient : isDark ? ['#334155', '#475569'] : ['#F3F4F6', '#E5E7EB']}
                        style={styles.timeRangeGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons
                            name={range.icon}
                            size={16}
                            color={timeRange === range.id ? '#fff' : colors.textSecondary}
                        />
                        <Text style={[
                            styles.timeRangeText,
                            timeRange === range.id && styles.timeRangeTextActive
                        ]}>
                            {range.label}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            ))}
        </View>
    );

    // Custom Bar Chart Component
    const BarChart = ({ data }) => {
        const maxValue = Math.max(...data.map(item => item.amount), 1);

        return (
            <View style={styles.barChartContainer}>
                {data.map((item, index) => (
                    <View key={index} style={styles.barChartItem}>
                        <View style={styles.barLabelContainer}>
                            <Text style={styles.barLabel}>{item.month}</Text>
                            <Text style={styles.barValue}>
                                {formatCurrency(item.amount, { decimalPlaces: 0 })}
                            </Text>
                        </View>
                        <View style={styles.barBackground}>
                            <LinearGradient
                                colors={colors.gradient}
                                style={[
                                    styles.barFill,
                                    {
                                        width: `${(item.amount / maxValue) * 100}%`,
                                    }
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    // Custom Progress Bar for Categories
    const CategoryProgress = ({ category, amount, percentage, gradient }) => (
        <View style={styles.categoryProgressItem}>
            <View style={styles.categoryProgressHeader}>
                <View style={styles.categoryInfo}>
                    <LinearGradient
                        colors={gradient}
                        style={styles.categoryColor}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                    <Text style={styles.categoryName}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                </View>
                <View style={styles.categoryAmount}>
                    <Text style={styles.categoryValue}>{formatCurrency(amount)}</Text>
                    <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}%</Text>
                </View>
            </View>
            <View style={styles.progressBarBackground}>
                <LinearGradient
                    colors={gradient}
                    style={[
                        styles.progressBarFill,
                        { width: `${percentage}%` }
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />
            </View>
        </View>
    );

    const InsightCard = ({ title, value, subtitle, icon, gradient }) => (
        <Animated.View
            style={[
                styles.insightCard,
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
                style={styles.insightGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name={icon} size={24} color="#fff" />
                <Text style={styles.insightValue}>{value}</Text>
                <Text style={styles.insightTitle}>{title}</Text>
                <Text style={styles.insightSubtitle}>{subtitle}</Text>
            </LinearGradient>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Analytics</Text>
                    <Text style={styles.subtitle}>Track your spending patterns</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading analytics...</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                    progressBackgroundColor={colors.surface}
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
            <View style={styles.statsGrid}>
                <StatCard
                    title="Total Spent"
                    value={formatCurrency(analytics.totalSpent, { decimalPlaces: 0 })}
                    subtitle={`${timeRange}ly total`}
                    icon="wallet-outline"
                    gradient={colors.gradient}
                />
                <StatCard
                    title="Avg. Bill"
                    value={formatCurrency(analytics.averageBill, { decimalPlaces: 0 })}
                    subtitle="Per bill"
                    icon="calculator-outline"
                    gradient={['#10B981', '#34D399']}
                />
                <StatCard
                    title="Paid Bills"
                    value={analytics.paidBills.toString()}
                    subtitle="Completed"
                    icon="checkmark-done"
                    gradient={['#F59E0B', '#FBBF24']}
                />
                <StatCard
                    title="Recurring"
                    value={analytics.recurringBills.toString()}
                    subtitle="Auto-pay bills"
                    icon="repeat"
                    gradient={['#EC4899', '#F472B6']}
                />
            </View>

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
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Spending Trend</Text>
                        <Text style={styles.sectionSubtitle}>Last 6 months</Text>
                    </View>
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
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Spending by Category</Text>
                        <Text style={styles.sectionSubtitle}>Top categories</Text>
                    </View>
                    <View style={styles.categoriesList}>
                        {analytics.topCategories.map((item, index) => (
                            <CategoryProgress
                                key={item.category}
                                category={item.category}
                                amount={item.amount}
                                percentage={item.percentage}
                                gradient={item.gradient}
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
                    <InsightCard
                        title="Highest Category"
                        value={analytics.topCategories[0]?.category ? analytics.topCategories[0].category.charAt(0).toUpperCase() + analytics.topCategories[0].category.slice(1) : 'N/A'}
                        subtitle={formatCurrency(analytics.topCategories[0]?.amount || 0, { decimalPlaces: 0 })}
                        icon="trending-up"
                        gradient={['#10B981', '#34D399']}
                    />

                    <InsightCard
                        title="Bills Status"
                        value={`${analytics.paidBills}/${analytics.paidBills + analytics.pendingBills}`}
                        subtitle="Paid bills"
                        icon="checkmark-circle"
                        gradient={colors.gradient}
                    />

                    <InsightCard
                        title="Monthly Avg"
                        value={formatCurrency(analytics.averageBill, { decimalPlaces: 0 })}
                        subtitle="Per bill"
                        icon="cash"
                        gradient={['#F59E0B', '#FBBF24']}
                    />

                    <InsightCard
                        title="Recurring"
                        value={analytics.recurringBills.toString()}
                        subtitle="Auto-pay bills"
                        icon="repeat"
                        gradient={['#EC4899', '#F472B6']}
                    />
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
                    <Ionicons name="stats-chart" size={64} color={colors.textTertiary} />
                    <Text style={styles.emptyTitle}>No data yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Add and pay some bills to see your analytics
                    </Text>
                </Animated.View>
            )}
            <View style={styles.bottomPadding} />
        </ScrollView>
    );
};

const createStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '500',
        marginBottom: 20,
    },
    timeRangeContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 6,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    timeRangeButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    timeRangeButtonActive: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    timeRangeGradient: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    timeRangeText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    timeRangeTextActive: {
        color: '#fff',
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
        borderRadius: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
        overflow: 'hidden',
    },
    statGradient: {
        padding: 20,
        borderRadius: 20,
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
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    statTrend: {
        opacity: 0.8,
    },
    statValue: {
        fontSize: 22,
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
    chartSection: {
        backgroundColor: colors.surface,
        margin: 16,
        padding: 24,
        borderRadius: 24,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    sectionHeader: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
        marginTop: 4,
    },
    barChartContainer: {
        marginTop: 8,
    },
    barChartItem: {
        marginBottom: 20,
    },
    barLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    barLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    barValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    barBackground: {
        height: 10,
        backgroundColor: isDark ? colors.surfaceSecondary : '#F3F4F6',
        borderRadius: 5,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 5,
    },
    categoriesList: {
        marginTop: 8,
    },
    categoryProgressItem: {
        marginBottom: 20,
    },
    categoryProgressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryColor: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 12,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    categoryName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
        textTransform: 'capitalize',
    },
    categoryAmount: {
        alignItems: 'flex-end',
    },
    categoryValue: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    categoryPercentage: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    progressBarBackground: {
        height: 8,
        backgroundColor: isDark ? colors.surfaceSecondary : '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
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
        borderRadius: 20,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
        overflow: 'hidden',
    },
    insightGradient: {
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    insightValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginTop: 12,
        marginBottom: 4,
        textAlign: 'center',
    },
    insightTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 2,
        textAlign: 'center',
    },
    insightSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        marginTop: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: colors.textSecondary,
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
        color: colors.textSecondary,
        fontWeight: '500',
    },
    bottomPadding: {
        height: 30,
    },
});

export default Analytics;
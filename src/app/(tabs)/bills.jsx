// src/app/(tabs)/bills.jsx
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, ScrollView } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const Bills = () => {
    const [bills, setBills] = useState([
        {
            id: '1',
            name: 'Electricity Bill',
            amount: 85.50,
            category: 'electricity',
            dueDate: '2024-01-15',
            status: 'pending',
            isPaid: false,
            isRecurring: true,
        },
        {
            id: '2',
            name: 'Netflix Subscription',
            amount: 15.99,
            category: 'subscriptions',
            dueDate: '2024-01-10',
            status: 'paid',
            isPaid: true,
            isRecurring: true,
        },
        {
            id: '3',
            name: 'Internet Bill',
            amount: 65.00,
            category: 'wifi',
            dueDate: '2024-01-20',
            status: 'pending',
            isPaid: false,
            isRecurring: true,
        },
        {
            id: '4',
            name: 'Water Bill',
            amount: 45.75,
            category: 'water',
            dueDate: '2024-01-05',
            status: 'overdue',
            isPaid: false,
            isRecurring: true,
        }
    ]);

    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('dueDate');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

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

    const categories = {
        electricity: { name: 'Electricity', icon: 'flash', color: '#F59E0B' },
        rent: { name: 'Rent', icon: 'home', color: '#6366F1' },
        wifi: { name: 'Wi-Fi', icon: 'wifi', color: '#10B981' },
        subscriptions: { name: 'Subscriptions', icon: 'play', color: '#EC4899' },
        water: { name: 'Water', icon: 'water', color: '#06B6D4' },
        gas: { name: 'Gas', icon: 'flame', color: '#EF4444' },
        phone: { name: 'Phone', icon: 'call', color: '#8B5CF6' },
        other: { name: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
    };

    const filters = [
        { id: 'all', name: 'All Bills' },
        { id: 'pending', name: 'Pending' },
        { id: 'paid', name: 'Paid' },
        { id: 'overdue', name: 'Overdue' },
    ];

    const sortOptions = [
        { id: 'dueDate', name: 'Due Date' },
        { id: 'amount', name: 'Amount' },
        { id: 'name', name: 'Name' },
    ];

    const filteredAndSortedBills = bills
        .filter(bill => {
            if (filter === 'all') return true;
            if (filter === 'pending') return bill.status === 'pending';
            if (filter === 'paid') return bill.status === 'paid';
            if (filter === 'overdue') return bill.status === 'overdue';
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'dueDate') return new Date(a.dueDate) - new Date(b.dueDate);
            if (sortBy === 'amount') return b.amount - a.amount;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });

    const toggleBillStatus = (billId) => {
        setBills(bills.map(bill =>
            bill.id === billId
                ? {
                    ...bill,
                    status: bill.status === 'paid' ? 'pending' : 'paid',
                    isPaid: !bill.isPaid
                }
                : bill
        ));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return '#10B981';
            case 'overdue': return '#EF4444';
            case 'pending': return '#F59E0B';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'paid': return 'Paid';
            case 'overdue': return 'Overdue';
            case 'pending': return 'Pending';
            default: return 'Unknown';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const getDaysUntilDue = (dueDate) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const BillCard = ({ item }) => {
        const category = categories[item.category];
        const daysUntilDue = getDaysUntilDue(item.dueDate);
        const isOverdue = daysUntilDue < 0;

        return (
            <Animated.View
                style={[
                    styles.billCard,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.billHeader}>
                    <View style={styles.billInfo}>
                        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                            <Ionicons name={category.icon} size={16} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.billName}>{item.name}</Text>
                            <Text style={styles.billCategory}>{category.name}</Text>
                        </View>
                    </View>
                    <Text style={styles.billAmount}>${item.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.billFooter}>
                    <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={[
                            styles.dueDate,
                            isOverdue && styles.overdueDate
                        ]}>
                            Due {formatDate(item.dueDate)} • {isOverdue ? 'Overdue' : `${daysUntilDue} days`}
                        </Text>
                    </View>

                    <View style={styles.actions}>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: `${getStatusColor(item.status)}20` }
                        ]}>
                            <View style={[
                                styles.statusDot,
                                { backgroundColor: getStatusColor(item.status) }
                            ]} />
                            <Text style={[
                                styles.statusText,
                                { color: getStatusColor(item.status) }
                            ]}>
                                {getStatusText(item.status)}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.payButton,
                                item.isPaid && styles.paidButton
                            ]}
                            onPress={() => toggleBillStatus(item.id)}
                        >
                            <Ionicons
                                name={item.isPaid ? "checkmark-circle" : "ellipsis-horizontal"}
                                size={20}
                                color={item.isPaid ? "#10B981" : "#6B7280"}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {item.isRecurring && (
                    <View style={styles.recurringBadge}>
                        <Ionicons name="repeat" size={12} color="#6366F1" />
                        <Text style={styles.recurringText}>Recurring</Text>
                    </View>
                )}
            </Animated.View>
        );
    };

    const StatsOverview = () => {
        const totalBills = bills.length;
        const paidBills = bills.filter(bill => bill.isPaid).length;
        const pendingBills = bills.filter(bill => !bill.isPaid).length;
        const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

        return (
            <Animated.View
                style={[
                    styles.statsContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{totalBills}</Text>
                    <Text style={styles.statLabel}>Total Bills</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>{paidBills}</Text>
                    <Text style={styles.statLabel}>Paid</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#F59E0B' }]}>{pendingBills}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#6366F1' }]}>${totalAmount.toFixed(0)}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View>
                    <Text style={styles.title}>My Bills</Text>
                    <Text style={styles.subtitle}>Manage and track your expenses</Text>
                </View>
                <TouchableOpacity style={styles.filterButton}>
                    <Ionicons name="options-outline" size={24} color="#6366F1" />
                </TouchableOpacity>
            </Animated.View>

            {/* Stats Overview */}
            <StatsOverview />

            {/* Filters */}
            <Animated.View
                style={[
                    styles.filtersContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersScroll}
                >
                    {filters.map((filterItem) => (
                        <TouchableOpacity
                            key={filterItem.id}
                            style={[
                                styles.filterChip,
                                filter === filterItem.id && styles.filterChipActive
                            ]}
                            onPress={() => setFilter(filterItem.id)}
                        >
                            <Text style={[
                                styles.filterText,
                                filter === filterItem.id && styles.filterTextActive
                            ]}>
                                {filterItem.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => {
                        // Simple sort toggle - can be enhanced with modal
                        setSortBy(sortBy === 'dueDate' ? 'amount' : 'dueDate');
                    }}
                >
                    <Ionicons name="swap-vertical" size={16} color="#6366F1" />
                    <Text style={styles.sortText}>
                        Sort: {sortOptions.find(opt => opt.id === sortBy)?.name}
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Bills List */}
            {filteredAndSortedBills.length === 0 ? (
                <Animated.View
                    style={[
                        styles.emptyState,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No bills found</Text>
                    <Text style={styles.emptySubtitle}>
                        {filter === 'all'
                            ? "Add your first bill to get started!"
                            : `No ${filter} bills at the moment.`
                        }
                    </Text>
                </Animated.View>
            ) : (
                <FlatList
                    data={filteredAndSortedBills}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <BillCard item={item} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    },
    filterButton: {
        padding: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 20,
        marginVertical: 10,
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#F3F4F6',
    },
    filtersContainer: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    filtersScroll: {
        paddingRight: 20,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#6366F1',
        borderColor: '#6366F1',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    filterTextActive: {
        color: '#fff',
    },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderRadius: 12,
    },
    sortText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6366F1',
        marginLeft: 4,
    },
    listContent: {
        padding: 20,
        paddingTop: 10,
    },
    billCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    billHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    billInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    billName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    billCategory: {
        fontSize: 12,
        color: '#6B7280',
    },
    billAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    billFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dueDate: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
    },
    overdueDate: {
        color: '#EF4444',
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    payButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    paidButton: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    recurringBadge: {
        position: 'absolute',
        top: -6,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    recurringText: {
        fontSize: 10,
        color: '#6366F1',
        fontWeight: '600',
        marginLeft: 2,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
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
});

export default Bills;
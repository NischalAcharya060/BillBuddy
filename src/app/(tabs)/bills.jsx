// src/app/(tabs)/bills.jsx
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, ScrollView, Alert, RefreshControl, Modal, ActivityIndicator, Dimensions } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

const { width, height } = Dimensions.get('window');

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
    shadow: '#000',
    disabled: '#F9FAFB',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    overlay: 'rgba(0,0,0,0.5)',
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
    shadow: '#000',
    disabled: '#1e293b',
    success: '#34D399',
    warning: '#FBBF24',
    danger: '#F87171',
    overlay: 'rgba(0,0,0,0.7)',
};

const Bills = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const router = useRouter();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('dueDate');
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);

    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors, isDark);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    const categories = {
        electricity: { name: 'Electricity', icon: 'flash', color: '#F59E0B', gradient: ['#F59E0B', '#D97706'] },
        rent: { name: 'Rent', icon: 'home', color: colors.primary, gradient: isDark ? ['#818cf8', '#a78bfa'] : ['#6366F1', '#8B5CF6'] },
        wifi: { name: 'Wi-Fi', icon: 'wifi', color: '#10B981', gradient: ['#10B981', '#059669'] },
        subscriptions: { name: 'Subscriptions', icon: 'play', color: '#EC4899', gradient: ['#EC4899', '#DB2777'] },
        water: { name: 'Water', icon: 'water', color: '#06B6D4', gradient: ['#06B6D4', '#0891B2'] },
        gas: { name: 'Gas', icon: 'flame', color: '#EF4444', gradient: ['#EF4444', '#DC2626'] },
        phone: { name: 'Phone', icon: 'call', color: '#8B5CF6', gradient: ['#8B5CF6', '#7C3AED'] },
        other: { name: 'Other', icon: 'ellipsis-horizontal', color: colors.textTertiary, gradient: isDark ? ['#64748b', '#475569'] : ['#6B7280', '#4B5563'] },
    };

    const filters = [
        { id: 'all', name: 'All', icon: 'list' },
        { id: 'pending', name: 'Pending', icon: 'time' },
        { id: 'paid', name: 'Paid', icon: 'checkmark' },
        { id: 'overdue', name: 'Overdue', icon: 'warning' },
    ];

    const sortOptions = [
        { id: 'dueDate', name: 'Due Date', icon: 'calendar' },
        { id: 'amount', name: 'Amount', icon: 'cash' },
        { id: 'name', name: 'Name', icon: 'text' },
    ];

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
                Alert.alert('Error', 'Failed to load bills. Please try again.');
                setLoading(false);
                setRefreshing(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const calculateBillStatus = (bill) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(bill.dueTimestamp);
        dueDate.setHours(0, 0, 0, 0);

        if (bill.status === 'paid') return 'paid';
        if (dueDate < today) return 'overdue';
        return 'pending';
    };

    const filteredAndSortedBills = bills
        .filter(bill => {
            if (filter === 'all') return true;
            if (filter === 'pending') return bill.status === 'pending';
            if (filter === 'paid') return bill.status === 'paid';
            if (filter === 'overdue') return bill.status === 'overdue';
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'dueDate') return new Date(a.dueTimestamp) - new Date(b.dueTimestamp);
            if (sortBy === 'amount') return b.amount - a.amount;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });

    const toggleBillStatus = async (billId) => {
        try {
            const bill = bills.find(b => b.id === billId);
            if (!bill) return;

            const newStatus = bill.status === 'paid' ? 'pending' : 'paid';

            const billRef = doc(db, 'bills', billId);
            await updateDoc(billRef, {
                status: newStatus,
                updatedAt: new Date(),
                paidAt: newStatus === 'paid' ? new Date() : null
            });
        } catch (error) {
            console.error('Error updating bill status:', error);
            Alert.alert('Error', 'Failed to update bill status. Please try again.');
        }
    };

    const handleEditBill = (bill) => {
        setEditModalVisible(false);
        router.push({
            pathname: '/(tabs)/edit-bill',
            params: { billId: bill.id }
        });
    };

    const handleDeleteBill = (bill) => {
        Alert.alert(
            "Delete Bill",
            `Are you sure you want to delete "${bill.name}"?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteBill(bill.id) }
            ]
        );
    };

    const deleteBill = async (billId) => {
        try {
            const billRef = doc(db, 'bills', billId);
            await deleteDoc(billRef);
        } catch (error) {
            console.error('Error deleting bill:', error);
            Alert.alert('Error', 'Failed to delete bill. Please try again.');
        }
    };

    const showEditOptions = (bill) => {
        setSelectedBill(bill);
        setEditModalVisible(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return colors.success;
            case 'overdue': return colors.danger;
            case 'pending': return colors.warning;
            default: return colors.textTertiary;
        }
    };

    const getStatusGradient = (status) => {
        switch (status) {
            case 'paid': return ['#10B981', '#059669'];
            case 'overdue': return ['#EF4444', '#DC2626'];
            case 'pending': return ['#F59E0B', '#D97706'];
            default: return isDark ? ['#64748b', '#475569'] : ['#6B7280', '#4B5563'];
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
        today.setHours(0, 0, 0, 0);

        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);

        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const onRefresh = async () => {
        setRefreshing(true);
    };

    const BillCard = ({ item, index }) => {
        const category = categories[item.category] || categories.other;
        const daysUntilDue = getDaysUntilDue(item.dueTimestamp || item.dueDate);
        const isOverdue = daysUntilDue < 0 && item.status !== 'paid';

        return (
            <Animated.View
                style={[
                    styles.billCard,
                    {
                        opacity: fadeAnim,
                        transform: [
                            { translateY: slideAnim },
                            { scale: scaleAnim }
                        ]
                    }
                ]}
            >
                <View style={styles.billHeader}>
                    <View style={styles.billInfo}>
                        <LinearGradient
                            colors={category.gradient}
                            style={styles.categoryIcon}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name={category.icon} size={18} color="#fff" />
                        </LinearGradient>
                        <View style={styles.billDetails}>
                            <Text style={styles.billName}>{item.name}</Text>
                            <Text style={styles.billCategory}>{category.name}</Text>
                        </View>
                    </View>
                    <Text style={styles.billAmount}>${item.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.billFooter}>
                    <View style={styles.dateContainer}>
                        <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                        <Text style={[
                            styles.dueDate,
                            isOverdue && styles.overdueDate
                        ]}>
                            Due {formatDate(item.dueTimestamp || item.dueDate)} • {isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
                        </Text>
                    </View>

                    <View style={styles.actions}>
                        <LinearGradient
                            colors={getStatusGradient(item.status)}
                            style={styles.statusBadge}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons
                                name={item.status === 'paid' ? 'checkmark' : item.status === 'overdue' ? 'warning' : 'time'}
                                size={12}
                                color="#fff"
                            />
                            <Text style={styles.statusText}>
                                {getStatusText(item.status)}
                            </Text>
                        </LinearGradient>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.payButton,
                                    item.status === 'paid' && styles.paidButton
                                ]}
                                onPress={() => toggleBillStatus(item.id)}
                            >
                                <Ionicons
                                    name={item.status === 'paid' ? "checkmark-circle" : "ellipsis-horizontal"}
                                    size={22}
                                    color={item.status === 'paid' ? colors.success : colors.textSecondary}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => showEditOptions(item)}
                            >
                                <Ionicons
                                    name="ellipsis-vertical"
                                    size={18}
                                    color={colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {item.isRecurring && (
                    <LinearGradient
                        colors={isDark ? ['#818cf8', '#a78bfa'] : ['#6366F1', '#8B5CF6']}
                        style={styles.recurringBadge}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="repeat" size={10} color="#fff" />
                        <Text style={styles.recurringText}>Recurring</Text>
                    </LinearGradient>
                )}
            </Animated.View>
        );
    };

    const StatsOverview = () => {
        const totalBills = bills.length;
        const paidBills = bills.filter(bill => bill.status === 'paid').length;
        const pendingBills = bills.filter(bill => bill.status === 'pending').length;
        const overdueBills = bills.filter(bill => bill.status === 'overdue').length;
        const pendingAmount = bills
            .filter(bill => bill.status !== 'paid')
            .reduce((sum, bill) => sum + bill.amount, 0);

        const stats = [
            { value: totalBills, label: 'Total', color: colors.primary, icon: 'documents' },
            { value: paidBills, label: 'Paid', color: colors.success, icon: 'checkmark-circle' },
            { value: pendingBills, label: 'Pending', color: colors.warning, icon: 'time' },
            { value: `$${pendingAmount.toFixed(0)}`, label: 'Due', color: '#EC4899', icon: 'cash' },
        ];

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
                {stats.map((stat, index) => (
                    <View key={stat.label} style={styles.statItem}>
                        <View style={[styles.statIconContainer, { backgroundColor: isDark ? `${stat.color}20` : `${stat.color}15` }]}>
                            <Ionicons name={stat.icon} size={16} color={stat.color} />
                        </View>
                        <Text style={[styles.statValue, { color: stat.color }]}>
                            {stat.value}
                        </Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </Animated.View>
        );
    };

    const EditOptionsModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={editModalVisible}
            onRequestClose={() => setEditModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Bill Options</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setEditModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    {selectedBill && (
                        <View style={styles.billPreview}>
                            <LinearGradient
                                colors={categories[selectedBill.category]?.gradient || categories.other.gradient}
                                style={styles.categoryIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name={categories[selectedBill.category]?.icon || 'ellipsis-horizontal'} size={18} color="#fff" />
                            </LinearGradient>
                            <View style={styles.billPreviewInfo}>
                                <Text style={styles.billPreviewName}>{selectedBill.name}</Text>
                                <Text style={styles.billPreviewAmount}>${selectedBill.amount.toFixed(2)}</Text>
                                <Text style={styles.billPreviewDue}>
                                    Due {formatDate(selectedBill.dueTimestamp || selectedBill.dueDate)}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.editButtonModal]}
                            onPress={() => handleEditBill(selectedBill)}
                        >
                            <LinearGradient
                                colors={isDark ? ['#818cf8', '#a78bfa'] : ['#6366F1', '#8B5CF6']}
                                style={styles.modalButtonIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="create-outline" size={20} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.modalButtonText}>Edit Bill</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.deleteButtonModal]}
                            onPress={() => {
                                setEditModalVisible(false);
                                handleDeleteBill(selectedBill);
                            }}
                        >
                            <LinearGradient
                                colors={['#EF4444', '#DC2626']}
                                style={styles.modalButtonIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="trash-outline" size={20} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.modalButtonText}>Delete Bill</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>My Bills</Text>
                        <Text style={styles.subtitle}>Manage your expenses</Text>
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading your bills...</Text>
                </View>
            </View>
        );
    }

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
                    <Text style={styles.subtitle}>Manage your expenses</Text>
                </View>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => {
                        const sortOrder = ['dueDate', 'amount', 'name'];
                        const currentIndex = sortOrder.indexOf(sortBy);
                        const nextIndex = (currentIndex + 1) % sortOrder.length;
                        setSortBy(sortOrder[nextIndex]);
                    }}
                >
                    <Ionicons name="filter" size={24} color={colors.primary} />
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
                            <Ionicons
                                name={filterItem.icon}
                                size={16}
                                color={filter === filterItem.id ? '#fff' : colors.textSecondary}
                            />
                            <Text style={[
                                styles.filterText,
                                filter === filterItem.id && styles.filterTextActive
                            ]}>
                                {filterItem.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.sortInfo}>
                    <Ionicons name={sortOptions.find(opt => opt.id === sortBy)?.icon || 'swap-vertical'} size={14} color={colors.primary} />
                    <Text style={styles.sortText}>
                        {sortOptions.find(opt => opt.id === sortBy)?.name}
                    </Text>
                </View>
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
                    <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
                    <Text style={styles.emptyTitle}>
                        {bills.length === 0 ? "No bills yet" : "No bills found"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {bills.length === 0
                            ? "Add your first bill to get started!"
                            : `No ${filter} bills at the moment.`
                        }
                    </Text>
                    {bills.length === 0 && (
                        <TouchableOpacity
                            style={styles.addFirstBillButton}
                            onPress={() => router.push('/(tabs)/add')}
                        >
                            <Text style={styles.addFirstBillText}>Add Your First Bill</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            ) : (
                <FlatList
                    data={filteredAndSortedBills}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => <BillCard item={item} index={index} />}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    style={styles.flatList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                            tintColor={colors.primary}
                            progressBackgroundColor={colors.surface}
                        />
                    }
                />
            )}

            <EditOptionsModal />
            <View style={styles.bottomPadding} />
        </View>
    );
};

const createStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    filterButton: {
        padding: 12,
        backgroundColor: colors.primaryLight,
        borderRadius: 12,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        marginHorizontal: 20,
        marginVertical: 8,
        padding: 20,
        borderRadius: 24,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    filtersContainer: {
        paddingHorizontal: 20,
        marginBottom: 8,
    },
    filtersScroll: {
        paddingRight: 20,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 8,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginLeft: 6,
    },
    filterTextActive: {
        color: '#fff',
    },
    sortInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: colors.primaryLight,
        borderRadius: 12,
    },
    sortText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        marginLeft: 4,
    },
    flatList: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 30,
    },
    billCard: {
        backgroundColor: colors.surface,
        padding: 20,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
        position: 'relative',
    },
    billHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    billInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    categoryIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    billDetails: {
        flex: 1,
    },
    billName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    billCategory: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    billAmount: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
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
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
        marginLeft: 6,
    },
    overdueDate: {
        color: colors.danger,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
        marginLeft: 4,
    },
    payButton: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
        marginRight: 8,
    },
    paidButton: {
        backgroundColor: isDark ? 'rgba(52, 211, 153, 0.1)' : 'rgba(16, 185, 129, 0.1)',
    },
    editButton: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
    },
    recurringBadge: {
        position: 'absolute',
        top: -6,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    recurringText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '700',
        marginLeft: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingBottom: 100,
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
    addFirstBillButton: {
        marginTop: 20,
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    addFirstBillText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    closeButton: {
        padding: 8,
        backgroundColor: isDark ? colors.surfaceSecondary : '#F3F4F6',
        borderRadius: 12,
    },
    billPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    billPreviewInfo: {
        flex: 1,
        marginLeft: 16,
    },
    billPreviewName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
    },
    billPreviewAmount: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.primary,
        marginBottom: 4,
    },
    billPreviewDue: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    modalActions: {
        gap: 12,
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        backgroundColor: isDark ? colors.surfaceSecondary : '#F8FAFC',
    },
    modalButtonIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    bottomPadding: {
        height: 40,
    },
});

export default Bills;
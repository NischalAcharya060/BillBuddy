// src/app/(tabs)/bills.jsx
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated, ScrollView, Alert, RefreshControl, Modal } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, getDocs } from "firebase/firestore";
import { useRouter } from "expo-router";

const Bills = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('dueDate');
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const fetchBills = async () => {
        if (!user) return;

        try {
            // Create query for user's bills ordered by due date
            const billsQuery = query(
                collection(db, 'bills'),
                where('userId', '==', user.uid),
                orderBy('dueTimestamp', 'asc')
            );

            const querySnapshot = await getDocs(billsQuery);
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
        } catch (error) {
            console.error('Error fetching bills:', error);
            Alert.alert('Error', 'Failed to load bills. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        // Set up real-time listener
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
                Alert.alert('Error', 'Failed to load bills. Please try again.');
                setLoading(false);
                setRefreshing(false);
            }
        );

        // Cleanup subscription on unmount
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

            // Update in Firestore
            const billRef = doc(db, 'bills', billId);
            await updateDoc(billRef, {
                status: newStatus,
                updatedAt: new Date(),
                paidAt: newStatus === 'paid' ? new Date() : null
            });

            // Local state will update automatically via the snapshot listener
        } catch (error) {
            console.error('Error updating bill status:', error);
            Alert.alert('Error', 'Failed to update bill status. Please try again.');
        }
    };

    const handleEditBill = (bill) => {
        // Navigate to add bill screen with bill data for editing
        router.push({
            pathname: '/(tabs)/add',
            params: {
                edit: 'true',
                billId: bill.id,
                billName: bill.name,
                amount: bill.amount.toString(),
                category: bill.category,
                dueDate: bill.dueDate,
                notes: bill.notes || '',
                isRecurring: bill.isRecurring ? 'true' : 'false'
            }
        });
    };

    const handleDeleteBill = (bill) => {
        Alert.alert(
            "Delete Bill",
            `Are you sure you want to delete "${bill.name}"?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteBill(bill.id)
                }
            ]
        );
    };

    const deleteBill = async (billId) => {
        try {
            const billRef = doc(db, 'bills', billId);
            await deleteDoc(billRef);
            Alert.alert('Success', 'Bill deleted successfully.');
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

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBills();
    };

    const BillCard = ({ item }) => {
        const category = categories[item.category] || categories.other;
        const daysUntilDue = getDaysUntilDue(item.dueTimestamp || item.dueDate);
        const isOverdue = daysUntilDue < 0 && item.status !== 'paid';

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
                        <View style={styles.billDetails}>
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
                            Due {formatDate(item.dueTimestamp || item.dueDate)} • {isOverdue ? 'Overdue' : `${daysUntilDue} days`}
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
                                    size={20}
                                    color={item.status === 'paid' ? "#10B981" : "#6B7280"}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => showEditOptions(item)}
                            >
                                <Ionicons
                                    name="ellipsis-vertical"
                                    size={16}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>
                        </View>
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
        const paidBills = bills.filter(bill => bill.status === 'paid').length;
        const pendingBills = bills.filter(bill => bill.status === 'pending').length;
        const overdueBills = bills.filter(bill => bill.status === 'overdue').length;
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

    // Edit Options Modal
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
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    {selectedBill && (
                        <View style={styles.billPreview}>
                            <View style={[styles.categoryIcon, { backgroundColor: categories[selectedBill.category]?.color || '#6B7280' }]}>
                                <Ionicons name={categories[selectedBill.category]?.icon || 'ellipsis-horizontal'} size={16} color="#fff" />
                            </View>
                            <View style={styles.billPreviewInfo}>
                                <Text style={styles.billPreviewName}>{selectedBill.name}</Text>
                                <Text style={styles.billPreviewAmount}>${selectedBill.amount.toFixed(2)}</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.editButtonModal]}
                            onPress={() => {
                                setEditModalVisible(false);
                                handleEditBill(selectedBill);
                            }}
                        >
                            <Ionicons name="create-outline" size={20} color="#6366F1" />
                            <Text style={[styles.modalButtonText, { color: '#6366F1' }]}>Edit Bill</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.deleteButtonModal]}
                            onPress={() => {
                                setEditModalVisible(false);
                                handleDeleteBill(selectedBill);
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            <Text style={[styles.modalButtonText, { color: '#EF4444' }]}>Delete Bill</Text>
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
                        <Text style={styles.subtitle}>Manage and track your expenses</Text>
                    </View>
                </View>
                <View style={styles.loadingContainer}>
                    <Ionicons name="refresh" size={32} color="#6366F1" />
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
                    <Text style={styles.emptyTitle}>
                        {bills.length === 0 ? "No bills yet" : "No bills found"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {bills.length === 0
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
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#6366F1']}
                            tintColor="#6366F1"
                        />
                    }
                />
            )}

            {/* Edit Options Modal */}
            <EditOptionsModal />
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
    billDetails: {
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
        justifyContent: 'space-between',
        flex: 1,
    },
    actionButtons: {
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
        marginRight: 8,
    },
    paidButton: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    editButton: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    billPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    billPreviewInfo: {
        flex: 1,
        marginLeft: 12,
    },
    billPreviewName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    billPreviewAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6366F1',
    },
    modalActions: {
        gap: 12,
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    editButtonModal: {
        borderColor: '#E5E7EB',
        backgroundColor: '#F8FAFC',
    },
    deleteButtonModal: {
        borderColor: '#FEE2E2',
        backgroundColor: '#FEF2F2',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
});

export default Bills;
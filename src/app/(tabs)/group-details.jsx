// src/app/(tabs)/group-details.jsx
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Alert,
    RefreshControl,
    Animated,
    Dimensions,
    TextInput,
    Modal,
    ActivityIndicator
} from "react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";

const { width } = Dimensions.get('window');

const GroupDetails = () => {
    const { user } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { groupId, groupName, members: membersString, totalExpenses, pendingExpenses } = params;

    const [group, setGroup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        paidBy: user?.email || '',
        splitBetween: []
    });

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    const members = membersString ? JSON.parse(membersString) : [];

    useEffect(() => {
        if (!groupId || !user) return;

        // Fetch group details
        const groupQuery = doc(db, 'splitGroups', groupId);
        const unsubscribeGroup = onSnapshot(groupQuery, (doc) => {
            if (doc.exists()) {
                const groupData = doc.data();
                setGroup({
                    id: doc.id,
                    ...groupData,
                    createdAt: groupData.createdAt?.toDate?.() || new Date(),
                });
            }
        });

        // Fetch expenses for this group
        const expensesQuery = query(
            collection(db, 'splitExpenses'),
            where('groupId', '==', groupId),
            where('members', 'array-contains', user.email)
        );

        const unsubscribeExpenses = onSnapshot(expensesQuery,
            (querySnapshot) => {
                const expensesData = [];
                querySnapshot.forEach((doc) => {
                    const expenseData = doc.data();
                    expensesData.push({
                        id: doc.id,
                        ...expenseData,
                        createdAt: expenseData.createdAt?.toDate?.() || new Date(),
                    });
                });

                // Sort by creation date (newest first)
                expensesData.sort((a, b) => b.createdAt - a.createdAt);
                setExpenses(expensesData);
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
                    })
                ]).start();
            },
            (error) => {
                console.error('Error fetching expenses:', error);
                setLoading(false);
                setRefreshing(false);
            }
        );

        return () => {
            unsubscribeGroup();
            unsubscribeExpenses();
        };
    }, [groupId, user]);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const calculateBalances = () => {
        if (!expenses.length || !members.length) return [];

        const balances = {};
        members.forEach(member => {
            balances[member] = 0;
        });

        expenses.forEach(expense => {
            if (expense.settlement) return; // Skip settlement transactions

            const amountPerPerson = expense.amount / expense.splitBetween.length;

            // Person who paid gets positive balance (others owe them)
            balances[expense.paidBy] += expense.amount;

            // People who need to pay get negative balance
            expense.splitBetween.forEach(member => {
                if (member !== expense.paidBy) {
                    balances[member] -= amountPerPerson;
                }
            });
        });

        return Object.entries(balances).map(([member, balance]) => ({
            member,
            balance: Math.round(balance * 100) / 100 // Round to 2 decimal places
        }));
    };

    const addExpense = async () => {
        if (!newExpense.description.trim() || !newExpense.amount || !newExpense.paidBy) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newExpense.splitBetween.length === 0) {
            Alert.alert('Error', 'Please select at least one person to split with');
            return;
        }

        try {
            const expenseData = {
                groupId,
                description: newExpense.description.trim(),
                amount: parseFloat(newExpense.amount),
                paidBy: newExpense.paidBy,
                splitBetween: newExpense.splitBetween,
                createdAt: serverTimestamp(),
                createdBy: user.email,
                members: members,
            };

            await addDoc(collection(db, 'splitExpenses'), expenseData);

            // Update group totals
            const groupRef = doc(db, 'splitGroups', groupId);
            await updateDoc(groupRef, {
                totalExpenses: (group?.totalExpenses || 0) + parseFloat(newExpense.amount),
                pendingExpenses: (group?.pendingExpenses || 0) + 1,
                updatedAt: serverTimestamp(),
            });

            setNewExpense({
                description: '',
                amount: '',
                paidBy: user?.email || '',
                splitBetween: []
            });
            setShowAddExpense(false);
            Alert.alert('Success', 'Expense added successfully!');
        } catch (error) {
            console.error('Error adding expense:', error);
            Alert.alert('Error', 'Failed to add expense. Please try again.');
        }
    };

    const toggleSplitMember = (member) => {
        setNewExpense(prev => {
            const isSelected = prev.splitBetween.includes(member);
            if (isSelected) {
                return {
                    ...prev,
                    splitBetween: prev.splitBetween.filter(m => m !== member)
                };
            } else {
                return {
                    ...prev,
                    splitBetween: [...prev.splitBetween, member]
                };
            }
        });
    };

    const settleBalance = async (fromMember, toMember, amount) => {
        try {
            const settlementData = {
                groupId,
                description: `Settlement: ${fromMember} to ${toMember}`,
                amount: Math.abs(amount),
                paidBy: fromMember,
                splitBetween: [fromMember, toMember],
                createdAt: serverTimestamp(),
                createdBy: user.email,
                members: members,
                settlement: true,
            };

            await addDoc(collection(db, 'splitExpenses'), settlementData);
            Alert.alert('Success', 'Balance settled successfully!');
        } catch (error) {
            console.error('Error settling balance:', error);
            Alert.alert('Error', 'Failed to settle balance. Please try again.');
        }
    };

    const balances = calculateBalances();

    const ExpenseCard = ({ expense }) => {
        const amountPerPerson = expense.amount / expense.splitBetween.length;
        const isSettlement = expense.settlement;

        return (
            <Animated.View
                style={[
                    styles.expenseCard,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.expenseHeader}>
                    <View style={styles.expenseInfo}>
                        <Text style={styles.expenseDescription}>
                            {expense.description}
                        </Text>
                        <Text style={styles.expensePaidBy}>
                            Paid by {expense.paidBy === user.email ? 'you' : expense.paidBy.split('@')[0]}
                        </Text>
                    </View>
                    <Text style={styles.expenseAmount}>
                        ${expense.amount.toFixed(2)}
                    </Text>
                </View>

                {!isSettlement && (
                    <View style={styles.expenseSplit}>
                        <Text style={styles.splitText}>
                            Split between {expense.splitBetween.length} people (${amountPerPerson.toFixed(2)} each)
                        </Text>
                        <View style={styles.splitMembers}>
                            {expense.splitBetween.slice(0, 3).map((member, index) => (
                                <View key={index} style={styles.splitMemberTag}>
                                    <Text style={styles.splitMemberText}>
                                        {member === user.email ? 'You' : member.split('@')[0]}
                                    </Text>
                                </View>
                            ))}
                            {expense.splitBetween.length > 3 && (
                                <View style={styles.splitMemberTag}>
                                    <Text style={styles.splitMemberText}>
                                        +{expense.splitBetween.length - 3}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {isSettlement && (
                    <View style={styles.settlementBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.settlementText}>Settlement</Text>
                    </View>
                )}
            </Animated.View>
        );
    };

    const BalanceItem = ({ balance }) => {
        const isYou = balance.member === user.email;
        const isPositive = balance.balance > 0;
        const isNegative = balance.balance < 0;
        const isZero = balance.balance === 0;

        return (
            <View style={styles.balanceItem}>
                <View style={styles.balanceInfo}>
                    <Text style={styles.balanceMember}>
                        {isYou ? 'You' : balance.member.split('@')[0]}
                    </Text>
                    <Text style={[
                        styles.balanceAmount,
                        isPositive && styles.positiveBalance,
                        isNegative && styles.negativeBalance,
                        isZero && styles.zeroBalance
                    ]}>
                        {isPositive ? '+' : ''}${Math.abs(balance.balance).toFixed(2)}
                    </Text>
                </View>
                {!isZero && (
                    <Text style={styles.balanceStatus}>
                        {isPositive ? 'owed' : 'owes'}
                    </Text>
                )}
            </View>
        );
    };

    const AddExpenseModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showAddExpense}
            onRequestClose={() => setShowAddExpense(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Add Expense</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowAddExpense(false)}
                        >
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.modalScroll}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Dinner, Groceries, Rent"
                                value={newExpense.description}
                                onChangeText={(text) => setNewExpense(prev => ({ ...prev, description: text }))}
                                returnKeyType="next"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Amount</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                value={newExpense.amount}
                                onChangeText={(text) => setNewExpense(prev => ({ ...prev, amount: text }))}
                                keyboardType="decimal-pad"
                                returnKeyType="next"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Paid By</Text>
                            <View style={styles.paidByContainer}>
                                {members.map((member) => (
                                    <TouchableOpacity
                                        key={member}
                                        style={[
                                            styles.paidByOption,
                                            newExpense.paidBy === member && styles.paidByOptionSelected
                                        ]}
                                        onPress={() => setNewExpense(prev => ({ ...prev, paidBy: member }))}
                                    >
                                        <Text style={[
                                            styles.paidByText,
                                            newExpense.paidBy === member && styles.paidByTextSelected
                                        ]}>
                                            {member === user.email ? 'You' : member.split('@')[0]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Split Between</Text>
                            <View style={styles.splitContainer}>
                                {members.map((member) => (
                                    <TouchableOpacity
                                        key={member}
                                        style={[
                                            styles.splitOption,
                                            newExpense.splitBetween.includes(member) && styles.splitOptionSelected
                                        ]}
                                        onPress={() => toggleSplitMember(member)}
                                    >
                                        <Ionicons
                                            name={newExpense.splitBetween.includes(member) ? "checkbox" : "square-outline"}
                                            size={20}
                                            color={newExpense.splitBetween.includes(member) ? "#6366F1" : "#6B7280"}
                                        />
                                        <Text style={styles.splitText}>
                                            {member === user.email ? 'You' : member.split('@')[0]}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowAddExpense(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={addExpense}
                            >
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6']}
                                    style={styles.addButtonGradient}
                                >
                                    <Ionicons name="add" size={20} color="#fff" />
                                    <Text style={styles.addButtonText}>Add Expense</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#6366F1" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Loading...</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>Loading group details...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#6366F1" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.title} numberOfLines={1}>{groupName}</Text>
                    <Text style={styles.subtitle}>{members.length} members</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButtonHeader}
                    onPress={() => setShowAddExpense(true)}
                >
                    <LinearGradient
                        colors={['#6366F1', '#8B5CF6']}
                        style={styles.addButtonGradientHeader}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
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
                {/* Group Stats */}
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
                        <Text style={styles.statValue}>${group?.totalExpenses?.toFixed(2) || '0.00'}</Text>
                        <Text style={styles.statLabel}>Total Spent</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{expenses.length}</Text>
                        <Text style={styles.statLabel}>Expenses</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{members.length}</Text>
                        <Text style={styles.statLabel}>Members</Text>
                    </View>
                </Animated.View>

                {/* Balances Section */}
                <Animated.View
                    style={[
                        styles.section,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Text style={styles.sectionTitle}>Balances</Text>
                    <View style={styles.balancesContainer}>
                        {balances.map((balance, index) => (
                            <BalanceItem key={index} balance={balance} />
                        ))}
                    </View>
                </Animated.View>

                {/* Expenses Section */}
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
                        <Text style={styles.sectionTitle}>Recent Expenses</Text>
                        <TouchableOpacity
                            style={styles.seeAllButton}
                            onPress={() => setShowAddExpense(true)}
                        >
                            <Text style={styles.seeAllText}>Add Expense</Text>
                        </TouchableOpacity>
                    </View>

                    {expenses.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyTitle}>No expenses yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Add your first expense to start tracking
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.expensesList}>
                            {expenses.map((expense) => (
                                <ExpenseCard key={expense.id} expense={expense} />
                            ))}
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            <AddExpenseModal />
            <View style={styles.bottomPadding} />
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
        alignItems: 'center',
        padding: 24,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
        marginRight: 12,
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    addButtonHeader: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    addButtonGradientHeader: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 20,
        marginBottom: 0,
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
    },
    section: {
        margin: 20,
        marginTop: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
    },
    seeAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderRadius: 12,
    },
    seeAllText: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
    },
    balancesContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
        overflow: 'hidden',
    },
    balanceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    balanceInfo: {
        flex: 1,
    },
    balanceMember: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    balanceAmount: {
        fontSize: 18,
        fontWeight: '800',
    },
    positiveBalance: {
        color: '#10B981',
    },
    negativeBalance: {
        color: '#EF4444',
    },
    zeroBalance: {
        color: '#6B7280',
    },
    balanceStatus: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    expensesList: {
        gap: 12,
    },
    expenseCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
    },
    expenseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    expenseInfo: {
        flex: 1,
    },
    expenseDescription: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    expensePaidBy: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    expenseAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
    },
    expenseSplit: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    splitText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    splitMembers: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    splitMemberTag: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    splitMemberText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '600',
    },
    settlementBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginTop: 8,
        gap: 4,
    },
    settlementText: {
        fontSize: 12,
        color: '#10B981',
        fontWeight: '600',
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    modalScroll: {
        padding: 24,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#1F2937',
    },
    paidByContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    paidByOption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    paidByOptionSelected: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: '#6366F1',
    },
    paidByText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    paidByTextSelected: {
        color: '#6366F1',
    },
    splitContainer: {
        gap: 8,
    },
    splitOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        gap: 12,
    },
    splitOptionSelected: {
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        padding: 18,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    addButton: {
        flex: 2,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    addButtonGradient: {
        padding: 18,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    bottomPadding: {
        height: 30,
    },
});

export default GroupDetails;
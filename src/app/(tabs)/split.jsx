import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList, Animated, RefreshControl, Modal, ActivityIndicator, Dimensions } from "react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');

// Enhanced Group Options Modal
const GroupOptionsModal = React.memo(({ visible, group, onClose, onEdit, onDelete }) => {
    const modalAnim = useRef(new Animated.Value(0)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(modalAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(modalAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    if (!group) return null;

    const modalTranslateY = modalAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [300, 0]
    });

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent={true}
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.modalOverlay, { opacity: backdropAnim }]}>
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <Animated.View style={[
                    styles.modalContent,
                    {
                        transform: [{ translateY: modalTranslateY }]
                    }
                ]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Group Options</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.groupPreview}>
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.groupIconLarge}
                        >
                            <Ionicons name="people" size={28} color="#fff" />
                        </LinearGradient>
                        <View style={styles.groupPreviewInfo}>
                            <Text style={styles.groupPreviewName}>{group.name}</Text>
                            <Text style={styles.groupPreviewMembers}>
                                {group.members.length} members
                            </Text>
                        </View>
                    </View>

                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.editButtonModal]}
                            onPress={() => {
                                onClose();
                                onEdit(group);
                            }}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                style={styles.modalButtonIcon}
                            >
                                <Ionicons name="create-outline" size={20} color="#fff" />
                            </LinearGradient>
                            <View style={styles.modalButtonTextContainer}>
                                <Text style={styles.modalButtonText}>Edit Group</Text>
                                <Text style={styles.modalButtonSubtext}>Change name and members</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.deleteButtonModal]}
                            onPress={() => {
                                onClose();
                                onDelete(group.id, group.name);
                            }}
                        >
                            <View style={[styles.modalButtonIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </View>
                            <View style={styles.modalButtonTextContainer}>
                                <Text style={[styles.modalButtonText, { color: '#EF4444' }]}>Delete Group</Text>
                                <Text style={styles.modalButtonSubtext}>Permanently remove group</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
});

// Enhanced Create Group Modal
const CreateGroupModal = React.memo(({ visible, onClose, onCreateGroup, editGroup, onUpdateGroup }) => {
    const [newGroupName, setNewGroupName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [members, setMembers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState(null);

    const modalAnim = useRef(new Animated.Value(0)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(modalAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(modalAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    useEffect(() => {
        if (editGroup) {
            setIsEditing(true);
            setEditingGroupId(editGroup.id);
            setNewGroupName(editGroup.name);
            setMembers(editGroup.members.filter(member => member !== editGroup.createdBy));
        } else {
            setIsEditing(false);
            setEditingGroupId(null);
            setNewGroupName('');
            setMembers([]);
        }
        setNewMemberEmail('');
    }, [editGroup, visible]);

    const addMember = useCallback(() => {
        if (!newMemberEmail.trim()) {
            Alert.alert('Error', 'Please enter an email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newMemberEmail)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (members.includes(newMemberEmail)) {
            Alert.alert('Error', 'This email is already added');
            return;
        }

        setMembers(prev => [...prev, newMemberEmail]);
        setNewMemberEmail('');
    }, [newMemberEmail, members]);

    const removeMember = useCallback((email) => {
        setMembers(prev => prev.filter(member => member !== email));
    }, []);

    const handleSubmit = useCallback(() => {
        if (!newGroupName.trim()) {
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        if (members.length === 0) {
            Alert.alert('Error', 'Please add at least one member');
            return;
        }

        if (isEditing && editingGroupId) {
            onUpdateGroup(editingGroupId, newGroupName.trim(), members);
        } else {
            onCreateGroup(newGroupName.trim(), members);
        }

        handleClose();
    }, [newGroupName, members, isEditing, editingGroupId, onCreateGroup, onUpdateGroup]);

    const handleClose = useCallback(() => {
        setNewGroupName('');
        setMembers([]);
        setNewMemberEmail('');
        setIsEditing(false);
        setEditingGroupId(null);
        onClose();
    }, [onClose]);

    const modalTranslateY = modalAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0]
    });

    const modalScale = modalAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.9, 1]
    });

    return (
        <Modal
            visible={visible}
            animationType="none"
            transparent={true}
            onRequestClose={handleClose}
        >
            <Animated.View style={[styles.createModalOverlay, { opacity: backdropAnim }]}>
                <Animated.View style={[
                    styles.createModalContent,
                    {
                        opacity: modalAnim,
                        transform: [
                            { translateY: modalTranslateY },
                            { scale: modalScale }
                        ]
                    }
                ]}>
                    <View style={styles.createModalHeader}>
                        <View style={styles.modalTitleContainer}>
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                style={styles.modalIcon}
                            >
                                <Ionicons name={isEditing ? "create" : "people"} size={24} color="#fff" />
                            </LinearGradient>
                            <View>
                                <Text style={styles.createModalTitle}>
                                    {isEditing ? 'Edit Group' : 'Create New Group'}
                                </Text>
                                <Text style={styles.createModalSubtitle}>
                                    {isEditing ? 'Update group details' : 'Add members to split expenses'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleClose}
                        >
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.createModalScrollView}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputGroup}>
                            <View style={styles.labelContainer}>
                                <Ionicons name="pricetag" size={16} color="#6366F1" />
                                <Text style={styles.label}>Group Name</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., Roommates, Trip to NYC"
                                placeholderTextColor="#9CA3AF"
                                value={newGroupName}
                                onChangeText={setNewGroupName}
                                returnKeyType="next"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelContainer}>
                                <Ionicons name="person-add" size={16} color="#6366F1" />
                                <Text style={styles.label}>Add Members</Text>
                            </View>
                            <View style={styles.addMemberContainer}>
                                <TextInput
                                    style={[styles.input, styles.memberInput]}
                                    placeholder="Enter email address"
                                    placeholderTextColor="#9CA3AF"
                                    value={newMemberEmail}
                                    onChangeText={setNewMemberEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="done"
                                    onSubmitEditing={addMember}
                                />
                                <TouchableOpacity
                                    style={[styles.addButton, !newMemberEmail.trim() && styles.addButtonDisabled]}
                                    onPress={addMember}
                                    disabled={!newMemberEmail.trim()}
                                >
                                    <LinearGradient
                                        colors={['#6366F1', '#8B5CF6']}
                                        style={styles.addButtonGradient}
                                    >
                                        <Ionicons name="add" size={20} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {members.length > 0 && (
                            <View style={styles.membersContainer}>
                                <Text style={styles.membersLabel}>Members ({members.length})</Text>
                                <View style={styles.membersTagsContainer}>
                                    {members.map((member, index) => (
                                        <View key={index} style={styles.memberTag}>
                                            <Ionicons name="person" size={12} color="#6366F1" />
                                            <Text style={styles.memberTagText}>{member}</Text>
                                            <TouchableOpacity
                                                style={styles.removeMemberButton}
                                                onPress={() => removeMember(member)}
                                            >
                                                <Ionicons name="close" size={14} color="#6B7280" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        <View style={styles.createModalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleClose}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.createButton,
                                    (!newGroupName.trim() || members.length === 0) && styles.createButtonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={!newGroupName.trim() || members.length === 0}
                            >
                                <LinearGradient
                                    colors={['#6366F1', '#8B5CF6']}
                                    style={styles.createButtonGradient}
                                >
                                    <Ionicons
                                        name={isEditing ? "checkmark" : "people"}
                                        size={20}
                                        color="#fff"
                                        style={{ marginRight: 8 }}
                                    />
                                    <Text style={styles.createButtonText}>
                                        {isEditing ? 'Update Group' : 'Create Group'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
});

const Split = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('groups');
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const headerAnim = useRef(new Animated.Value(0)).current;

    const filters = [
        { id: 'all', name: 'All', icon: 'list' },
        { id: 'active', name: 'Active', icon: 'play' },
        { id: 'settled', name: 'Settled', icon: 'checkmark' },
    ];

    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (!user) return;

        const groupsQuery = query(
            collection(db, 'splitGroups'),
            where('members', 'array-contains', user.email)
        );

        const unsubscribe = onSnapshot(groupsQuery,
            (querySnapshot) => {
                const groupsData = [];
                querySnapshot.forEach((doc) => {
                    const groupData = doc.data();
                    groupsData.push({
                        id: doc.id,
                        ...groupData,
                        createdAt: groupData.createdAt?.toDate?.() || new Date(),
                    });
                });

                // Sort by creation date
                groupsData.sort((a, b) => b.createdAt - a.createdAt);

                setGroups(groupsData);
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
                    Animated.spring(headerAnim, {
                        toValue: 1,
                        tension: 50,
                        friction: 7,
                        useNativeDriver: true,
                    })
                ]).start();
            },
            (error) => {
                console.error('Error fetching groups:', error);
                setLoading(false);
                setRefreshing(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const onRefresh = () => {
        setRefreshing(true);
    };

    const createGroup = useCallback(async (groupName, members) => {
        if (!user) return;

        try {
            const allMembers = [user.email, ...members];
            const groupData = {
                name: groupName,
                members: allMembers,
                createdBy: user.email,
                createdAt: serverTimestamp(),
                totalExpenses: 0,
                pendingExpenses: 0,
            };

            await addDoc(collection(db, 'splitGroups'), groupData);
        } catch (error) {
            console.error('Error creating group:', error);
            Alert.alert('Error', 'Failed to create group. Please try again.');
        }
    }, [user]);

    const updateGroup = useCallback(async (groupId, groupName, members) => {
        if (!user) return;

        try {
            const allMembers = [user.email, ...members];
            const groupRef = doc(db, 'splitGroups', groupId);

            await updateDoc(groupRef, {
                name: groupName,
                members: allMembers,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error updating group:', error);
            Alert.alert('Error', 'Failed to update group. Please try again.');
        }
    }, [user]);

    const deleteGroup = async (groupId, groupName) => {
        Alert.alert(
            "Delete Group",
            `Are you sure you want to delete "${groupName}"? This action cannot be undone.`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'splitGroups', groupId));
                        } catch (error) {
                            console.error('Error deleting group:', error);
                            Alert.alert('Error', 'Failed to delete group');
                        }
                    }
                }
            ]
        );
    };

    const handleEditGroup = useCallback((group) => {
        setEditingGroup(group);
        setShowCreateGroup(true);
    }, []);

    const handleShowOptions = useCallback((group) => {
        setSelectedGroup(group);
        setShowOptionsModal(true);
    }, []);

    const handleViewGroup = useCallback((group) => {
        router.push({
            pathname: '/group-details',
            params: { groupId: group.id }
        });
    }, []);

    const StatsOverview = () => {
        const totalGroups = groups.length;
        const totalMembers = groups.reduce((sum, group) => sum + group.members.length, 0);
        const totalExpenses = groups.reduce((sum, group) => sum + (group.totalExpenses || 0), 0);
        const pendingExpenses = groups.reduce((sum, group) => sum + (group.pendingExpenses || 0), 0);

        const stats = [
            { value: totalGroups, label: 'Groups', color: '#6366F1', icon: 'people' },
            { value: totalMembers, label: 'Members', color: '#10B981', icon: 'person' },
            { value: `$${totalExpenses}`, label: 'Total', color: '#F59E0B', icon: 'cash' },
            { value: pendingExpenses, label: 'Pending', color: '#EC4899', icon: 'time' },
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
                        <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
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

    const HeaderAnimView = ({ children }) => (
        <Animated.View style={{
            opacity: headerAnim,
            transform: [{
                translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0]
                })
            }]
        }}>
            {children}
        </Animated.View>
    );

    const GroupCard = React.memo(({ group, onShowOptions, onViewGroup, userEmail, index }) => {
        const cardAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.spring(cardAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                delay: index * 100,
                useNativeDriver: true,
            }).start();
        }, []);

        const averageExpense = group.members ? Math.ceil((group.totalExpenses || 0) / group.members.length) : 0;

        return (
            <Animated.View
                style={[
                    styles.groupCard,
                    {
                        opacity: cardAnim,
                        transform: [
                            { translateY: cardAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [30, 0]
                                })}
                        ]
                    }
                ]}
            >
                <View style={styles.groupHeader}>
                    <View style={styles.groupInfo}>
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.groupIcon}
                        >
                            <Ionicons name="people" size={20} color="#fff" />
                        </LinearGradient>
                        <View style={styles.groupDetails}>
                            <Text style={styles.groupName}>{group.name}</Text>
                            <Text style={styles.groupMembers}>
                                {group.members.length} members
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.groupMenu}
                        onPress={() => onShowOptions(group)}
                    >
                        <Ionicons name="ellipsis-horizontal" size={18} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <View style={styles.groupStats}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>${group.totalExpenses || 0}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{group.pendingExpenses || 0}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>${averageExpense}</Text>
                        <Text style={styles.statLabel}>Each</Text>
                    </View>
                </View>

                <View style={styles.membersList}>
                    {group.members.slice(0, 4).map((member, index) => (
                        <View key={index} style={styles.memberChip}>
                            <Ionicons name="person" size={12} color="#6366F1" />
                            <Text style={styles.memberText}>
                                {member === userEmail ? 'You' : member.split('@')[0]}
                            </Text>
                        </View>
                    ))}
                    {group.members.length > 4 && (
                        <View style={styles.memberChip}>
                            <Text style={styles.memberText}>
                                +{group.members.length - 4}
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.viewGroupButton}
                    onPress={() => onViewGroup(group)}
                >
                    <Text style={styles.viewGroupButtonText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={16} color="#6366F1" />
                </TouchableOpacity>
            </Animated.View>
        );
    });

    if (loading) {
        return (
            <View style={styles.container}>
                <HeaderAnimView>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>Split Bills</Text>
                            <Text style={styles.subtitle}>Divide expenses with friends</Text>
                        </View>
                    </View>
                </HeaderAnimView>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={styles.loadingText}>Loading your groups...</Text>
                </View>
            </View>
        );
    }

    const filteredGroups = groups.filter(group => {
        if (filter === 'all') return true;
        if (filter === 'active') return (group.pendingExpenses || 0) > 0;
        if (filter === 'settled') return (group.pendingExpenses || 0) === 0;
        return true;
    });

    return (
        <View style={styles.container}>
            {/* Enhanced Header */}
            <HeaderAnimView>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Split Bills</Text>
                        <Text style={styles.subtitle}>Divide expenses with friends</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.createGroupButton}
                        onPress={() => setShowCreateGroup(true)}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            style={styles.createGroupButtonGradient}
                        >
                            <Ionicons name="add" size={24} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </HeaderAnimView>

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
                                color={filter === filterItem.id ? '#fff' : '#6B7280'}
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
            </Animated.View>

            {/* Groups List */}
            {filteredGroups.length === 0 ? (
                <Animated.View
                    style={[
                        styles.emptyState,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Ionicons name="people-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>
                        {groups.length === 0 ? "No groups yet" : "No groups found"}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                        {groups.length === 0
                            ? "Create your first group to start splitting bills with friends"
                            : `No ${filter} groups at the moment.`
                        }
                    </Text>
                    {groups.length === 0 && (
                        <TouchableOpacity
                            style={styles.addFirstGroupButton}
                            onPress={() => setShowCreateGroup(true)}
                        >
                            <Text style={styles.addFirstGroupText}>Create Your First Group</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            ) : (
                <FlatList
                    data={filteredGroups}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <GroupCard
                            group={item}
                            onShowOptions={handleShowOptions}
                            onViewGroup={handleViewGroup}
                            userEmail={user?.email}
                            index={index}
                        />
                    )}
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

            {/* Enhanced Modals */}
            <CreateGroupModal
                visible={showCreateGroup}
                onClose={() => {
                    setShowCreateGroup(false);
                    setEditingGroup(null);
                }}
                onCreateGroup={createGroup}
                editGroup={editingGroup}
                onUpdateGroup={updateGroup}
            />

            <GroupOptionsModal
                visible={showOptionsModal}
                group={selectedGroup}
                onClose={() => setShowOptionsModal(false)}
                onEdit={handleEditGroup}
                onDelete={deleteGroup}
            />
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
        alignItems: 'flex-start',
        padding: 24,
        paddingTop: 60,
        paddingBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    createGroupButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    createGroupButtonGradient: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        margin: 20,
        marginVertical: 8,
        padding: 20,
        borderRadius: 24,
        shadowColor: '#000',
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
        color: '#6B7280',
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
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    filterChipActive: {
        backgroundColor: '#6366F1',
        borderColor: '#6366F1',
        shadowColor: '#6366F1',
        shadowOpacity: 0.2,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginLeft: 6,
    },
    filterTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 20,
        paddingTop: 8,
    },
    groupCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 4,
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    groupInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    groupIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    groupDetails: {
        flex: 1,
    },
    groupName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    groupMembers: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    groupMenu: {
        padding: 4,
        borderRadius: 8,
    },
    groupStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        marginHorizontal: -8,
    },
    stat: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#E5E7EB',
    },
    // statValue: {
    //     fontSize: 16,
    //     fontWeight: '800',
    //     color: '#1F2937',
    //     marginBottom: 4,
    // },
    // statLabel: {
    //     fontSize: 12,
    //     color: '#6B7280',
    //     fontWeight: '600',
    //     textTransform: 'uppercase',
    //     letterSpacing: 0.5,
    // },
    membersList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    memberChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    memberText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '600',
    },
    viewGroupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.1)',
    },
    viewGroupButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#6366F1',
        marginRight: 8,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
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
    addFirstGroupButton: {
        marginTop: 20,
        backgroundColor: '#6366F1',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
    },
    addFirstGroupText: {
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
        color: '#6B7280',
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
        shadowColor: '#000',
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
        color: '#1F2937',
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    groupPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    groupIconLarge: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    groupPreviewInfo: {
        flex: 1,
        marginLeft: 16,
    },
    groupPreviewName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    groupPreviewMembers: {
        fontSize: 14,
        color: '#6B7280',
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
        backgroundColor: '#F8FAFC',
    },
    modalButtonIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalButtonTextContainer: {
        flex: 1,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    modalButtonSubtext: {
        fontSize: 12,
        color: '#6B7280',
    },
    // Create Modal Styles
    createModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    createModalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.3,
        shadowRadius: 30,
        elevation: 20,
    },
    createModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        padding: 24,
        paddingBottom: 0,
    },
    modalTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    modalIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    createModalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    createModalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    createModalScrollView: {
        padding: 24,
        paddingTop: 0,
    },
    inputGroup: {
        marginBottom: 24,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#1F2937',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    addMemberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    memberInput: {
        flex: 1,
    },
    addButton: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    addButtonDisabled: {
        opacity: 0.5,
    },
    addButtonGradient: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    membersContainer: {
        marginBottom: 24,
    },
    membersLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    membersTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    memberTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    memberTagText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    removeMemberButton: {
        padding: 2,
        borderRadius: 4,
    },
    createModalActions: {
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
    createButton: {
        flex: 2,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonGradient: {
        padding: 18,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});

export default Split;
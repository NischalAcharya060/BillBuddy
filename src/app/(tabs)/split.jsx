import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, FlatList, Animated, RefreshControl, Modal } from "react-native";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";

// Separate Modal Component for Creating Groups
const CreateGroupModal = React.memo(({ visible, onClose, onCreateGroup, editGroup, onUpdateGroup }) => {
    const [newGroupName, setNewGroupName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [members, setMembers] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState(null);

    const newGroupNameRef = useRef(null);
    const newMemberEmailRef = useRef(null);

    // Reset form when modal opens/closes or editGroup changes
    useEffect(() => {
        if (editGroup) {
            // Editing mode
            setIsEditing(true);
            setEditingGroupId(editGroup.id);
            setNewGroupName(editGroup.name);
            setMembers(editGroup.members.filter(member => member !== editGroup.createdBy));
        } else {
            // Create mode
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
        // Keep focus on the input after adding member
        setTimeout(() => {
            if (newMemberEmailRef.current) {
                newMemberEmailRef.current.focus();
            }
        }, 100);
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

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {isEditing ? 'Edit Group' : 'Create New Group'}
                        </Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleClose}
                        >
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.modalScrollView}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Group Name</Text>
                            <TextInput
                                ref={newGroupNameRef}
                                style={styles.input}
                                placeholder="e.g., Roommates, Trip to NYC"
                                placeholderTextColor="#9CA3AF"
                                value={newGroupName}
                                onChangeText={setNewGroupName}
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    if (newMemberEmailRef.current) {
                                        newMemberEmailRef.current.focus();
                                    }
                                }}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Add Members</Text>
                            <View style={styles.addMemberContainer}>
                                <TextInput
                                    ref={newMemberEmailRef}
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
                                    style={styles.addButton}
                                    onPress={addMember}
                                >
                                    <Ionicons name="add" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {members.length > 0 && (
                            <View style={styles.membersContainer}>
                                <Text style={styles.membersLabel}>Members ({members.length})</Text>
                                <View style={styles.membersTagsContainer}>
                                    {members.map((member, index) => (
                                        <View key={index} style={styles.memberTag}>
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

                        <View style={styles.modalActions}>
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
                                    <Text style={styles.createButtonText}>
                                        {isEditing ? 'Update Group' : 'Create Group'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
});

// Options Modal Component
const GroupOptionsModal = React.memo(({ visible, group, onClose, onEdit, onDelete }) => {
    if (!group) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.optionsModalOverlay}>
                <View style={styles.optionsModalContent}>
                    <View style={styles.optionsModalHeader}>
                        <Text style={styles.optionsModalTitle}>Group Options</Text>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.groupPreview}>
                        <View style={styles.groupIcon}>
                            <Ionicons name="people" size={24} color="#6366F1" />
                        </View>
                        <View style={styles.groupPreviewInfo}>
                            <Text style={styles.groupPreviewName}>{group.name}</Text>
                            <Text style={styles.groupPreviewMembers}>
                                {group.members.length} members
                            </Text>
                        </View>
                    </View>

                    <View style={styles.optionsList}>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                onClose();
                                onEdit(group);
                            }}
                        >
                            <Ionicons name="create-outline" size={20} color="#6366F1" />
                            <Text style={[styles.optionText, { color: '#6366F1' }]}>Edit Group</Text>
                            <Ionicons name="chevron-forward" size={16} color="#6366F1" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                onClose();
                                onDelete(group.id, group.name);
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            <Text style={[styles.optionText, { color: '#EF4444' }]}>Delete Group</Text>
                            <Ionicons name="chevron-forward" size={16} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
});

const Split = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('groups');
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [editingGroup, setEditingGroup] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

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
                setGroups(groupsData);
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
            Alert.alert('Success', 'Group created successfully!');
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

            Alert.alert('Success', 'Group updated successfully!');
        } catch (error) {
            console.error('Error updating group:', error);
            Alert.alert('Error', 'Failed to update group. Please try again.');
        }
    }, [user]);

    const deleteGroup = async (groupId, groupName) => {
        Alert.alert(
            "Delete Group",
            `Are you sure you want to delete "${groupName}"?`,
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
                            Alert.alert('Success', 'Group deleted successfully');
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

    const GroupCard = React.memo(({ group, onShowOptions, userEmail }) => (
        <Animated.View
            style={[
                styles.groupCard,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={styles.groupHeader}>
                <View style={styles.groupInfo}>
                    <View style={styles.groupIcon}>
                        <Ionicons name="people" size={24} color="#6366F1" />
                    </View>
                    <View>
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
                    <Ionicons name="ellipsis-vertical" size={16} color="#6B7280" />
                </TouchableOpacity>
            </View>

            <View style={styles.groupStats}>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>${group.totalExpenses || 0}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>{group.pendingExpenses || 0}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statValue}>
                        {group.members ? Math.ceil((group.totalExpenses || 0) / group.members.length) : 0}
                    </Text>
                    <Text style={styles.statLabel}>Each</Text>
                </View>
            </View>

            <View style={styles.membersList}>
                {group.members.slice(0, 3).map((member, index) => (
                    <View key={index} style={styles.memberChip}>
                        <Text style={styles.memberText}>
                            {member === userEmail ? 'You' : member.split('@')[0]}
                        </Text>
                    </View>
                ))}
                {group.members.length > 3 && (
                    <View style={styles.memberChip}>
                        <Text style={styles.memberText}>
                            +{group.members.length - 3} more
                        </Text>
                    </View>
                )}
            </View>

            <TouchableOpacity style={styles.viewGroupButton}>
                <Text style={styles.viewGroupButtonText}>View Group</Text>
                <Ionicons name="chevron-forward" size={16} color="#6366F1" />
            </TouchableOpacity>
        </Animated.View>
    ));

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Split Bills</Text>
                    <Text style={styles.subtitle}>Divide expenses with friends</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Ionicons name="people" size={48} color="#6366F1" />
                    <Text style={styles.loadingText}>Loading your groups...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Split Bills</Text>
                    <Text style={styles.subtitle}>Divide expenses with friends</Text>
                </View>
                <TouchableOpacity
                    style={styles.createGroupButton}
                    onPress={() => setShowCreateGroup(true)}
                >
                    <Ionicons name="add" size={24} color="#6366F1" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
                    onPress={() => setActiveTab('groups')}
                >
                    <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>
                        My Groups
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
                    onPress={() => setActiveTab('activity')}
                >
                    <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>
                        Activity
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 'groups' ? (
                groups.length === 0 ? (
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
                        <Text style={styles.emptyTitle}>No groups yet</Text>
                        <Text style={styles.emptySubtitle}>
                            Create your first group to start splitting bills with friends
                        </Text>
                        <TouchableOpacity
                            style={styles.emptyActionButton}
                            onPress={() => setShowCreateGroup(true)}
                        >
                            <LinearGradient
                                colors={['#6366F1', '#8B5CF6']}
                                style={styles.emptyActionGradient}
                            >
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.emptyActionText}>Create Group</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <FlatList
                        data={groups}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <GroupCard
                                group={item}
                                onShowOptions={handleShowOptions}
                                userEmail={user?.email}
                            />
                        )}
                        contentContainerStyle={styles.groupsList}
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
                )
            ) : (
                <Animated.View
                    style={[
                        styles.emptyState,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}
                >
                    <Ionicons name="time-outline" size={64} color="#D1D5DB" />
                    <Text style={styles.emptyTitle}>No activity yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Your bill splitting activity will appear here
                    </Text>
                </Animated.View>
            )}

            {/* Create/Edit Group Modal */}
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

            {/* Options Modal */}
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
    createGroupButton: {
        padding: 8,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: '#6366F1',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#6B7280',
    },
    tabTextActive: {
        color: '#6366F1',
        fontWeight: '600',
    },
    groupsList: {
        padding: 20,
        paddingTop: 0,
    },
    groupCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
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
    },
    groupMenu: {
        padding: 4,
    },
    groupStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    membersList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    memberChip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    memberText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '500',
    },
    viewGroupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderRadius: 12,
    },
    viewGroupButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6366F1',
        marginRight: 4,
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
        marginBottom: 24,
    },
    emptyActionButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    emptyActionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    emptyActionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    modalScrollView: {
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#1F2937',
    },
    addMemberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberInput: {
        flex: 1,
        marginRight: 8,
    },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    membersContainer: {
        marginBottom: 20,
    },
    membersLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
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
        borderRadius: 16,
    },
    memberTagText: {
        fontSize: 14,
        color: '#374151',
        marginRight: 8,
    },
    removeMemberButton: {
        padding: 2,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    createButton: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden',
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonGradient: {
        padding: 16,
        alignItems: 'center',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    // Options Modal Styles
    optionsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    optionsModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    optionsModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    optionsModalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    groupPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    groupPreviewInfo: {
        flex: 1,
        marginLeft: 12,
    },
    groupPreviewName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    groupPreviewMembers: {
        fontSize: 14,
        color: '#6B7280',
    },
    optionsList: {
        gap: 8,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        marginLeft: 12,
    },
});

export default Split;
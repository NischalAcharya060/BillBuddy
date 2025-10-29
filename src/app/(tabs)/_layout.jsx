// src/app/(tabs)/_layout.jsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet } from "react-native";

const TabsLayout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#6366F1',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#F1F5F9',
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                    marginTop: 4,
                },
                headerStyle: {
                    backgroundColor: '#6366F1',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 8,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                },
                headerTitleAlign: 'center',
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={focused ? styles.iconContainerFocused : styles.iconContainer}>
                            <Ionicons
                                name={focused ? "home" : "home-outline"}
                                size={focused ? 24 : 22}
                                color={focused ? '#6366F1' : color}
                            />
                        </View>
                    ),
                    headerTitle: 'BillBuddy Dashboard',
                }}
            />
            <Tabs.Screen
                name="bills"
                options={{
                    title: 'My Bills',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={focused ? styles.iconContainerFocused : styles.iconContainer}>
                            <Ionicons
                                name={focused ? "document-text" : "document-text-outline"}
                                size={focused ? 24 : 22}
                                color={focused ? '#6366F1' : color}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: 'Add Bill',
                    tabBarIcon: ({ color, size, focused }) => (
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.addButton}
                        >
                            <Ionicons
                                name="add"
                                size={28}
                                color="#fff"
                            />
                        </LinearGradient>
                    ),
                    tabBarLabel: () => null, // Hide label for add button
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: 'Analytics',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={focused ? styles.iconContainerFocused : styles.iconContainer}>
                            <Ionicons
                                name={focused ? "pie-chart" : "pie-chart-outline"}
                                size={focused ? 24 : 22}
                                color={focused ? '#6366F1' : color}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="split"
                options={{
                    title: 'Split',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={focused ? styles.iconContainerFocused : styles.iconContainer}>
                            <Ionicons
                                name={focused ? "people" : "people-outline"}
                                size={focused ? 24 : 22}
                                color={focused ? '#6366F1' : color}
                            />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
};

const styles = StyleSheet.create({
    iconContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerFocused: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderRadius: 20,
    },
    addButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -20,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});

export default TabsLayout;
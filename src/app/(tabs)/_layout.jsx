// src/app/(tabs)/_layout.jsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get('window');

const TabsLayout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#6366F1',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarStyle: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderTopWidth: 0,
                    height: 90,
                    paddingBottom: 25,
                    paddingTop: 12,
                    shadowColor: '#6366F1',
                    shadowOffset: { width: 0, height: -8 },
                    shadowOpacity: 0.12,
                    shadowRadius: 20,
                    elevation: 12,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    backdropFilter: 'blur(20px)',
                },
                tabBarBackground: () => (
                    <View style={styles.tabBarBackground} />
                ),
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                    marginTop: 6,
                    letterSpacing: -0.2,
                },
                headerShown: false, // This removes headers for all screens
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={focused ? styles.iconContainerFocused : styles.iconContainer}>
                            <View style={[
                                styles.iconInner,
                                focused && styles.iconInnerFocused
                            ]}>
                                <Ionicons
                                    name={focused ? "home" : "home-outline"}
                                    size={focused ? 22 : 20}
                                    color={focused ? '#fff' : color}
                                />
                            </View>
                            {focused && <View style={styles.activeDot} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="bills"
                options={{
                    title: 'Bills',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={focused ? styles.iconContainerFocused : styles.iconContainer}>
                            <View style={[
                                styles.iconInner,
                                focused && styles.iconInnerFocused
                            ]}>
                                <Ionicons
                                    name={focused ? "document-text" : "document-text-outline"}
                                    size={focused ? 22 : 20}
                                    color={focused ? '#fff' : color}
                                />
                            </View>
                            {focused && <View style={styles.activeDot} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: 'Add',
                    tabBarIcon: ({ color, size, focused }) => (
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                styles.addButton,
                                focused && styles.addButtonFocused
                            ]}
                        >
                            <Ionicons
                                name="add"
                                size={26}
                                color="#fff"
                            />
                            {focused && (
                                <View style={styles.addButtonGlow} />
                            )}
                        </LinearGradient>
                    ),
                    tabBarLabel: () => null,
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: 'Stats',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={focused ? styles.iconContainerFocused : styles.iconContainer}>
                            <View style={[
                                styles.iconInner,
                                focused && styles.iconInnerFocused
                            ]}>
                                <Ionicons
                                    name={focused ? "stats-chart" : "stats-chart-outline"}
                                    size={focused ? 22 : 20}
                                    color={focused ? '#fff' : color}
                                />
                            </View>
                            {focused && <View style={styles.activeDot} />}
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
                            <View style={[
                                styles.iconInner,
                                focused && styles.iconInnerFocused
                            ]}>
                                <Ionicons
                                    name={focused ? "people" : "people-outline"}
                                    size={focused ? 22 : 20}
                                    color={focused ? '#fff' : color}
                                />
                            </View>
                            {focused && <View style={styles.activeDot} />}
                        </View>
                    ),
                }}
            />
            {/* Hide edit-bill and group details from tab bar */}
            <Tabs.Screen
                name="edit-bill"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="group-details"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
};

const styles = StyleSheet.create({
    tabBarBackground: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    iconContainerFocused: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    iconInner: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    iconInnerFocused: {
        backgroundColor: '#6366F1',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#6366F1',
        marginTop: 4,
    },
    addButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -30,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 3,
        borderColor: '#fff',
    },
    addButtonFocused: {
        transform: [{ scale: 1.05 }],
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.6,
    },
    addButtonGlow: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        zIndex: -1,
    },
});

export default TabsLayout;
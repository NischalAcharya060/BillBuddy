// src/app/(tabs)/_layout.jsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet, Dimensions } from "react-native";
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// Theme colors
const lightColors = {
    tabBarBackground: 'rgba(255, 255, 255, 0.95)',
    tabBarBorder: '#E5E7EB',
    textPrimary: '#6366F1',
    textSecondary: '#94A3B8',
    surface: '#ffffff',
    gradient: ['#6366F1', '#8B5CF6'],
    shadow: '#6366F1',
    activeDot: '#6366F1',
    addButtonBorder: '#fff',
    addButtonGlow: 'rgba(99, 102, 241, 0.2)',
};

const darkColors = {
    tabBarBackground: 'rgba(30, 41, 59, 0.95)',
    tabBarBorder: '#334155',
    textPrimary: '#818cf8',
    textSecondary: '#64748b',
    surface: '#1e293b',
    gradient: ['#818cf8', '#a78bfa'],
    shadow: '#818cf8',
    activeDot: '#818cf8',
    addButtonBorder: '#1e293b',
    addButtonGlow: 'rgba(129, 140, 248, 0.2)',
};

const TabsLayout = () => {
    const { isDark } = useTheme();
    const colors = isDark ? darkColors : lightColors;

    const styles = createStyles(colors, isDark);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.textPrimary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.tabBarBackground,
                    borderTopWidth: 1,
                    borderTopColor: colors.tabBarBorder,
                    height: 90,
                    paddingBottom: 25,
                    paddingTop: 12,
                    shadowColor: colors.shadow,
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
                    color: colors.textSecondary,
                },
                headerShown: false,
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
                            colors={colors.gradient}
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
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size, focused }) => (
                        <View style={focused ? styles.iconContainerFocused : styles.iconContainer}>
                            <View style={[
                                styles.iconInner,
                                focused && styles.iconInnerFocused
                            ]}>
                                <Ionicons
                                    name={focused ? "settings" : "settings-outline"}
                                    size={focused ? 22 : 20}
                                    color={focused ? '#fff' : color}
                                />
                            </View>
                            {focused && <View style={styles.activeDot} />}
                        </View>
                    ),
                }}
            />
            {/* Hide edit-bill from tab bar */}
            <Tabs.Screen
                name="edit-bill"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
};

const createStyles = (colors, isDark) => StyleSheet.create({
    tabBarBackground: {
        flex: 1,
        backgroundColor: colors.tabBarBackground,
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
        backgroundColor: colors.textPrimary,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.activeDot,
        marginTop: 4,
    },
    addButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -30,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 3,
        borderColor: colors.addButtonBorder,
    },
    addButtonFocused: {
        transform: [{ scale: 1.05 }],
        shadowColor: colors.gradient[1],
        shadowOpacity: 0.6,
    },
    addButtonGlow: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: colors.addButtonGlow,
        zIndex: -1,
    },
});

export default TabsLayout;
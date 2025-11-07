// src/app/(tabs)/_layout.jsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet, Dimensions, Animated } from "react-native";
import React, { useRef, useEffect } from "react";
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// Modern theme colors with glassmorphism
const lightColors = {
    tabBarBackground: 'rgba(255, 255, 255, 0.85)',
    tabBarBorder: 'rgba(255, 255, 255, 0.8)',
    textPrimary: '#6366F1',
    textSecondary: '#94A3B8',
    surface: '#ffffff',
    gradient: ['#6366F1', '#8B5CF6', '#EC4899'],
    shadow: 'rgba(99, 102, 241, 0.15)',
    activeDot: '#6366F1',
    addButtonBorder: 'rgba(255, 255, 255, 0.8)',
    addButtonGlow: 'rgba(99, 102, 241, 0.25)',
    glassEffect: 'rgba(255, 255, 255, 0.25)',
};

const darkColors = {
    tabBarBackground: 'rgba(15, 23, 42, 0.85)',
    tabBarBorder: 'rgba(30, 41, 59, 0.8)',
    textPrimary: '#818cf8',
    textSecondary: '#64748b',
    surface: '#1e293b',
    gradient: ['#818cf8', '#a78bfa', '#F472B6'],
    shadow: 'rgba(129, 140, 248, 0.15)',
    activeDot: '#818cf8',
    addButtonBorder: 'rgba(30, 41, 59, 0.8)',
    addButtonGlow: 'rgba(129, 140, 248, 0.25)',
    glassEffect: 'rgba(15, 23, 42, 0.25)',
};

const TabsLayout = () => {
    const { isDark } = useTheme();
    const colors = isDark ? darkColors : lightColors;
    const styles = createStyles(colors, isDark);

    // Animation values
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Continuous subtle animation for add button
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Continuous rotation for add button
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 8000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const TabIcon = ({ name, focusedName, focused, gradient = false }) => {
        if (gradient) {
            return (
                <Animated.View
                    style={[
                        styles.addButton,
                        {
                            transform: [
                                { scale: scaleAnim },
                                { rotate: rotateInterpolate }
                            ]
                        }
                    ]}
                >
                    <LinearGradient
                        colors={colors.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.addButtonGradient}
                    >
                        <Ionicons
                            name={name}
                            size={26}
                            color="#fff"
                        />
                    </LinearGradient>
                    <View style={styles.addButtonGlow} />
                    <View style={styles.addButtonPulse} />
                </Animated.View>
            );
        }

        return (
            <View style={focused ? styles.iconContainerFocused : styles.iconContainer}>
                <LinearGradient
                    colors={focused ? colors.gradient : ['transparent', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.iconInner,
                        focused && styles.iconInnerFocused
                    ]}
                >
                    <Ionicons
                        name={focused ? focusedName : name}
                        size={focused ? 20 : 18}
                        color={focused ? '#fff' : colors.textSecondary}
                    />
                </LinearGradient>
                {focused && (
                    <>
                        <View style={styles.activeDot} />
                        <View style={styles.activePulse} />
                    </>
                )}
            </View>
        );
    };

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.textPrimary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: colors.tabBarBackground,
                    borderTopWidth: 0,
                    height: 88,
                    paddingBottom: 28,
                    paddingTop: 12,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: -10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 25,
                    elevation: 15,
                    position: 'absolute',
                    bottom: 0,
                    left: 16,
                    right: 16,
                    borderRadius: 28,
                    backdropFilter: 'blur(20px)',
                    borderWidth: 1,
                    borderColor: colors.tabBarBorder,
                    marginHorizontal: 16,
                    marginBottom: 8,
                },
                tabBarBackground: () => (
                    <View style={styles.tabBarBackground}>
                        <View style={styles.glassEffect} />
                    </View>
                ),
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    marginTop: 6,
                    letterSpacing: -0.2,
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            name="home-outline"
                            focusedName="home"
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="bills"
                options={{
                    title: 'Bills',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            name="document-text-outline"
                            focusedName="document-text"
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="converter"
                options={{
                    title: 'Convert',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            name="swap-horizontal-outline"
                            focusedName="swap-horizontal"
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: '',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            name="add"
                            focused={focused}
                            gradient={true}
                        />
                    ),
                    tabBarLabel: () => null,
                }}
            />
            <Tabs.Screen
                name="analytics"
                options={{
                    title: 'Stats',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            name="stats-chart-outline"
                            focusedName="stats-chart"
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            name="settings-outline"
                            focusedName="settings"
                            focused={focused}
                        />
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
        borderRadius: 28,
        overflow: 'hidden',
    },
    glassEffect: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.glassEffect,
        borderRadius: 28,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        position: 'relative',
    },
    iconContainerFocused: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        position: 'relative',
    },
    iconInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    iconInnerFocused: {
        backgroundColor: colors.textPrimary,
        shadowColor: colors.gradient[0],
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    activeDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: colors.activeDot,
        marginTop: 4,
        shadowColor: colors.gradient[0],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 4,
    },
    activePulse: {
        position: 'absolute',
        top: -2,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.gradient[0],
        opacity: 0.1,
        zIndex: -1,
    },
    addButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -38,
        shadowColor: colors.gradient[0],
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 16,
        borderWidth: 3,
        borderColor: colors.addButtonBorder,
        position: 'relative',
    },
    addButtonGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonGlow: {
        position: 'absolute',
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.addButtonGlow,
        zIndex: -1,
        shadowColor: colors.gradient[1],
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
    },
    addButtonPulse: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.gradient[2],
        opacity: 0.1,
        zIndex: -2,
    },
});

export default TabsLayout;
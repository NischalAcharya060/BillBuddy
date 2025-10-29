// src/app/(auth)/login.jsx
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Animated } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { signIn } = useAuth();
    const router = useRouter();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
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
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        const result = await signIn(email, password);
        setLoading(false);

        if (result.success) {
            router.replace('/(tabs)');
        } else {
            Alert.alert('Login Failed', result.error);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Background Gradient */}
            <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                style={styles.background}
            />

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>💰</Text>
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to your BillBuddy account</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#6B7280"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Forgot Password */}
                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#6366F1', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.buttonGradient}
                        >
                            {loading ? (
                                <Text style={styles.buttonText}>Signing In...</Text>
                            ) : (
                                <>
                                    <Ionicons name="log-in-outline" size={20} color="#fff" />
                                    <Text style={styles.buttonText}>Sign In</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <View style={styles.signUpContainer}>
                        <Text style={styles.signUpText}>Don't have an account? </Text>
                        <Link href="/(auth)/register" asChild>
                            <TouchableOpacity>
                                <Text style={styles.signUpLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>
            </Animated.View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        flexGrow: 1,
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    content: {
        flex: 1,
        padding: 20,
        paddingTop: 80,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
    },
    logoText: {
        fontSize: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    form: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    inputIcon: {
        padding: 16,
    },
    input: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#1F2937',
    },
    eyeIcon: {
        padding: 16,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
    },
    loginButton: {
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signUpText: {
        fontSize: 14,
        color: '#6B7280',
    },
    signUpLink: {
        fontSize: 14,
        color: '#6366F1',
        fontWeight: '600',
    },
});

export default Login;
// src/app/_layout.jsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { ActivityIndicator, View } from "react-native";

function RootLayoutNav() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#6366F1' }}>
                <ActivityIndicator size="large" color="#fff" />
                <StatusBar style="light" />
            </View>
        );
    }

    return (
        <>
            <Stack
                screenOptions={{
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
                        letterSpacing: 0.3,
                    },
                    headerBackTitleVisible: false,
                    contentStyle: {
                        backgroundColor: '#f8fafc',
                    },
                    animation: 'slide_from_right',
                    headerTitleAlign: 'center',
                }}
            >
                <Stack.Screen
                    name="index"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="(auth)"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>
            <StatusBar style="light" />
        </>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
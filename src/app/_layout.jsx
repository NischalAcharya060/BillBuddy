// src/app/_layout.jsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const RootNavigation = () => {
    return (
        <>
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#6366F1',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
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
                        title: '💰 BillBuddy',
                        headerStyle: {
                            backgroundColor: '#6366F1',
                            shadowColor: 'transparent',
                            elevation: 0,
                        },
                    }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                    }}
                />
            </Stack>

            <StatusBar
                style="light"
                backgroundColor="#6366F1"
            />
        </>
    );
};

export default RootNavigation;
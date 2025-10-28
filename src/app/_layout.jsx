// src/app/_layout.jsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

const RootNavigation = () => {
    return (
        <>
            <Stack screenOptions={{
                headerStyle: {
                    backgroundColor: '#6366F1',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}>
                <Stack.Screen
                    name="index"
                    options={{
                        title: 'BillBuddy',
                    }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false
                    }}
                />
            </Stack>
            <StatusBar style="light" />
        </>
    );
};

export default RootNavigation;
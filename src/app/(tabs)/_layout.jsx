// src/app/(tabs)/_layout.jsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const TabsLayout = () => {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: '#6366F1',
            tabBarStyle: {
                backgroundColor: '#fff',
            },
        }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="bills"
                options={{
                    title: 'Bills',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-text" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: 'Add Bill',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
};

export default TabsLayout;
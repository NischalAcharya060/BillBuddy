// src/contexts/ThemeContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [themeState, setThemeState] = useState({
        isDark: false,
        isLoaded: false
    });
    const systemColorScheme = useColorScheme();

    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('app_theme');
            if (savedTheme) {
                setThemeState({
                    isDark: savedTheme === 'dark',
                    isLoaded: true
                });
            } else {
                // Use system preference as default
                setThemeState({
                    isDark: systemColorScheme === 'dark',
                    isLoaded: true
                });
            }
        } catch (error) {
            console.error('Error loading theme preference:', error);
            setThemeState({
                isDark: systemColorScheme === 'dark',
                isLoaded: true
            });
        }
    };

    const toggleTheme = async () => {
        const newIsDark = !themeState.isDark;
        const newState = {
            isDark: newIsDark,
            isLoaded: true
        };
        setThemeState(newState);
        try {
            await AsyncStorage.setItem('app_theme', newIsDark ? 'dark' : 'light');
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    const setTheme = async (theme) => {
        const newIsDark = theme === 'dark';
        const newState = {
            isDark: newIsDark,
            isLoaded: true
        };
        setThemeState(newState);
        try {
            await AsyncStorage.setItem('app_theme', theme);
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    const value = {
        isDark: themeState.isDark,
        isLoaded: themeState.isLoaded,
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { auth } from '../firebase/config.js';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Required for Google Auth to work properly
WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: '50373998195-45vhrnfkikcttjl41eo7ulpi4nvrv24d.apps.googleusercontent.com',
        webClientId: '50373998195-45vhrnfkikcttjl41eo7ulpi4nvrv24d.apps.googleusercontent.com',
        androidClientId: '50373998195-45vhrnfkikcttjl41eo7ulpi4nvrv24d.apps.googleusercontent.com',
        iosClientId: '50373998195-45vhrnfkikcttjl41eo7ulpi4nvrv24d.apps.googleusercontent.com',
    });

    // Handle Google Auth Response
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token, access_token } = response.authentication;
            handleGoogleSignIn(id_token, access_token);
        }
    }, [response]);

    const handleGoogleSignIn = async (idToken, accessToken) => {
        setGoogleLoading(true);
        try {
            const credential = GoogleAuthProvider.credential(idToken, accessToken);
            const userCredential = await signInWithCredential(auth, credential);

            console.log('Google Sign-In successful:', userCredential.user);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Google Sign-In error:', error);
            let errorMessage = 'Google Sign-In failed. Please try again.';

            if (error.code === 'auth/account-exists-with-different-credential') {
                errorMessage = 'An account already exists with the same email address but different sign-in credentials.';
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign-in was cancelled.';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'Sign-in popup was blocked. Please allow popups for this site.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection.';
            }

            return { success: false, error: errorMessage };
        } finally {
            setGoogleLoading(false);
        }
    };

    // Google Sign-In function
    const signInWithGoogle = async () => {
        setGoogleLoading(true);
        try {
            await promptAsync();
            // The actual sign-in will be handled by the useEffect above
            return { success: true };
        } catch (error) {
            console.error('Google prompt error:', error);
            return {
                success: false,
                error: 'Failed to start Google Sign-In. Please try again.'
            };
        } finally {
            setGoogleLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Email/Password Sign Up
    const signUp = async (email, password, displayName = '') => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            // Set display name if provided
            if (displayName) {
                await updateProfile(userCredential.user, {
                    displayName: displayName.trim()
                });
            }

            return { success: true, user: userCredential.user };
        } catch (error) {
            let errorMessage = error.message;

            // User-friendly error messages
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please use a different email or sign in.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            }

            return { success: false, error: errorMessage };
        }
    };

    // Email/Password Sign In
    const signIn = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            let errorMessage = error.message;

            // User-friendly error messages
            if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Please sign up first.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid login credentials. Please check your email and password.';
            }

            return { success: false, error: errorMessage };
        }
    };

    // Sign Out
    const logout = async () => {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // Update User Profile
    const updateUserProfile = async (profileData) => {
        try {
            await updateProfile(auth.currentUser, profileData);
            setUser({ ...user, ...profileData });
            return { success: true };
        } catch (error) {
            console.error('Error updating profile:', error);
            let errorMessage = error.message;

            if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Please sign in again to update your profile.';
            }

            return { success: false, error: errorMessage };
        }
    };

    // Password Reset
    const resetPassword = async (email) => {
        try {
            console.log('Sending password reset email to:', email);

            const actionCodeSettings = {
                url: 'https://billbuddy-cf1ce.firebaseapp.com/__/auth/action',
                handleCodeInApp: false
            };

            await sendPasswordResetEmail(auth, email, actionCodeSettings);

            console.log('Password reset email sent successfully');
            return { success: true };
        } catch (error) {
            console.error('Password reset error details:', {
                code: error.code,
                message: error.message,
                fullError: error
            });

            let errorMessage = 'Failed to send reset email. Please try again.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Network error. Please check your internet connection.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later.';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Password reset is not enabled. Please contact support.';
            }

            return { success: false, error: errorMessage };
        }
    };

    const value = {
        user,
        loading,
        googleLoading,
        signUp,
        signIn,
        signInWithGoogle,
        logout,
        updateUserProfile,
        resetPassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
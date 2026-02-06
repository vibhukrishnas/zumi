import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthChangeCallback } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // Handle auth state changes from API interceptor (e.g., 401/403 responses)
    const handleAuthChange = useCallback((token, userData) => {
        // Only clear state, don't set error here (this happens silently in background)
        if (token === null) {
            setUserToken(null);
            setUser(null);
            // Don't set authError here - it would show misleading messages on app start
        } else {
            setUserToken(token);
            setUser(userData);
        }
    }, []);

    // Register callback with API service
    useEffect(() => {
        setAuthChangeCallback(handleAuthChange);
        return () => setAuthChangeCallback(null);
    }, [handleAuthChange]);

    // Bootstrap - restore session on app start
    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                const [token, userDataStr] = await AsyncStorage.multiGet(['userToken', 'userData']);
                
                if (token[1]) {
                    // Validate token by making a quick API call
                    try {
                        const response = await api.get('/auth/profile');
                        if (response.data.success) {
                            setUserToken(token[1]);
                            setUser(response.data.data || JSON.parse(userDataStr[1] || '{}'));
                        } else {
                            // Token invalid, clear storage silently
                            await AsyncStorage.multiRemove(['userToken', 'userData']);
                        }
                    } catch (error) {
                        // Token invalid/expired, clear storage silently (no error to user)
                        await AsyncStorage.multiRemove(['userToken', 'userData']);
                        // Don't set authError - this is a background operation
                    }
                }
            } catch (e) {
                console.error('Auth bootstrap error:', e);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    const authContext = useMemo(() => ({
        signIn: async (email, password) => {
            setAuthError(null);
            try {
                const response = await api.post('/auth/login', { email, password });
                
                if (response.data.success) {
                    const { token, userId, email: userEmail, fullName, subscription } = response.data.data;
                    const userData = { userId, email: userEmail, fullName, subscription };
                    
                    await AsyncStorage.multiSet([
                        ['userToken', token],
                        ['userData', JSON.stringify(userData)]
                    ]);
                    
                    setUserToken(token);
                    setUser(userData);
                    return { success: true };
                }
                return { success: false, error: response.data.message || 'Login failed' };
            } catch (error) {
                // Get server error message or provide a default
                const serverMsg = error.response?.data?.message;
                const message = serverMsg || error.userMessage || 'Invalid email or password.';
                setAuthError(message);
                return { success: false, error: message };
            }
        },

        signUp: async (email, password, fullName, phone) => {
            setAuthError(null);
            try {
                const response = await api.post('/auth/register', { email, password, fullName, phone });
                
                if (response.data.success) {
                    const { token, userId, email: userEmail } = response.data.data;
                    const userData = { userId, email: userEmail, fullName };
                    
                    await AsyncStorage.multiSet([
                        ['userToken', token],
                        ['userData', JSON.stringify(userData)]
                    ]);
                    
                    setUserToken(token);
                    setUser(userData);
                    return { success: true };
                }
                return { success: false, error: 'Registration failed' };
            } catch (error) {
                const message = error.userMessage || 'Registration failed. Please try again.';
                setAuthError(message);
                return { success: false, error: message };
            }
        },

        signOut: async () => {
            try {
                await AsyncStorage.multiRemove(['userToken', 'userData']);
            } catch (e) {
                console.error('Sign out error:', e);
            } finally {
                setUserToken(null);
                setUser(null);
                setAuthError(null);
            }
        },

        clearError: () => setAuthError(null),

        updateUser: async (updatedData) => {
            const newUser = { ...user, ...updatedData };
            await AsyncStorage.setItem('userData', JSON.stringify(newUser));
            setUser(newUser);
        },
    }), [user]);

    return (
        <AuthContext.Provider value={{ 
            ...authContext, 
            userToken, 
            user, 
            isLoading, 
            authError,
            isAuthenticated: !!userToken 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

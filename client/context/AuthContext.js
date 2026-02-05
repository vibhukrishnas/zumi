import React, { createContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const authContext = useMemo(() => ({
        signIn: async (token, userData) => {
            try {
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                setUserToken(token);
                setUser(userData);
            } catch (e) {
                console.error(e);
            }
        },
        signOut: async () => {
            try {
                await AsyncStorage.removeItem('userToken');
                await AsyncStorage.removeItem('userData');
                setUserToken(null);
                setUser(null);
            } catch (e) {
                console.error(e);
            }
        },
        signUp: async (token, userData) => {
            try {
                await AsyncStorage.setItem('userToken', token);
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                setUserToken(token);
                setUser(userData);
            } catch (e) {
                console.error(e);
            }
        },
    }), []);

    useEffect(() => {
        const bootstrapAsync = async () => {
            let token, userData;
            try {
                token = await AsyncStorage.getItem('userToken');
                const userDataStr = await AsyncStorage.getItem('userData');
                if (userDataStr) {
                    userData = JSON.parse(userDataStr);
                }
            } catch (e) {
                console.error(e);
            }
            setUserToken(token);
            setUser(userData || null);
            setIsLoading(false);
        };

        bootstrapAsync();
    }, []);

    return (
        <AuthContext.Provider value={{ ...authContext, userToken, user, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

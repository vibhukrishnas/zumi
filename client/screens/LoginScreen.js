import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, Image, TextInput } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import ZumiLogo from '../components/ZumiLogo';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signIn } = useContext(AuthContext);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please fill in all fields');
            haptic.error();
            return;
        }
        setLoading(true);
        setError('');
        try {
            await signIn(email, password);
            haptic.success();
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
            haptic.error();
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Logo */}
                <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
                    <ZumiLogo size="large" />
                </Animated.View>

                {/* Pet Illustration */}
                <Animated.View style={[styles.illustrationContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.petCircle}>
                        <Text style={styles.petEmoji}>🐕🐈</Text>
                    </View>
                </Animated.View>

                {/* Welcome Text */}
                <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.welcomeText}>Welcome Back!</Text>
                </Animated.View>

                {/* Form */}
                <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email Address"
                            placeholderTextColor={colors.textLight}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor={colors.textLight}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                    </View>

                    <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                        <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.loginButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Login</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotPassword} onPress={() => { haptic.light(); navigation.navigate('ForgotPassword'); }}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Sign Up */}
                <Animated.View style={[styles.signUpContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.signUpText}>Don't have your account?</Text>
                    <TouchableOpacity onPress={() => { haptic.light(); navigation.navigate('Register'); }} style={styles.signUpButton}>
                        <Text style={styles.signUpButtonText}>Sign Up</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 60, paddingBottom: 30 },

    logoContainer: { alignItems: 'center', marginBottom: 20 },

    illustrationContainer: { alignItems: 'center', marginBottom: 30 },
    petCircle: { width: 180, height: 140, backgroundColor: '#F0F4F8', borderRadius: 70, justifyContent: 'center', alignItems: 'center' },
    petEmoji: { fontSize: 60 },

    welcomeContainer: { alignItems: 'center', marginBottom: 30 },
    welcomeText: { fontSize: 28, fontWeight: '700', color: colors.text },

    formContainer: { marginBottom: 20 },
    errorText: { color: colors.error, textAlign: 'center', marginBottom: 15, fontSize: 14 },

    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 15, borderWidth: 1, borderColor: colors.border },
    input: { flex: 1, fontSize: 16, color: colors.text },

    loginButton: { borderRadius: 25, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
    loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },

    forgotPassword: { alignItems: 'center', marginTop: 20 },
    forgotPasswordText: { color: colors.textSecondary, fontSize: 14 },

    signUpContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border },
    signUpText: { color: colors.textSecondary, fontSize: 14 },
    signUpButton: { marginLeft: 8, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    signUpButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});

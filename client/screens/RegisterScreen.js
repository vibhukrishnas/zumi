import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Animated, TextInput } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import ZumiLogo from '../components/ZumiLogo';

export default function RegisterScreen({ navigation }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { signUp } = useContext(AuthContext);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleRegister = async () => {
        if (!fullName || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            haptic.error();
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            haptic.error();
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            haptic.error();
            return;
        }
        setLoading(true);
        setError('');
        
        const result = await signUp(email, password, fullName, '');
        
        if (result.success) {
            haptic.success();
        } else {
            setError(result.error);
            haptic.error();
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Logo */}
                <Animated.View style={[styles.logoContainer, { opacity: fadeAnim }]}>
                    <ZumiLogo size="medium" />
                </Animated.View>

                {/* Title */}
                <Animated.View style={[styles.titleContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.titleText}>Create Account</Text>
                    <Text style={styles.subtitleText}>Join the pet community!</Text>
                </Animated.View>

                {/* Form */}
                <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color={colors.textLight} />
                        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={colors.textLight}
                            value={fullName} onChangeText={setFullName} />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="mail-outline" size={20} color={colors.textLight} />
                        <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor={colors.textLight}
                            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} />
                        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.textLight}
                            value={password} onChangeText={setPassword} secureTextEntry />
                    </View>

                    <View style={styles.inputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} />
                        <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor={colors.textLight}
                            value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                    </View>

                    <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
                        <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.registerButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Sign Up</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Login Link */}
                <Animated.View style={[styles.loginContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.loginText}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => { haptic.light(); navigation.navigate('Login'); }} style={styles.loginButton}>
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, paddingHorizontal: 30, paddingTop: 50, paddingBottom: 30 },

    logoContainer: { alignItems: 'center', marginBottom: 20 },

    titleContainer: { alignItems: 'center', marginBottom: 25 },
    titleText: { fontSize: 26, fontWeight: '700', color: colors.text },
    subtitleText: { fontSize: 14, color: colors.textSecondary, marginTop: 5 },

    formContainer: { marginBottom: 20 },
    errorText: { color: colors.error, textAlign: 'center', marginBottom: 15, fontSize: 14 },

    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    input: { flex: 1, fontSize: 16, color: colors.text, marginLeft: 12 },

    registerButton: { borderRadius: 25, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
    registerButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },

    loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 'auto', paddingTop: 20 },
    loginText: { color: colors.textSecondary, fontSize: 14 },
    loginButton: { marginLeft: 8, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    loginButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});

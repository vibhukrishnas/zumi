import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import api from '../services/api';
import PremiumButton from '../components/PremiumButton';
import PremiumInput from '../components/PremiumInput';
import ZumiLogo from '../components/ZumiLogo';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Email, 2: Token/New Password
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleRequestReset = async () => {
        if (!email) { Alert.alert('Error', 'Please enter email'); return; }
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            Alert.alert('Email Sent', 'Check your inbox for a reset code (Use 1234 for demo).');
            setStep(2);
        } catch (error) {
            Alert.alert('Error', 'Failed to send request');
        } finally { setLoading(false); }
    };

    const handleReset = async () => {
        if (!token || !newPassword) { Alert.alert('Error', 'Fill all fields'); return; }
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, token, newPassword });
            Alert.alert('Success', 'Password reset! Please login.');
            navigation.navigate('Login');
        } catch (error) {
            Alert.alert('Error', 'Invalid token or error reset');
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <View style={styles.content}>
                <ZumiLogo size="small" />
                <Text style={styles.title}>Recovery</Text>

                {step === 1 ? (
                    <>
                        <Text style={styles.subtitle}>Enter your email to receive a reset code.</Text>
                        <PremiumInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                        <PremiumButton title={loading ? "Sending..." : "Send Code"} onPress={handleRequestReset} loading={loading} />
                    </>
                ) : (
                    <>
                        <Text style={styles.subtitle}>Enter the code and your new password.</Text>
                        <PremiumInput label="Reset Code (1234)" value={token} onChangeText={setToken} keyboardType="numeric" />
                        <PremiumInput label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
                        <PremiumButton title={loading ? "Resetting..." : "Reset Password"} onPress={handleReset} loading={loading} />
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 20 },
    backButton: { marginBottom: 20 },
    content: { alignItems: 'center', flex: 1 },
    title: { fontSize: 28, fontWeight: 'bold', marginVertical: 20 },
    subtitle: { color: '#666', textAlign: 'center', marginBottom: 30 },
});

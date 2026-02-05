import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useStripe } from '@stripe/stripe-react-native';
import { colors } from '../theme';
import api from '../services/api';
import PremiumButton from '../components/PremiumButton';
import { Ionicons } from '@expo/vector-icons';
import ZumiLogo from '../components/ZumiLogo';

export default function PaymentGatewayScreen({ route, navigation }) {
    const { amount, onSuccess } = route.params;
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);

    const [paymentId, setPaymentId] = useState(null);

    useEffect(() => {
        initializePaymentSheet();
    }, []);

    const initializePaymentSheet = async () => {
        setLoading(true);

        try {
            const { data } = await api.post('/payments/create-payment-intent', {
                amount: amount,
                currency: 'usd',
            });

            if (!data.success) {
                Alert.alert('Error', 'Could not initiate payment');
                setLoading(false);
                return;
            }

            setPaymentId(data.paymentIntentId);

            const { error } = await initPaymentSheet({
                paymentIntentClientSecret: data.clientSecret,
                merchantDisplayName: 'Zumi Pet Services',
                allowsDelayedPaymentMethods: true,
                returnURL: 'zumi://payment-complete', // Deep link if needed
            });

            if (error) {
                Alert.alert('Error', error.message);
                setLoading(false);
            } else {
                setReady(true);
                setLoading(false);
                // Auto-open if desired, but button is safer
            }
        } catch (error) {
            console.log('Payment Init Error:', error);
            Alert.alert('Error', 'Could not initiate payment. Please try again.');
            setLoading(false);
        }
    };

    const handlePay = async () => {
        // Strict Mode: presentPaymentSheet must exist
        if (!presentPaymentSheet) return;

        try {
            const { error } = await presentPaymentSheet();
            if (error) {
                Alert.alert(`Payment Failed`, error.message);
            } else {
                Alert.alert('Success', 'Your order is confirmed!');
                if (onSuccess) onSuccess(paymentId);
            }
        } catch (e) {
            console.log(e);
            Alert.alert('Error', 'Payment process interrupted.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <ZumiLogo size="small" />
                <Text style={styles.title}>Secure Payment</Text>
                <Text style={styles.amount}>${amount}</Text>

                <View style={styles.infoBox}>
                    <Ionicons name="lock-closed" size={20} color="#666" />
                    <Text style={styles.secureText}>Payments processed securely by Stripe</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
                ) : (
                    <PremiumButton
                        title="Pay with Card / Apple Pay"
                        onPress={handlePay}
                        disabled={!ready}
                        style={{ marginTop: 30, width: '100%' }}
                    />
                )}

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 20 },
    content: { alignItems: 'center', width: '100%' },
    title: { fontSize: 24, fontWeight: 'bold', marginTop: 20, color: '#333' },
    amount: { fontSize: 40, fontWeight: 'bold', color: colors.primary, marginVertical: 10 },
    infoBox: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
    secureText: { color: '#666', fontSize: 14 },
    cancelButton: { marginTop: 20 },
    cancelText: { color: '#999', fontSize: 16 }
});

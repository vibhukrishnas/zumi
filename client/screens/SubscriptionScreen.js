import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, Image } from 'react-native';
import { Text, Card, Title, Paragraph } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

function PlanCard({ plan, isCurrent, onSelect }) {
    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={onSelect}
            disabled={isCurrent}
            style={[styles.planCard, isCurrent && styles.currentPlanCard]}
        >
            <LinearGradient
                colors={plan.id === 'premium' ? ['#FFD700', '#FFA500'] : ['#ffffff', '#f0f0f0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.planGradient}
            >
                <View style={styles.planHeader}>
                    <Text style={[styles.planTitle, plan.id === 'premium' ? { color: '#fff' } : { color: colors.text }]}>{plan.name}</Text>
                    {isCurrent && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>Current</Text></View>}
                </View>
                <Text style={[styles.planPrice, plan.id === 'premium' ? { color: '#fff' } : { color: colors.primary }]}>{plan.price}</Text>
                <View style={styles.featuresList}>
                    {plan.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                            <Ionicons name="checkmark-circle" size={18} color={plan.id === 'premium' ? '#fff' : colors.primary} />
                            <Text style={[styles.featureText, plan.id === 'premium' ? { color: '#fff' } : { color: colors.textSecondary }]}>{feature}</Text>
                        </View>
                    ))}
                </View>
                {!isCurrent && (
                    <TouchableOpacity style={styles.selectButton} onPress={onSelect}>
                        <Text style={styles.selectButtonText}>{plan.id === 'premium' ? 'Upgrade Now' : 'Select'}</Text>
                    </TouchableOpacity>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
}

export default function SubscriptionScreen({ navigation }) {
    const { user, signIn } = useContext(AuthContext); // Assuming user object has subscription info or we fetch it
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [paymentProcessing, setPaymentProcessing] = useState(false);

    // Mock Plans
    const plans = [
        { id: 'free', name: 'Free', price: '$0.00/mo', features: ['Basic Booking', 'Community Access'] },
        { id: 'premium', name: 'Premium', price: '$9.99/mo', features: ['20% Off All Bookings', 'Priority Support', 'Exclusive Events'] },
    ];

    const currentTier = user?.subscription?.tier || 'free';

    const handleUpgrade = (plan) => {
        haptic.medium();
        if (plan.id === 'premium') {
            setModalVisible(true);
        }
    };

    const processPayment = async () => {
        setPaymentProcessing(true);
        haptic.medium();

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Actual API Call
            await api.post('/subscriptions/upgrade', { tier: 'premium' });

            setPaymentProcessing(false);
            setModalVisible(false);
            haptic.success();
            Alert.alert("🎉 Success!", "Welcome to Zumi Premium! Enjoy your 20% discount.", [
                { text: "Awesome", onPress: () => navigation.goBack() }
            ]);

            // In a real app, we'd force a token refresh here to update the User context
        } catch (error) {
            setPaymentProcessing(false);
            haptic.error();
            Alert.alert("Error", "Payment failed. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subscription Plan</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>Choose the plan that suits you best</Text>

                {plans.map(plan => (
                    <PlanCard
                        key={plan.id}
                        plan={plan}
                        isCurrent={currentTier === plan.id}
                        onSelect={() => handleUpgrade(plan)}
                    />
                ))}
            </ScrollView>

            {/* Mock Payment Modal */}
            <Modal animationType="slide" transparent={true} visible={modalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Secure Payment</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} /></TouchableOpacity>
                        </View>

                        <View style={styles.cardForm}>
                            <TextInput style={styles.input} placeholder="Card Number" keyboardType="numeric" placeholderTextColor="#aaa" />
                            <View style={styles.row}>
                                <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} placeholder="MM/YY" placeholderTextColor="#aaa" />
                                <TextInput style={[styles.input, { flex: 1 }]} placeholder="CVC" keyboardType="numeric" placeholderTextColor="#aaa" />
                            </View>
                        </View>

                        <TouchableOpacity onPress={processPayment} disabled={paymentProcessing} style={styles.payButton}>
                            <LinearGradient colors={['#4CAF50', '#2E7D32']} style={styles.payButtonGradient}>
                                {paymentProcessing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payButtonText}>Pay $9.99</Text>}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    content: { padding: 20 },
    subtitle: { textAlign: 'center', color: colors.textSecondary, marginBottom: 20 },

    planCard: { borderRadius: 20, marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
    currentPlanCard: { borderWidth: 2, borderColor: colors.primary },
    planGradient: { padding: 20, borderRadius: 20 },
    planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    planTitle: { fontSize: 22, fontWeight: 'bold' },
    currentBadge: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    currentBadgeText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
    planPrice: { fontSize: 18, marginBottom: 15, fontWeight: '600' },
    featuresList: { marginBottom: 20 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    featureText: { marginLeft: 10, fontSize: 14 },
    selectButton: { backgroundColor: '#fff', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    selectButtonText: { color: colors.text, fontWeight: 'bold', fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, paddingBottom: 50 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    cardForm: { marginBottom: 20 },
    input: { backgroundColor: '#F8F9FD', borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16 },
    row: { flexDirection: 'row' },
    payButton: { borderRadius: 15, overflow: 'hidden' },
    payButtonGradient: { paddingVertical: 18, alignItems: 'center' },
    payButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

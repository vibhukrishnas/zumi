import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { Title, Card, Text, Paragraph, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import PremiumButton from '../components/PremiumButton';
import PremiumInput from '../components/PremiumInput';
import { haptic } from '../utils/haptics';

function FadeInView({ children, delay = 0, direction = 'down', style }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateAnim = useRef(new Animated.Value(direction === 'up' ? -30 : 30)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
            Animated.timing(translateAnim, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
        ]).start();
    }, []);
    return <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: translateAnim }] }, style]}>{children}</Animated.View>;
}

export default function BookingScreen({ route, navigation }) {
    const { id, title, type, price } = route.params;
    const [coupon, setCoupon] = useState(''); // Optional now
    const [loading, setLoading] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);

    // Auto-Calculate on mount (optional) or just simplify button
    // User wants "Proceed with payment gateway" so we combine steps visually

    const { signOut } = React.useContext(require('../context/AuthContext').AuthContext);

    const initiateBooking = async () => {
        haptic.medium();
        setLoading(true);
        try {
            // Send empty coupon to trigger random discount
            const response = await api.post('/bookings/initiate', { itemId: id, itemType: type || 'event', couponCode: coupon });
            setBookingDetails(response.data.data);
            haptic.success();
            // Don't alert, just show breakdown smoothly
        } catch (error) {
            haptic.error();
            if (error.response?.status === 403 || error.response?.status === 401) {
                // Explain why login is required instead of forcing it immediately
                Alert.alert(
                    "Login Required",
                    "You need to be logged in to calculate pricing and book services.",
                    [
                        { text: "Cancel", style: "cancel" },
                        { text: "Log In", onPress: () => signOut() }
                    ]
                );
            } else {
                Alert.alert("Error", error.response?.data?.message || "Failed to calculate price");
            }
        } finally { setLoading(false); }
    };

    const confirmPayment = () => {
        haptic.light();
        if (!bookingDetails || !bookingDetails.bookingId) return;

        navigation.navigate('PaymentGateway', {
            amount: bookingDetails.finalPrice,
            bookingId: bookingDetails.bookingId,
            onSuccess: async (paymentIntentId) => {
                try {
                    const response = await api.put(`/bookings/${bookingDetails.bookingId}/confirm`, { paymentIntentId });
                    const { rewardPromoCode, rewardPromoDiscount } = response.data;
                    
                    // Show reward promo code alert
                    if (rewardPromoCode) {
                        Alert.alert(
                            '🎉 Booking Confirmed!',
                            `Thank you for your purchase!\n\nHere's your reward promo code for your next booking:\n\n🎟️ ${rewardPromoCode}\n\nUse this code to get ${rewardPromoDiscount}% off your next service!`,
                            [{ text: 'Awesome!', onPress: () => navigation.navigate('Main', { screen: 'Schedule' }) }]
                        );
                    } else {
                        navigation.navigate('Main', { screen: 'Schedule' });
                    }
                } catch (error) {
                    Alert.alert('Error', 'Failed to confirm booking');
                }
            }
        });
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <FadeInView>
                    <LinearGradient colors={['#6C63FF', '#4834d4']} style={styles.summaryCard}>
                        <View style={styles.itemBadge}><Text style={styles.itemBadgeText}>{type === 'service' ? '🛠️ Service' : '📅 Event'}</Text></View>
                        <Title style={styles.itemTitle}>{title}</Title>
                        <View style={styles.basePriceRow}><Text style={styles.basePriceLabel}>Base Price</Text><Text style={styles.basePriceValue}>${price}</Text></View>
                    </LinearGradient>
                </FadeInView>

                {/* Dynamic Promo Section */}
                {!bookingDetails && (
                    <FadeInView delay={100} style={styles.section}>
                        <Text style={styles.sectionTitle}>🎟️ Have a Promo Code?</Text>
                        <PremiumInput
                            label="Promo Code"
                            value={coupon}
                            onChangeText={setCoupon}
                            placeholder="Enter code here"
                            autoCapitalize="characters"
                            icon="pricetag-outline"
                        />
                        <PremiumButton
                            title={loading ? "Calculating..." : "Apply & Calculate"}
                            onPress={initiateBooking}
                            loading={loading}
                            colors={['#4CAF50', '#2E7D32']}
                        />
                    </FadeInView>
                )}

                {bookingDetails && (
                    <FadeInView direction="up" style={styles.section}>
                        <Text style={styles.sectionTitle}>📊 Final Price</Text>
                        <View style={styles.breakdownCard}>
                            <View style={styles.breakdownRow}><Text style={styles.breakdownLabel}>Original Price</Text><Text style={styles.breakdownValue}>${bookingDetails.originalPrice}</Text></View>

                            {(bookingDetails.discounts.subscription > 0 || bookingDetails.discounts.coupon > 0) && (
                                <View style={styles.breakdownRow}>
                                    <View style={styles.discountLabel}>
                                        <Text style={styles.breakdownLabel}>Woohoo! Discount Applied</Text>
                                        <View style={styles.discountBadge}><Text style={styles.discountBadgeText}>{Math.max(bookingDetails.discounts.subscription, bookingDetails.discounts.coupon)}% OFF</Text></View>
                                    </View>
                                    <Text style={styles.discountValue}>-${(bookingDetails.originalPrice * Math.max(bookingDetails.discounts.subscription, bookingDetails.discounts.coupon) / 100).toFixed(2)}</Text>
                                </View>
                            )}

                            <View style={styles.divider} />
                            <View style={styles.totalRow}><Text style={styles.totalLabel}>Total to Pay</Text><Text style={styles.totalValue}>${bookingDetails.finalPrice}</Text></View>
                        </View>
                    </FadeInView>
                )}
            </ScrollView>

            <FadeInView delay={200} direction="up" style={styles.bottomBar}>
                {bookingDetails ? (
                    <PremiumButton title={`Pay Now $${bookingDetails.finalPrice} 💳`} onPress={confirmPayment} />
                ) : (
                    <View style={{ alignItems: 'center' }}><Text style={{ color: '#aaa' }}>Calculute price to proceed</Text></View>
                )}
            </FadeInView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 120 },
    summaryCard: { borderRadius: 20, padding: 20, marginBottom: 20 },
    itemBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15, marginBottom: 10 },
    itemBadgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
    itemTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    basePriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 12 },
    basePriceLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
    basePriceValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', marginBottom: 10 },
    promoHint: { fontSize: 14, color: '#666', marginBottom: 15 },
    breakdownCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5 },
    breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    breakdownLabel: { color: '#636e72', fontSize: 14 },
    breakdownValue: { color: '#2D3436', fontSize: 16, fontWeight: '600' },
    discountLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    discountBadge: { backgroundColor: '#FF980015', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    discountBadgeText: { color: '#F57C00', fontSize: 11, fontWeight: 'bold' },
    discountValue: { color: '#4CAF50', fontSize: 16, fontWeight: '600' },
    divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 15 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#2D3436' },
    totalValue: { fontSize: 28, fontWeight: 'bold', color: '#6C63FF' },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, paddingBottom: 30, borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10 },
});

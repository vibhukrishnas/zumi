import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Animated, TouchableOpacity } from 'react-native';
import { Title, Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import PremiumButton from '../components/PremiumButton';
import { haptic } from '../utils/haptics';
import { colors, layout, shadows } from '../theme';
import { TextInput } from 'react-native-paper'; // Using Paper input for cleaner look in this specific section

function FadeInView({ children, delay = 0, style }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay, useNativeDriver: true }).start();
    }, []);
    return <Animated.View style={[{ opacity: fadeAnim }, style]}>{children}</Animated.View>;
}

export default function BookingScreen({ route, navigation }) {
    const { id, title, type, price } = route.params;
    const [coupon, setCoupon] = useState('');
    const [loading, setLoading] = useState(true);
    const [calcLoading, setCalcLoading] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [showCoupons, setShowCoupons] = useState(false);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const { signOut } = React.useContext(require('../context/AuthContext').AuthContext);

    useEffect(() => {
        calculatePrice('', true);
        fetchAvailableCoupons();
    }, []);

    const fetchAvailableCoupons = async () => {
        try {
            const response = await api.get('/coupons');
            if (response.data.success) {
                const filtered = response.data.data.filter(
                    c => c.applicable_types === 'all' || c.applicable_types === type
                );
                setAvailableCoupons(filtered);
            }
        } catch (error) {
            // Silently fail - coupons are optional
            setAvailableCoupons([]);
        }
    };

    const calculatePrice = async (code = '', isInitialLoad = false) => {
        if (code) setCalcLoading(true);
        setError(null);

        try {
            // Use calculate endpoint for price preview (no booking created yet)
            const response = await api.post('/bookings/calculate', {
                itemId: id,
                itemType: type || 'event',
                couponCode: code
            });
            
            if (response.data.success) {
                setBookingDetails(response.data.data);
                if (code) {
                    haptic.success();
                }
                setRetryCount(0);
            }
        } catch (error) {
            console.error('Booking calculation error:', error);
            
            // Handle subscription gating
            if (error.response?.status === 403 && error.response?.data?.requiresUpgrade) {
                setLoading(false);
                setCalcLoading(false);
                Alert.alert(
                    "Premium Required 💎",
                    error.response.data.message || "This service requires a Premium subscription.",
                    [
                        { text: "Cancel", style: "cancel", onPress: () => navigation.goBack() },
                        { 
                            text: "Upgrade Now", 
                            onPress: () => navigation.navigate('Subscription') 
                        }
                    ]
                );
                return;
            }
            
            // Handle network errors with retry
            if (!error.response && retryCount < 2) {
                setError('Connection issue. Retrying...');
                setRetryCount(prev => prev + 1);
                setTimeout(() => calculatePrice(code, isInitialLoad), 2000);
                return;
            }
            
            if (code) {
                haptic.error();
                const errorMsg = error.response?.data?.message || "Invalid coupon code";
                Alert.alert("Invalid Coupon", errorMsg);
                setCoupon('');
            }
            
            // Use fallback pricing only if this is initial load
            if (isInitialLoad) {
                setError('Could not connect to server. Using base pricing.');
                setBookingDetails({
                    bookingId: null,
                    originalPrice: price,
                    discounts: {
                        provider: 0,
                        subscription: 0,
                        coupon: 0
                    },
                    finalPrice: price,
                    status: 'offline'
                });
            } else {
                setError('Unable to calculate price. Please try again.');
            }
        } finally {
            setLoading(false);
            setCalcLoading(false);
        }
    };

    const confirmPayment = async () => {
        haptic.light();

        // Validate booking details
        if (!bookingDetails) {
            Alert.alert("Error", "Unable to process booking. Please refresh and try again.");
            return;
        }

        // Warn if using fallback pricing
        if (bookingDetails.status === 'offline') {
            Alert.alert(
                "Offline Mode",
                "Connection to server lost. Please check your internet and try again.",
                [{ text: "OK" }]
            );
            return;
        }

        // Create the actual booking now (at payment time)
        try {
            setLoading(true);
            const response = await api.post('/bookings/initiate', {
                itemId: id,
                itemType: type || 'event',
                couponCode: coupon || undefined
            });

            if (response.data.success) {
                const { bookingId, finalPrice } = response.data.data;
                navigation.navigate('PaymentGateway', {
                    amount: finalPrice,
                    bookingId: bookingId
                });
            }
        } catch (error) {
            console.error('Booking creation error:', error);
            const errorMsg = error.response?.data?.message || 'Failed to create booking. Please try again.';
            Alert.alert('Booking Error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const renderBreakdownItem = (label, value, isDiscount = false, isTotal = false) => (
        <View style={[styles.row, isTotal && styles.totalRow]}>
            <Text style={[styles.label, isTotal && styles.totalLabel, isDiscount && styles.discountLabel]}>{label}</Text>
            <Text style={[styles.value, isTotal && styles.totalValue, isDiscount && styles.discountValue]}>{value}</Text>
        </View>
    );

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Hero Header */}
                <FadeInView style={styles.headerContainer}>
                    <LinearGradient
                        colors={[colors.gradient.start, colors.gradient.end]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroCard}
                    >
                        <View style={styles.iconCircle}>
                            <Ionicons name={type === 'service' ? 'paw' : 'calendar'} size={32} color={colors.primary} />
                        </View>
                        <Text style={styles.heroTitle}>{title}</Text>
                        <View style={styles.priceTag}>
                            <Text style={styles.priceTagText}>${price}</Text>
                        </View>
                    </LinearGradient>
                </FadeInView>

                {/* Calculation Loading State */}
                {loading ? (
                    <View style={styles.centerLoading}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={{ marginTop: 15, color: colors.textLight, fontFamily: 'Outfit_500Medium' }}>Fetching best prices...</Text>
                    </View>
                ) : (
                    <FadeInView delay={200} style={styles.detailsContainer}>
                        {/* Price Breakdown */}
                        {bookingDetails && (
                            <View style={styles.section}>
                                <Text style={styles.sectionHeader}>Billing Details</Text>
                                <View style={styles.card}>
                                    {renderBreakdownItem('Original Price', `$${bookingDetails.originalPrice}`)}

                                    {bookingDetails.discounts.subscription > 0 &&
                                        renderBreakdownItem('Membership Savings', `-${bookingDetails.discounts.subscription}%`, true)
                                    }

                                    {bookingDetails.discounts.coupon > 0 &&
                                        renderBreakdownItem('Promo Code Applied', `-${bookingDetails.discounts.coupon}%`, true)
                                    }

                                    <View style={styles.divider} />
                                    {renderBreakdownItem('Total to Pay', `$${bookingDetails.finalPrice}`, false, true)}
                                </View>
                            </View>
                        )}

                        {/* Promo Code Input */}
                        <View style={styles.section}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <Text style={styles.sectionHeader}>Promo Code</Text>
                                {availableCoupons.length > 0 && (
                                    <TouchableOpacity onPress={() => { haptic.light(); setShowCoupons(!showCoupons); }}>
                                        <Text style={{ color: colors.primary, fontFamily: 'Outfit_600SemiBold', fontSize: 14 }}>
                                            {showCoupons ? 'Hide' : 'View'} Codes
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {showCoupons && availableCoupons.length > 0 && (
                                <View style={styles.couponsList}>
                                    <Text style={styles.couponsTitle}>🎉 Available Discounts:</Text>
                                    {availableCoupons.map((c, idx) => (
                                        <TouchableOpacity 
                                            key={idx} 
                                            style={styles.couponChip}
                                            onPress={() => {
                                                haptic.light();
                                                setCoupon(c.code);
                                                setShowCoupons(false);
                                            }}
                                        >
                                            <View style={styles.couponChipLeft}>
                                                <Text style={styles.couponCode}>{c.code}</Text>
                                                <Text style={styles.couponDesc}>{c.discount_percentage}% OFF</Text>
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}

                            <View style={styles.promoContainer}>
                                <TextInput
                                    style={styles.promoInput}
                                    placeholder="Enter code (optional)"
                                    value={coupon}
                                    onChangeText={setCoupon}
                                    autoCapitalize="characters"
                                    mode="outlined"
                                    outlineColor="transparent"
                                    activeOutlineColor="transparent"
                                    placeholderTextColor={colors.textLight}
                                    theme={{ colors: { background: '#F0F3F5' } }}
                                />
                                <TouchableOpacity
                                    style={[styles.applyBtn, (!coupon || calcLoading) && styles.applyBtnDisabled]}
                                    onPress={() => calculatePrice(coupon)}
                                    disabled={!coupon || calcLoading}
                                >
                                    {calcLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.applyBtnText}>Apply</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </FadeInView>
                )}

            </ScrollView>

            {/* Bottom Action Bar - Always Visible */}
            <FadeInView delay={400} style={styles.bottomBar}>
                {loading ? (
                    <PremiumButton
                        title="Preparing Payment..."
                        disabled={true}
                        style={{ backgroundColor: '#ccc' }}
                    />
                ) : (
                    <PremiumButton
                        title={`Pay $${bookingDetails?.finalPrice || price} Securely`}
                        onPress={confirmPayment}
                        icon="lock-closed"
                    />
                )}
            </FadeInView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    scrollContent: { paddingBottom: 120 },
    headerContainer: { padding: 20, paddingTop: 10 },
    heroCard: {
        borderRadius: 24,
        padding: 25,
        alignItems: 'center',
        ...shadows.medium,
    },
    iconCircle: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center', marginBottom: 15,
        elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5
    },
    heroTitle: {
        fontSize: 24, fontFamily: 'Outfit_700Bold', color: '#fff', textAlign: 'center', marginBottom: 10
    },
    priceTag: {
        backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20
    },
    priceTagText: { fontSize: 18, color: '#fff', fontFamily: 'Outfit_600SemiBold' },

    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },

    detailsContainer: { paddingHorizontal: 20 },
    section: { marginBottom: 25 },
    sectionHeader: {
        fontSize: 16, fontFamily: 'Outfit_600SemiBold', color: colors.textSecondary, marginBottom: 10, marginLeft: 5
    },
    card: {
        backgroundColor: '#fff', borderRadius: 20, padding: 20, ...shadows.small
    },

    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    label: { fontSize: 15, color: colors.textSecondary, fontFamily: 'Outfit_400Regular' },
    value: { fontSize: 16, color: colors.text, fontFamily: 'Outfit_600SemiBold' },

    discountLabel: { color: colors.primary },
    discountValue: { color: colors.primary },

    divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },

    totalRow: { marginTop: 5, alignItems: 'center' },
    totalLabel: { fontSize: 18, fontFamily: 'Outfit_700Bold', color: colors.text },
    totalValue: { fontSize: 24, fontFamily: 'Outfit_700Bold', color: colors.primaryDark },

    promoContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    promoInput: { flex: 1, backgroundColor: '#fff', borderRadius: 12, height: 50, fontSize: 16 },
    applyBtn: {
        backgroundColor: colors.text, height: 50, paddingHorizontal: 20,
        justifyContent: 'center', alignItems: 'center', borderRadius: 12, ...shadows.small
    },
    applyBtnDisabled: { backgroundColor: '#CED6E0', elevation: 0 },
    applyBtnText: { color: '#fff', fontFamily: 'Outfit_600SemiBold' },

    couponsList: {
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#E0F2FE'
    },
    couponsTitle: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        color: colors.text,
        marginBottom: 12
    },
    couponChip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.primary + '30',
        ...shadows.small
    },
    couponChipLeft: {
        flex: 1
    },
    couponCode: {
        fontSize: 15,
        fontFamily: 'Outfit_700Bold',
        color: colors.primary,
        marginBottom: 2
    },
    couponDesc: {
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        color: colors.textSecondary
    },

    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', padding: 20, paddingBottom: 30,
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
        ...shadows.large
    }
});

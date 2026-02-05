import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Dimensions, Animated, Image } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { haptic } from '../utils/haptics';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme';
import ZumiLogo from '../components/ZumiLogo';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

function ActivityGraph() {
    return (
        <Svg height="60" width={width - 80} viewBox="0 0 300 60">
            <Path
                d="M0,40 Q30,30 60,35 T120,25 T180,30 T240,20 T300,25"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <Circle cx="20" cy="38" r="8" fill="rgba(255,255,255,0.3)" />
            <Circle cx="100" cy="28" r="8" fill="rgba(255,255,255,0.3)" />
            <Circle cx="180" cy="32" r="8" fill="rgba(255,255,255,0.3)" />
            <Circle cx="260" cy="22" r="8" fill="rgba(255,255,255,0.3)" />
        </Svg>
    );
}

function BookingCard({ booking, onPress }) {
    const scale = useRef(new Animated.Value(1)).current;
    const handlePressIn = () => { haptic.light(); Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start(); };
    const handlePressOut = () => { Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start(); };

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1}>
                <View style={styles.bookingCard}>
                    <View style={styles.bookingAvatar}>
                        <Ionicons name={booking.icon || 'person-outline'} size={24} color={colors.primary} />
                    </View>
                    <View style={styles.bookingInfo}>
                        <Text style={styles.bookingTitle}>{booking.title}</Text>
                        <Text style={styles.bookingTime}>{booking.time}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function HomeScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [services, setServices] = useState([]);
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({ walks: 30, feedings: 2, playtime: 1 });

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchData = async () => {
        try {
            // Fetch real data from API
            const [bookingsRes, servicesRes, eventsRes, dashboardRes] = await Promise.all([
                api.get('/bookings/user').catch(() => ({ data: { data: [] } })),
                api.get('/services').catch(() => ({ data: { data: [] } })),
                api.get('/events').catch(() => ({ data: { data: [] } })),
                api.get('/dashboard').catch(() => ({ data: { data: {} } })),
            ]);

            // Set real stats from dashboard API
            if (dashboardRes.data?.data?.stats) {
                const s = dashboardRes.data.data.stats;
                setStats({
                    walks: s.walks || 0,
                    feedings: s.feedings || 0,
                    playtime: s.playtime || 0
                });
            }

            // Process bookings for display
            const upcomingBookings = (bookingsRes.data.data || [])
                .filter(b => b.status === 'confirmed' || b.status === 'pending')
                .slice(0, 3)
                .map(b => ({
                    id: b.id,
                    title: b.service_title || b.event_title || 'Booking',
                    time: new Date(b.booking_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
                    icon: b.item_type === 'service' ? 'paw-outline' : 'calendar-outline',
                    type: b.item_type,
                }));

            // If no real bookings, show sample data
            if (upcomingBookings.length === 0) {
                setBookings([
                    { id: 1, title: 'Dog Walker - Tom', time: 'Tomorrow, 10 AM', icon: 'walk-outline' },
                    { id: 2, title: 'Vet Check-up', time: 'Friday, 2 PM', icon: 'medical-outline' },
                ]);
            } else {
                setBookings(upcomingBookings);
            }

            setServices(servicesRes.data.data || []);
            setEvents(eventsRes.data.data || []);
        } catch (error) {
            console.log('Error fetching data:', error);
            // Set default bookings on error
            setBookings([
                { id: 1, title: 'Dog Walker - Tom', time: 'Tomorrow, 10 AM', icon: 'walk-outline' },
                { id: 2, title: 'Vet Check-up', time: 'Friday, 2 PM', icon: 'medical-outline' },
            ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    const onRefresh = () => { haptic.light(); setRefreshing(true); fetchData(); };

    const userName = user?.fullName?.split(' ')[0] || 'Alex';

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ZumiLogo size="large" />
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>

            {/* Logo Header */}
            <View style={styles.logoContainer}>
                <ZumiLogo size="medium" showText={false} />
                <Text style={styles.brandName}>Zumi</Text>
            </View>

            {/* Greeting */}
            <Animated.View style={[styles.greetingContainer, { opacity: fadeAnim }]}>
                <View style={styles.petAvatar}>
                    <Text style={styles.petAvatarEmoji}>🐕</Text>
                </View>
                <Text style={styles.greetingText}>Hello, {userName}!</Text>
            </Animated.View>

            {/* Daily Activity Card */}
            <Animated.View style={[styles.activityCardWrapper, { opacity: fadeAnim }]}>
                <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.activityCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Text style={styles.activityTitle}>Daily Activity</Text>

                    <View style={styles.activityGraph}>
                        <ActivityGraph />
                    </View>

                    <View style={styles.activityStats}>
                        <View style={styles.activityStat}>
                            <Ionicons name="walk-outline" size={18} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.activityStatText}>Walks ({stats.walks} mins)</Text>
                        </View>
                        <View style={styles.activityStat}>
                            <View style={styles.statCircle}><Text style={styles.statNumber}>{stats.feedings}</Text></View>
                            <Text style={styles.activityStatLabel}>Feedings</Text>
                        </View>
                        <View style={styles.activityStat}>
                            <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.9)" />
                            <Text style={styles.activityStatLabel}>Playtime</Text>
                        </View>
                    </View>

                    {/* Paw prints decoration */}
                    <View style={styles.pawDecoration}><Text style={styles.pawDecoEmoji}>🐾</Text></View>
                    <View style={[styles.pawDecoration, styles.pawDecoration2]}><Text style={styles.pawDecoEmoji}>🐾</Text></View>
                </LinearGradient>
            </Animated.View>

            {/* Upcoming Bookings */}
            <Animated.View style={[styles.bookingsSection, { opacity: fadeAnim }]}>
                <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.bookingsHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={styles.bookingsTitle}>Upcoming Bookings</Text>
                </LinearGradient>

                <View style={styles.bookingsList}>
                    {bookings.length > 0 ? bookings.map((booking) => (
                        <BookingCard
                            key={booking.id}
                            booking={booking}
                            onPress={() => {
                                haptic.light();
                                if (booking.type === 'service') {
                                    navigation.navigate('ServiceDetail', { id: booking.id });
                                }
                            }}
                        />
                    )) : (
                        <View style={styles.emptyBookings}>
                            <Text style={styles.emptyText}>No upcoming bookings</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
                                <Text style={styles.bookNowLink}>Book a service now →</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </Animated.View>

            {/* Quick Services Preview */}
            {services.length > 0 && (
                <Animated.View style={[styles.servicesPreview, { opacity: fadeAnim }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Popular Services</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Schedule')}>
                            <Text style={styles.seeAllLink}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesScroll}>
                        {services.slice(0, 5).map((service) => (
                            <TouchableOpacity
                                key={service.id}
                                style={styles.serviceCard}
                                onPress={() => {
                                    haptic.light();
                                    navigation.navigate('ServiceDetail', { id: service.id, title: service.title, type: 'service' });
                                }}
                            >
                                <Image source={{ uri: service.image_url }} style={styles.serviceImage} />
                                <Text style={styles.serviceTitle} numberOfLines={1}>{service.title}</Text>
                                <Text style={styles.servicePrice}>${service.price}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </Animated.View>
            )}

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

    logoContainer: { alignItems: 'center', paddingTop: 15, paddingBottom: 10 },
    brandName: { fontSize: 22, fontWeight: '700', color: '#2E3A59', marginTop: 5 },

    greetingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    petAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    petAvatarEmoji: { fontSize: 28 },
    greetingText: { fontSize: 22, fontWeight: '600', color: colors.text },

    activityCardWrapper: { paddingHorizontal: 20, marginBottom: 20 },
    activityCard: { borderRadius: 24, padding: 20, overflow: 'hidden', position: 'relative' },
    activityTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 15 },
    activityGraph: { marginVertical: 10, alignItems: 'center' },
    activityStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    activityStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    activityStatText: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' },
    activityStatLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' },
    statCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    statNumber: { color: '#fff', fontSize: 12, fontWeight: '600' },
    pawDecoration: { position: 'absolute', top: 60, right: 20, opacity: 0.3 },
    pawDecoration2: { top: 80, right: 60 },
    pawDecoEmoji: { fontSize: 24 },

    bookingsSection: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.card, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
    bookingsHeader: { paddingVertical: 14, paddingHorizontal: 20 },
    bookingsTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
    bookingsList: { padding: 10 },

    bookingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 8 },
    bookingAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    bookingInfo: { flex: 1 },
    bookingTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
    bookingTime: { fontSize: 13, color: colors.textSecondary },

    emptyBookings: { padding: 20, alignItems: 'center' },
    emptyText: { color: colors.textSecondary, fontSize: 14 },
    bookNowLink: { color: colors.primary, fontWeight: '600', marginTop: 8 },

    servicesPreview: { marginTop: 20, paddingBottom: 10 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    seeAllLink: { color: colors.primary, fontWeight: '600' },
    servicesScroll: { paddingHorizontal: 20, gap: 12 },
    serviceCard: { width: 140, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
    serviceImage: { width: '100%', height: 90, backgroundColor: '#E8E8E8' },
    serviceTitle: { fontSize: 14, fontWeight: '600', color: colors.text, padding: 10, paddingBottom: 4 },
    servicePrice: { fontSize: 14, fontWeight: '700', color: colors.primary, paddingHorizontal: 10, paddingBottom: 10 },

    bottomSpacer: { height: 100 },
});

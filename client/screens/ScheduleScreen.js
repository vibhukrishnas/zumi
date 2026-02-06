import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import api from '../services/api';
import ZumiLogo from '../components/ZumiLogo';
import { AuthContext } from '../context/AuthContext';

function TabButton({ title, isActive, onPress }) {
    return (
        <TouchableOpacity onPress={() => { haptic.light(); onPress(); }} style={[styles.tabButton, isActive && styles.tabButtonActive]}>
            <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>{title}</Text>
        </TouchableOpacity>
    );
}

function ScheduleCard({ item, index, onPress }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 100, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 100, useNativeDriver: true }),
        ]).start();
    }, []);

    const getIconBg = () => {
        switch (item.type) {
            case 'walker': return '#E8F5F1';
            case 'vet': return '#E3F8F5';
            default: return `${colors.primary}15`;
        }
    };

    const getIcon = () => {
        switch (item.type) {
            case 'walker': return 'walk-outline';
            case 'vet': return 'medical-outline';
            case 'grooming': return 'cut-outline';
            default: return 'calendar-outline';
        }
    };

    const getActionIcon = () => {
        switch (item.type) {
            case 'vet': return { name: 'shield-checkmark', color: colors.accent };
            default: return { name: 'calendar-outline', color: colors.primary };
        }
    };

    const actionIcon = getActionIcon();

    return (
        <Animated.View style={[styles.scheduleCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity style={styles.scheduleCardInner} onPress={() => { haptic.light(); onPress?.(); }} activeOpacity={0.8}>
                <View style={[styles.scheduleAvatar, { backgroundColor: getIconBg() }]}>
                    <Ionicons name={getIcon()} size={24} color={colors.primary} />
                </View>
                <View style={styles.scheduleInfo}>
                    <Text style={styles.scheduleTitle}>{item.title}</Text>
                    <Text style={styles.scheduleTime}>{item.time}</Text>
                </View>
                <View style={[styles.scheduleAction, { backgroundColor: `${actionIcon.color}15` }]}>
                    <Ionicons name={actionIcon.name} size={20} color={actionIcon.color} />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function ScheduleScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [bookings, setBookings] = useState({ upcoming: [], history: [], requests: [] });

    const fetchBookings = async () => {
        try {
            const response = await api.get('/bookings/user');
            const allBookings = response.data.data || [];

            const now = new Date();
            const upcoming = allBookings
                .filter(b => new Date(b.booking_date) >= now && b.status !== 'cancelled')
                .map(b => ({
                    id: b.id,
                    title: b.service_title || b.event_title || 'Booking',
                    time: new Date(b.booking_date).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
                    type: b.item_type === 'service' ? 'walker' : 'vet',
                    status: b.status,
                }));

            const history = allBookings
                .filter(b => new Date(b.booking_date) < now || b.status === 'completed')
                .map(b => ({
                    id: b.id,
                    title: b.service_title || b.event_title || 'Booking',
                    time: new Date(b.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    type: b.item_type === 'service' ? 'grooming' : 'vet',
                    status: b.status,
                }));

            const requests = allBookings
                .filter(b => b.status === 'pending')
                .map(b => ({
                    id: b.id,
                    title: b.service_title || b.event_title || 'Pending Request',
                    time: 'Pending approval',
                    type: 'walker',
                    status: b.status,
                }));

            setBookings({ upcoming, history, requests });
        } catch (error) {
            console.log('Error fetching bookings:', error);
            // Set sample data on error
            setBookings({
                upcoming: [
                    { id: 1, title: 'Dog Walker - Tom', time: 'Tomorrow, 10:00 AM', type: 'walker' },
                    { id: 2, title: 'Dog Walker - Tom', time: '10:00 AM', type: 'walker' },
                    { id: 3, title: 'Vet Check-up', time: 'Friday, 2 PM', type: 'vet' },
                ],
                history: [
                    { id: 4, title: 'Grooming Session', time: 'Last Week', type: 'grooming' },
                ],
                requests: [],
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const onRefresh = () => {
        haptic.light();
        setRefreshing(true);
        fetchBookings();
    };

    const currentItems = bookings[activeTab] || [];

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <ZumiLogo size="small" showText={false} />
                <Text style={styles.headerTitle}>Schedule</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TabButton title="Upcoming" isActive={activeTab === 'upcoming'} onPress={() => setActiveTab('upcoming')} />
                <TabButton title="History" isActive={activeTab === 'history'} onPress={() => setActiveTab('history')} />
                <TabButton title="Requests" isActive={activeTab === 'requests'} onPress={() => setActiveTab('requests')} />
            </View>

            {/* Schedule List */}
            <ScrollView
                style={styles.scheduleList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scheduleListContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
                ) : currentItems.length > 0 ? (
                    currentItems.map((item, index) => (
                        <ScheduleCard
                            key={item.id}
                            item={item}
                            index={index}
                            onPress={() => {
                                haptic.light();
                                // Navigate to Detail screen to view/manage booking
                                navigation.navigate('Detail', { 
                                    id: item.id, 
                                    title: item.title,
                                    type: item.type || 'service',
                                    bookingId: item.id
                                });
                            }}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📅</Text>
                        <Text style={styles.emptyText}>No {activeTab} bookings</Text>
                        {activeTab === 'upcoming' && (
                            <TouchableOpacity style={styles.bookButton} onPress={() => { haptic.light(); navigation.navigate('Home'); }}>
                                <Text style={styles.bookButtonText}>Book a Service</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    logoContainer: { alignItems: 'center', paddingTop: 20, paddingBottom: 15 },
    headerTitle: { fontSize: 22, fontWeight: '700', color: colors.primary, marginTop: 8 },

    tabsContainer: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 8 },
    tabButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    tabButtonActive: { borderColor: colors.primary, borderBottomWidth: 2 },
    tabButtonText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
    tabButtonTextActive: { color: colors.primary, fontWeight: '600' },

    scheduleList: { flex: 1 },
    scheduleListContent: { paddingHorizontal: 20, paddingBottom: 100 },

    scheduleCard: { marginBottom: 12 },
    scheduleCardInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F8F5', borderRadius: 16, padding: 16 },
    scheduleAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    scheduleInfo: { flex: 1 },
    scheduleTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 3 },
    scheduleTime: { fontSize: 13, color: colors.textSecondary },
    scheduleAction: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, color: colors.textSecondary, marginBottom: 16 },
    bookButton: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
    bookButtonText: { color: '#fff', fontWeight: '600' },

    loader: { marginTop: 40 },
});

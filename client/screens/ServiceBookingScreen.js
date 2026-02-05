import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Image, Dimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import ZumiLogo from '../components/ZumiLogo';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

function TabButton({ title, isActive, onPress }) {
    return (
        <TouchableOpacity onPress={() => { haptic.light(); onPress(); }} style={[styles.tabButton, isActive && styles.tabButtonActive]}>
            <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>{title}</Text>
            {isActive && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
    );
}

function ServiceCard({ service, index, onPress }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 100, useNativeDriver: true }).start();
    }, []);

    const getGradient = () => {
        // Map service types/titles to colors
        const type = (service.type || service.title || '').toLowerCase();
        if (type.includes('walk')) return ['#4ECDC4', '#A8E6CF']; // Teal/Mint
        if (type.includes('sit')) return ['#74EBD5', '#9FACE6']; // Cyan/Blue
        if (type.includes('vet') || type.includes('medic')) return ['#81FBB8', '#28C76F']; // Green
        if (type.includes('groom')) return ['#FF9A9E', '#FECFEF']; // Pink
        return [colors.secondary, colors.primary]; // Default
    };

    const getIcon = () => {
        const type = (service.type || service.title || '').toLowerCase();
        if (type.includes('walk')) return 'walk';
        if (type.includes('sit')) return 'home';
        if (type.includes('vet')) return 'medkit';
        if (type.includes('groom')) return 'cut';
        return 'paw';
    };

    return (
        <Animated.View style={[styles.serviceCardWrapper, { opacity: fadeAnim }]}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                <LinearGradient
                    colors={getGradient()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.serviceCard}
                >
                    <View style={styles.serviceIconContainer}>
                        <Ionicons name={getIcon()} size={32} color="#fff" />
                    </View>
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceTitle}>{service.title}</Text>
                        <Text style={styles.servicePrice}>from ${service.price}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

function ScheduleCard({ item, index }) {
    return (
        <View style={styles.scheduleCard}>
            <View style={[styles.cardIcon, { backgroundColor: item.type === 'service' ? '#E0F7FA' : '#E8F5E9' }]}>
                <Ionicons
                    name={item.type === 'service' ? 'walk-outline' : 'medical-outline'}
                    size={24}
                    color={item.type === 'service' ? colors.primary : '#4CAF50'}
                />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardTime}>{item.time}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'confirmed' ? '#E8F5E9' : '#FFF3E0' }]}>
                <Text style={[styles.statusText, { color: item.status === 'confirmed' ? '#4CAF50' : '#FF9800' }]}>
                    {item.status}
                </Text>
            </View>
        </View>
    );
}

export default function ServiceBookingScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('book');
    const [loading, setLoading] = useState(false);
    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState({ upcoming: [], history: [], requests: [] });

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'book') {
                // Fetch Services dynamically
                const response = await api.get('/services');
                setServices(response.data.data || []);
            } else {
                // Fetch Bookings
                const response = await api.get('/bookings/user');
                const allBookings = response.data.data || [];

                const now = new Date();
                const upcoming = allBookings
                    .filter(b => b.status === 'pending' || (new Date(b.booking_date) >= now && b.status !== 'cancelled'))
                    .map(formatBooking);

                const history = allBookings
                    .filter(b => new Date(b.booking_date) < now || b.status === 'completed' || b.status === 'cancelled')
                    .map(formatBooking);

                setBookings({ requests: upcoming, history: history });
            }
        } catch (error) {
            console.log('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatBooking = (b) => ({
        id: b.id,
        title: b.service_title || b.event_title || 'Booking',
        time: new Date(b.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        type: b.item_type,
        status: b.status
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <ZumiLogo size="small" />
                <Text style={styles.pageTitle}>Bookings</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TabButton title="Book a Service" isActive={activeTab === 'book'} onPress={() => setActiveTab('book')} />
                <TabButton title="My Requests" isActive={activeTab === 'requests'} onPress={() => setActiveTab('requests')} />
                <TabButton title="History" isActive={activeTab === 'history'} onPress={() => setActiveTab('history')} />
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                ) : activeTab === 'book' ? (
                    <View style={styles.servicesGrid}>
                        {services.length > 0 ? services.map((service, index) => (
                            <ServiceCard
                                key={service.id}
                                service={service}
                                index={index}
                                onPress={() => {
                                    haptic.light();
                                    navigation.navigate('ServiceDetail', { id: service.id, title: service.title, type: 'service' });
                                }}
                            />
                        )) : (
                            <Text style={styles.emptyText}>No services available</Text>
                        )}
                    </View>
                ) : (
                    <View style={styles.bookingsList}>
                        {bookings[activeTab]?.length > 0 ? (
                            bookings[activeTab].map((item, index) => (
                                <ScheduleCard key={item.id} item={item} index={index} />
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No {activeTab} found</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },

    header: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },
    pageTitle: { fontSize: 24, fontWeight: '700', color: '#2E3A59', marginTop: 10 },

    tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    tabButton: { marginRight: 20, paddingBottom: 10, paddingTop: 10 },
    tabButtonActive: {},
    tabButtonText: { fontSize: 16, color: '#A4B0BE', fontWeight: '500' },
    tabButtonTextActive: { color: '#2E3A59', fontWeight: '700' },
    tabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent, borderRadius: 1.5 },

    content: { flex: 1, backgroundColor: '#FAFBFF' },
    scrollContent: { padding: 20, paddingBottom: 100 },

    servicesGrid: { gap: 15 },
    serviceCardWrapper: {},
    serviceCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, height: 100 },
    serviceIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    serviceInfo: { flex: 1 },
    serviceTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    servicePrice: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

    scheduleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    cardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: '600', color: '#2E3A59' },
    cardTime: { fontSize: 13, color: '#8F9BB3' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },

    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyText: { color: '#8F9BB3' },
});

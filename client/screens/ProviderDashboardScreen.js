import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import api from '../services/api';

export default function ProviderDashboardScreen({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBookings = async () => {
        try {
            const response = await api.get('/provider/bookings');
            setBookings(response.data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await api.put(`/provider/bookings/${id}/status`, { status: newStatus });
            fetchBookings();
        } catch (error) {
            Alert.alert('Error', 'Could not update status');
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.title}>{item.item_title}</Text>
                <View style={[styles.badge, styles[`status_${item.status}`]]}>
                    <Text style={styles.badgeText}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.row}>
                <Ionicons name="person" size={16} color="#666" />
                <Text style={styles.info}>{item.user_name}</Text>
            </View>
            <View style={styles.row}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.info}>{new Date(item.booking_date).toLocaleString()}</Text>
            </View>
            <View style={styles.row}>
                <Ionicons name="cash" size={16} color="#666" />
                <Text style={styles.info}>${item.final_price}</Text>
            </View>

            <View style={styles.actions}>
                {item.status === 'confirmed' && (
                    <TouchableOpacity style={[styles.btn, styles.btnComplete]} onPress={() => handleStatusUpdate(item.id, 'completed')}>
                        <Text style={styles.btnText}>Complete</Text>
                    </TouchableOpacity>
                )}
                {item.status === 'pending_payment' && (
                    <Text style={{ color: 'orange' }}>Waiting for Payment</Text>
                )}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Provider Dashboard</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ProviderAvailability')}>
                    <Ionicons name="settings-outline" size={24} color="#000" />
                </TouchableOpacity>
            </View>
            {loading ? <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} /> : (
                <FlatList
                    data={bookings}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 20 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBookings(); }} />}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>No bookings assigned.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fd', paddingTop: 40 },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
    navTitle: { fontSize: 20, fontWeight: 'bold' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    title: { fontSize: 16, fontWeight: 'bold' },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#eee' },
    badgeText: { fontSize: 12, fontWeight: 'bold' },
    status_confirmed: { backgroundColor: '#e8f5e9' },
    status_completed: { backgroundColor: '#e3f2fd' },
    status_pending_payment: { backgroundColor: '#fff3e0' },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, gap: 8 },
    info: { color: '#555' },
    actions: { marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
    btn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
    btnComplete: { backgroundColor: colors.primary },
    btnText: { color: '#fff', fontWeight: '600' }
});

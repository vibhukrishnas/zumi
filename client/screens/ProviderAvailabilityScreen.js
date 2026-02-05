import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Switch, Alert, TouchableOpacity } from 'react-native';
import { Text, Title, ActivityIndicator } from 'react-native-paper';
import { colors } from '../theme';
import api from '../services/api';
import PremiumButton from '../components/PremiumButton';
import { Ionicons } from '@expo/vector-icons';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function ProviderAvailabilityScreen({ navigation }) {
    const [schedule, setSchedule] = useState(DAYS.map(day => ({ day, start: '09:00', end: '17:00', active: true })));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAvailability();
    }, []);

    const fetchAvailability = async () => {
        try {
            const res = await api.get('/provider/availability');
            if (res.data.data.length > 0) {
                // Merge DB data with defaults
                const dbMap = new Map(res.data.data.map(i => [i.day_of_week, i]));
                const newSchedule = DAYS.map(day => {
                    const found = dbMap.get(day);
                    if (found) return { day, start: found.start_time, end: found.end_time, active: true };
                    return { day, start: '09:00', end: '17:00', active: false };
                });
                setSchedule(newSchedule);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (index) => {
        const newSched = [...schedule];
        newSched[index].active = !newSched[index].active;
        setSchedule(newSched);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/provider/availability', { schedule });
            Alert.alert('Saved', 'Your availability has been updated.');
        } catch (error) {
            Alert.alert('Error', 'Failed to save availability');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} onPress={() => navigation.goBack()} />
                <Title style={styles.title}>Manage Schedule</Title>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>Set your weekly availability.</Text>

                {schedule.map((slot, index) => (
                    <View key={slot.day} style={styles.row}>
                        <View>
                            <Text style={styles.dayName}>{slot.day}</Text>
                            <Text style={{ color: slot.active ? '#666' : '#ccc' }}>
                                {slot.active ? `${slot.start} - ${slot.end}` : 'Unavailable'}
                            </Text>
                        </View>
                        <Switch
                            value={slot.active}
                            onValueChange={() => toggleDay(index)}
                            trackColor={{ false: "#767577", true: colors.primary }}
                        />
                    </View>
                ))}

                <PremiumButton
                    title={saving ? "Saving..." : "Save Schedule"}
                    onPress={handleSave}
                    loading={saving}
                    style={{ marginTop: 20 }}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    subtitle: { marginBottom: 20, color: '#666' },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    dayName: { fontSize: 16, fontWeight: '600' },
});

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import api from '../services/api';

const ACTIVITY_TYPES = [
    { type: 'walk', label: 'Walk', icon: 'walk-outline', color: '#4CAF50' },
    { type: 'feeding', label: 'Feeding', icon: 'restaurant-outline', color: '#FF9800' },
    { type: 'grooming', label: 'Grooming', icon: 'cut-outline', color: '#9C27B0' },
    { type: 'vet_visit', label: 'Vet Visit', icon: 'medical-outline', color: '#F44336' },
    { type: 'medication', label: 'Medication', icon: 'medkit-outline', color: '#E91E63' },
    { type: 'training', label: 'Training', icon: 'school-outline', color: '#2196F3' },
    { type: 'play', label: 'Play Time', icon: 'game-controller-outline', color: '#00BCD4' },
    { type: 'booking', label: 'Booking', icon: 'calendar-outline', color: colors.primary },
    { type: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#607D8B' },
];

function ActivityItem({ activity, index }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
        ]).start();
    }, []);

    const activityConfig = ACTIVITY_TYPES.find(a => a.type === activity.activity_type) || ACTIVITY_TYPES[8];
    const date = new Date(activity.activity_date);
    const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    return (
        <Animated.View style={[styles.activityItem, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.activityIcon, { backgroundColor: `${activityConfig.color}20` }]}>
                <Ionicons name={activityConfig.icon} size={20} color={activityConfig.color} />
            </View>
            <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                {activity.description && <Text style={styles.activityDesc}>{activity.description}</Text>}
                <Text style={styles.activityTime}>{timeStr}</Text>
            </View>
            {activity.duration_minutes && (
                <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{activity.duration_minutes}m</Text>
                </View>
            )}
        </Animated.View>
    );
}

function AddActivityModal({ visible, onClose, onAdd, petName }) {
    const [activityType, setActivityType] = useState('walk');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [duration, setDuration] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }
        setLoading(true);
        await onAdd({
            activity_type: activityType,
            title: title.trim(),
            description: description.trim() || null,
            duration_minutes: duration ? parseInt(duration) : null,
        });
        setLoading(false);
        setTitle('');
        setDescription('');
        setDuration('');
        setActivityType('walk');
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Log Activity for {petName}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.inputLabel}>Activity Type</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                        {ACTIVITY_TYPES.filter(a => a.type !== 'booking').map(at => (
                            <TouchableOpacity
                                key={at.type}
                                style={[styles.typeChip, activityType === at.type && { backgroundColor: at.color }]}
                                onPress={() => { haptic.light(); setActivityType(at.type); }}
                            >
                                <Ionicons name={at.icon} size={16} color={activityType === at.type ? '#fff' : at.color} />
                                <Text style={[styles.typeChipText, activityType === at.type && { color: '#fff' }]}>{at.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={styles.inputLabel}>Title</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Morning walk, Breakfast, etc."
                    />

                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Any additional notes..."
                        multiline
                    />

                    <Text style={styles.inputLabel}>Duration (minutes, optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={duration}
                        onChangeText={setDuration}
                        placeholder="30"
                        keyboardType="numeric"
                    />

                    <TouchableOpacity onPress={handleAdd} disabled={loading}>
                        <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.addBtn}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>Log Activity</Text>}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

export default function PetDetailScreen({ route, navigation }) {
    const { petId } = route.params;
    const [pet, setPet] = useState(null);
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchData = async () => {
        try {
            const [petRes, activitiesRes, statsRes] = await Promise.all([
                api.get(`/pets/${petId}`),
                api.get(`/pets/${petId}/activities?limit=30`),
                api.get(`/pets/${petId}/stats`),
            ]);
            setPet(petRes.data.data);
            setActivities(activitiesRes.data.data);
            setStats(statsRes.data.data);
        } catch (error) {
            console.error('Error fetching pet data:', error);
            Alert.alert('Error', 'Failed to load pet details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [petId]);

    const onRefresh = () => {
        haptic.light();
        setRefreshing(true);
        fetchData();
    };

    const handleAddActivity = async (activityData) => {
        try {
            await api.post(`/pets/${petId}/activities`, activityData);
            haptic.success();
            setShowAddModal(false);
            fetchData();
        } catch (error) {
            haptic.error();
            Alert.alert('Error', 'Failed to log activity');
        }
    };

    const getPetEmoji = () => {
        switch (pet?.species) {
            case 'Cat': return '🐱';
            case 'Bird': return '🐦';
            case 'Fish': return '🐠';
            case 'Rabbit': return '🐰';
            default: return '🐶';
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={[colors.gradient.start, colors.gradient.end]} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.petHeaderInfo}>
                    <View style={styles.petAvatar}>
                        <Text style={styles.petEmoji}>{getPetEmoji()}</Text>
                    </View>
                    <Text style={styles.petName}>{pet?.name}</Text>
                    <Text style={styles.petBreed}>{pet?.breed || pet?.species} • {pet?.age ? `${pet.age} years` : 'Age unknown'}</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('AddPet', { pet, editMode: true })} style={styles.editBtn}>
                    <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Stats Cards */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Ionicons name="fitness-outline" size={22} color={colors.primary} />
                    <Text style={styles.statValue}>{stats?.recentActivities || 0}</Text>
                    <Text style={styles.statLabel}>This Week</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="calendar-outline" size={22} color="#4CAF50" />
                    <Text style={styles.statValue}>{stats?.totalBookings || 0}</Text>
                    <Text style={styles.statLabel}>Bookings</Text>
                </View>
                <View style={styles.statCard}>
                    <Ionicons name="walk-outline" size={22} color="#FF9800" />
                    <Text style={styles.statValue}>{stats?.activityCounts?.walk || 0}</Text>
                    <Text style={styles.statLabel}>Walks</Text>
                </View>
            </View>

            {/* Activity Timeline */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Activity Timeline</Text>
                <TouchableOpacity onPress={() => { haptic.light(); setShowAddModal(true); }}>
                    <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.addActivityBtn}>
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text style={styles.addActivityText}>Log</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.activityList}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {activities.length > 0 ? (
                    activities.map((activity, index) => (
                        <ActivityItem key={activity.id} activity={activity} index={index} />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyText}>No activities logged yet</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(true)} style={styles.emptyBtn}>
                            <Text style={styles.emptyBtnText}>Log First Activity</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            <AddActivityModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onAdd={handleAddActivity}
                petName={pet?.name}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FD' },

    header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    backBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
    editBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
    petHeaderInfo: { alignItems: 'center' },
    petAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    petEmoji: { fontSize: 40 },
    petName: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 4 },
    petBreed: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

    statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 15, marginTop: -20 },
    statCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, alignItems: 'center', width: '30%', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    statValue: { fontSize: 22, fontWeight: '700', color: colors.text, marginVertical: 4 },
    statLabel: { fontSize: 11, color: colors.textSecondary },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    addActivityBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    addActivityText: { color: '#fff', fontWeight: '600', marginLeft: 4 },

    activityList: { flex: 1, paddingHorizontal: 20 },
    activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
    activityIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    activityInfo: { flex: 1 },
    activityTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    activityDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    activityTime: { fontSize: 12, color: colors.textLight, marginTop: 4 },
    durationBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    durationText: { fontSize: 12, fontWeight: '600', color: colors.primary },

    emptyState: { alignItems: 'center', paddingVertical: 50 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, color: colors.textSecondary, marginBottom: 16 },
    emptyBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    emptyBtnText: { color: '#fff', fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    inputLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 12, marginBottom: 8 },
    input: { backgroundColor: '#F0F3F5', borderRadius: 12, padding: 14, fontSize: 16 },
    typeScroll: { marginBottom: 5 },
    typeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F3F5', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
    typeChipText: { marginLeft: 6, fontWeight: '500', color: colors.text },
    addBtn: { marginTop: 20, padding: 16, borderRadius: 14, alignItems: 'center' },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

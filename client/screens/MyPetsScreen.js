import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import api from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';

export default function MyPetsScreen({ navigation }) {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPets = async () => {
        try {
            const response = await api.get('/pets');
            setPets(response.data.data || []);
        } catch (error) {
            console.error('Error fetching pets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Refresh when screen comes into focus (after adding/editing pet)
    useFocusEffect(
        useCallback(() => {
            fetchPets();
        }, [])
    );

    const onRefresh = () => {
        haptic.light();
        setRefreshing(true);
        fetchPets();
    };

    const handleDelete = (id, name) => {
        haptic.medium();
        Alert.alert(
            'Delete Pet',
            `Are you sure you want to remove ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/pets/${id}`);
                            fetchPets();
                            haptic.success();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete pet');
                        }
                    }
                }
            ]
        );
    };

    const getPetEmoji = (species) => {
        switch (species) {
            case 'Cat': return '🐱';
            case 'Bird': return '🐦';
            case 'Fish': return '🐠';
            case 'Rabbit': return '🐰';
            default: return '🐶';
        }
    };

    const renderPet = ({ item }) => (
        <TouchableOpacity
            style={styles.petCard}
            onPress={() => {
                haptic.light();
                navigation.navigate('PetDetail', { petId: item.id });
            }}
            activeOpacity={0.7}
        >
            <View style={styles.petAvatar}>
                <Text style={styles.petEmoji}>{getPetEmoji(item.species)}</Text>
            </View>
            <View style={styles.petInfo}>
                <Text style={styles.petName}>{item.name}</Text>
                <Text style={styles.petDetails}>
                    {item.breed || item.species}
                    {item.age ? ` • ${item.age} years` : ''}
                    {item.weight ? ` • ${item.weight}kg` : ''}
                </Text>
            </View>
            <View style={styles.petActions}>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                        haptic.light();
                        navigation.navigate('AddPet', { pet: item, editMode: true });
                    }}
                >
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item.id, item.name)}
                >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Pets</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={pets}
                    renderItem={renderPet}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🐾</Text>
                            <Text style={styles.emptyText}>No pets added yet</Text>
                            <Text style={styles.emptySubtext}>Add your furry friends to track their activities and services!</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddPet')}>
                <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.addGradient}>
                    <Ionicons name="add" size={30} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    list: { padding: 20, paddingBottom: 100 },

    petCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    petAvatar: {
        width: 55,
        height: 55,
        borderRadius: 28,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    petEmoji: { fontSize: 28 },
    petInfo: { flex: 1 },
    petName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
    petDetails: { fontSize: 14, color: colors.textSecondary },

    petActions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: `${colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteBtn: { backgroundColor: `${colors.error}15` },

    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 64, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },

    addButton: { position: 'absolute', bottom: 30, right: 30 },
    addGradient: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});

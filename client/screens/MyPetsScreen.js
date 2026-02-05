import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import api from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

export default function MyPetsScreen({ navigation }) {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPets();
    }, []);

    const fetchPets = async () => {
        try {
            const response = await api.get('/pets');
            setPets(response.data.data);
        } catch (error) {
            console.error('Error', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        haptic.medium();
        Alert.alert('Delete Pet', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await api.delete(`/pets/${id}`);
                    fetchPets();
                    haptic.success();
                }
            }
        ]);
    };

    const renderPet = ({ item }) => (
        <View style={styles.petCard}>
            <View style={styles.petAvatar}>
                <Text style={styles.petEmoji}>{item.species === 'Cat' ? '🐱' : '🐶'}</Text>
            </View>
            <View style={styles.petInfo}>
                <Text style={styles.petName}>{item.name}</Text>
                <Text style={styles.petDetails}>{item.breed} • {item.age} years</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
        </View>
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

            {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} /> :
                <FlatList
                    data={pets}
                    renderItem={renderPet}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<Text style={styles.emptyText}>No pets added yet.</Text>}
                />
            }

            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddPet')}>
                <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.addGradient}>
                    <Ionicons name="add" size={30} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    list: { padding: 20 },
    petCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FD', padding: 15, borderRadius: 16, marginBottom: 15 },
    petAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    petEmoji: { fontSize: 24 },
    petInfo: { flex: 1 },
    petName: { fontSize: 18, fontWeight: '600' },
    petDetails: { color: colors.textSecondary },
    emptyText: { textAlign: 'center', marginTop: 50, color: colors.textSecondary },
    addButton: { position: 'absolute', bottom: 30, right: 30 },
    addGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 }
});

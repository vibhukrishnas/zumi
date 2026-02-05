import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../theme';
import api from '../services/api';
import { haptic } from '../utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function AddPetScreen({ navigation }) {
    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [species, setSpecies] = useState('Dog');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name) return Alert.alert('Error', 'Name is required');

        setLoading(true);
        try {
            await api.post('/pets', { name, breed, age, species });
            haptic.success();
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', 'Failed to add pet');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add New Pet</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Pet Name</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Buddy" />

                <Text style={styles.label}>Species</Text>
                <View style={styles.speciesRow}>
                    {['Dog', 'Cat', 'Bird'].map(s => (
                        <TouchableOpacity key={s} onPress={() => setSpecies(s)} style={[styles.speciesChip, species === s && styles.activeChip]}>
                            <Text style={[styles.speciesText, species === s && styles.activeText]}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Breed</Text>
                <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="Golden Retriever" />

                <Text style={styles.label}>Age</Text>
                <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" placeholder="3" />

                <TouchableOpacity onPress={handleSave} disabled={loading} style={{ marginTop: 20 }}>
                    <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.saveButton}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Pet</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
    headerTitle: { fontSize: 20, fontWeight: '700' },
    content: { padding: 20 },
    label: { fontWeight: '600', marginBottom: 8, marginTop: 15 },
    input: { backgroundColor: '#F8F9FD', padding: 15, borderRadius: 12 },
    speciesRow: { flexDirection: 'row', gap: 10 },
    speciesChip: { padding: 10, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 20 },
    activeChip: { backgroundColor: colors.primary },
    speciesText: { color: '#000' },
    activeText: { color: '#fff', fontWeight: 'bold' },
    saveButton: { padding: 18, borderRadius: 16, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

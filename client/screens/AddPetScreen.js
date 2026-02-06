import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { colors } from '../theme';
import api from '../services/api';
import { haptic } from '../utils/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Other'];

export default function AddPetScreen({ route, navigation }) {
    const editMode = route.params?.editMode || false;
    const existingPet = route.params?.pet || null;

    const [name, setName] = useState('');
    const [breed, setBreed] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [notes, setNotes] = useState('');
    const [species, setSpecies] = useState('Dog');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editMode && existingPet) {
            setName(existingPet.name || '');
            setBreed(existingPet.breed || '');
            setAge(existingPet.age?.toString() || '');
            setWeight(existingPet.weight?.toString() || '');
            setNotes(existingPet.notes || '');
            setSpecies(existingPet.species || 'Dog');
        }
    }, [editMode, existingPet]);

    const handleSave = async () => {
        if (!name.trim()) {
            haptic.error();
            return Alert.alert('Error', 'Pet name is required');
        }

        setLoading(true);
        try {
            const petData = {
                name: name.trim(),
                species,
                breed: breed.trim() || null,
                age: age ? parseInt(age) : null,
                weight: weight ? parseFloat(weight) : null,
                notes: notes.trim() || null,
            };

            if (editMode && existingPet) {
                await api.put(`/pets/${existingPet.id}`, petData);
                haptic.success();
                Alert.alert('Success', 'Pet updated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                await api.post('/pets', petData);
                haptic.success();
                Alert.alert('Success', `${name} has been added!`, [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error) {
            haptic.error();
            Alert.alert('Error', editMode ? 'Failed to update pet' : 'Failed to add pet');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{editMode ? 'Edit Pet' : 'Add New Pet'}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Pet Avatar Preview */}
                    <View style={styles.avatarPreview}>
                        <Text style={styles.avatarEmoji}>
                            {species === 'Cat' ? '🐱' : species === 'Bird' ? '🐦' : species === 'Fish' ? '🐠' : species === 'Rabbit' ? '🐰' : '🐶'}
                        </Text>
                    </View>

                    <Text style={styles.label}>Pet Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g., Buddy, Max, Luna"
                        placeholderTextColor={colors.textLight}
                    />

                    <Text style={styles.label}>Species</Text>
                    <View style={styles.speciesRow}>
                        {SPECIES_OPTIONS.map(s => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => { haptic.light(); setSpecies(s); }}
                                style={[styles.speciesChip, species === s && styles.activeChip]}
                            >
                                <Text style={[styles.speciesText, species === s && styles.activeText]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Breed</Text>
                    <TextInput
                        style={styles.input}
                        value={breed}
                        onChangeText={setBreed}
                        placeholder="e.g., Golden Retriever, Persian"
                        placeholderTextColor={colors.textLight}
                    />

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Age (years)</Text>
                            <TextInput
                                style={styles.input}
                                value={age}
                                onChangeText={setAge}
                                keyboardType="numeric"
                                placeholder="e.g., 3"
                                placeholderTextColor={colors.textLight}
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={styles.label}>Weight (kg)</Text>
                            <TextInput
                                style={styles.input}
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="decimal-pad"
                                placeholder="e.g., 12.5"
                                placeholderTextColor={colors.textLight}
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                        style={[styles.input, styles.notesInput]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Any allergies, special needs, etc."
                        placeholderTextColor={colors.textLight}
                        multiline
                        textAlignVertical="top"
                    />

                    <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButtonWrapper}>
                        <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.saveButton}>
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name={editMode ? 'checkmark-circle' : 'add-circle'} size={22} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.btnText}>{editMode ? 'Update Pet' : 'Add Pet'}</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
    scrollView: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },

    avatarPreview: {
        alignSelf: 'center',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
    },
    avatarEmoji: { fontSize: 50 },

    label: { fontWeight: '600', color: colors.textSecondary, marginBottom: 8, marginTop: 15 },
    input: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    notesInput: { height: 100 },

    row: { flexDirection: 'row', gap: 15 },
    halfInput: { flex: 1 },

    speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    speciesChip: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
    speciesText: { color: colors.text, fontWeight: '500' },
    activeText: { color: '#fff', fontWeight: '600' },

    saveButtonWrapper: { marginTop: 30 },
    saveButton: {
        flexDirection: 'row',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

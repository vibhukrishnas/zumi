import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, Title } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import api from '../services/api';
import PremiumButton from '../components/PremiumButton';

export default function AddReviewScreen({ route, navigation }) {
    const { serviceId, providerId } = route.params;
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!comment.trim()) {
            Alert.alert('Required', 'Please write a comment.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/reviews', { serviceId, providerId, rating, comment });
            Alert.alert('Success', 'Thank you for your review!', [
                { text: 'OK', onPress: () => navigation.goBack() } // Refresh handled by Effect in Detail? ideally
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="close" size={24} color="#000" onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>Write a Review</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Title style={styles.question}>How was your experience?</Title>

                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(star => (
                        <Ionicons
                            key={star}
                            name={star <= rating ? "star" : "star-outline"}
                            size={40}
                            color="#FFD700"
                            onPress={() => setRating(star)}
                        />
                    ))}
                </View>

                <Text style={styles.label}>Your Review</Text>
                <TextInput
                    style={styles.input}
                    multiline
                    numberOfLines={5}
                    placeholder="Tell us what you liked..."
                    value={comment}
                    onChangeText={setComment}
                />

                <PremiumButton
                    title={loading ? "Submitting..." : "Submit Review"}
                    onPress={handleSubmit}
                    loading={loading}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', paddingTop: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20 },
    question: { textAlign: 'center', marginBottom: 20 },
    starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30, gap: 10 },
    label: { fontWeight: '600', marginBottom: 10, color: '#555' },
    input: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 15, height: 120, textAlignVertical: 'top', marginBottom: 20, fontSize: 16 },
});

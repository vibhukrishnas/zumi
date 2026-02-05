import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import ZumiLogo from '../components/ZumiLogo';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

function MessageCard({ message, index, onPress }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
        ]).start();
    }, []);

    const getAvatarBg = () => {
        switch (message.type) {
            case 'vet': return '#E3F8F5';
            default: return '#F0F4F8';
        }
    };

    return (
        <Animated.View style={[styles.messageCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity style={styles.messageCardInner} onPress={() => { haptic.light(); onPress?.(); }} activeOpacity={0.7}>
                <View style={[styles.messageAvatar, { backgroundColor: getAvatarBg() }]}>
                    {message.type === 'vet' ? (
                        <Ionicons name="medical" size={24} color={colors.primary} />
                    ) : (
                        <Text style={styles.avatarEmoji}>👤</Text>
                    )}
                </View>
                <View style={styles.messageInfo}>
                    <Text style={styles.messageName}>{message.name}</Text>
                    <Text style={styles.messagePreview} numberOfLines={1}>{message.preview}</Text>
                </View>
                {message.unread > 0 && (
                    <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>{message.unread}</Text>
                    </View>
                )}
                <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function MessagesScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMessages = async () => {
        try {
            // In a real app, you would fetch messages from an API
            // For now, we'll generate messages based on bookings
            const response = await api.get('/bookings/user').catch(() => ({ data: { data: [] } }));
            const bookings = response.data.data || [];

            // Generate messages from bookings
            const generatedMessages = bookings.slice(0, 5).map((booking, index) => ({
                id: booking.id,
                name: booking.provider || `Provider ${index + 1}`,
                preview: `Booking on ${new Date(booking.booking_date).toLocaleDateString()}`,
                type: booking.item_type === 'service' ? 'walker' : 'vet',
                unread: index === 0 ? 1 : 0,
            }));

            // If no bookings, show sample messages
            if (generatedMessages.length === 0) {
                setMessages([
                    { id: 1, name: 'Tom (Dog Walker)', preview: 'See you tomorrow! 😊', type: 'walker', unread: 0 },
                    { id: 2, name: 'Emily (Groomer)', preview: 'Your appointment is confirmed', type: 'walker', unread: 1 },
                    { id: 3, name: 'Dr. Chen (Vet Clinic)', preview: 'Reminder: Friday at 2 PM', type: 'vet', unread: 0 },
                    { id: 4, name: 'Sarah (Pet Sitter)', preview: 'Available this weekend!', type: 'sitter', unread: 0 },
                ]);
            } else {
                setMessages(generatedMessages);
            }
        } catch (error) {
            console.log('Error fetching messages:', error);
            setMessages([
                { id: 1, name: 'Tom (Dog Walker)', preview: 'See you tomorrow! 😊', type: 'walker', unread: 0 },
                { id: 2, name: 'Dr. Chen (Vet Clinic)', preview: 'Reminder: Friday at 2 PM', type: 'vet', unread: 0 },
            ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const onRefresh = () => {
        haptic.light();
        setRefreshing(true);
        fetchMessages();
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <ZumiLogo size="small" />
            </View>

            <Text style={styles.pageTitle}>Messages</Text>

            <ScrollView
                style={styles.messagesList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.messagesListContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {messages.length > 0 ? (
                    messages.map((message, index) => (
                        <MessageCard
                            key={message.id}
                            message={message}
                            index={index}
                            onPress={() => {
                                navigation.navigate('Chat', { name: message.name, type: message.type, bookingId: message.id });
                            }}
                        />
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>💬</Text>
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptySubtext}>Book a service to start chatting with providers</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    logoContainer: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },

    pageTitle: { fontSize: 22, fontWeight: '700', color: colors.primary, textAlign: 'center', marginVertical: 15 },

    messagesList: { flex: 1 },
    messagesListContent: { paddingHorizontal: 20, paddingBottom: 100 },

    messageCard: { marginBottom: 8 },
    messageCardInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
    messageAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    avatarEmoji: { fontSize: 24 },
    messageInfo: { flex: 1 },
    messageName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 3 },
    messagePreview: { fontSize: 13, color: colors.textSecondary },
    unreadBadge: { backgroundColor: colors.accent, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
    unreadText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, fontWeight: '600', color: colors.text },
    emptySubtext: { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
});

import React, { useState, useRef, useEffect, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
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
            // Fetch all messages from the API
            const messagesRes = await api.get('/messages').catch(() => ({ data: { data: [] } }));
            const allMessages = messagesRes.data.data || [];

            // Group messages by booking_id to create conversations
            const conversationsMap = new Map();
            
            allMessages.forEach(msg => {
                const bookingId = msg.booking_id || 'general';
                if (!conversationsMap.has(bookingId)) {
                    conversationsMap.set(bookingId, []);
                }
                conversationsMap.get(bookingId).push(msg);
            });

            // Convert to conversation list with last message preview
            const conversations = Array.from(conversationsMap.entries()).map(([bookingId, msgs]) => {
                const sortedMsgs = msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                const lastMsg = sortedMsgs[0];
                const unreadCount = msgs.filter(m => !m.read && m.sender_type === 'provider').length;
                
                return {
                    id: bookingId,
                    name: lastMsg.sender_type === 'provider' ? 'Service Provider' : 'You',
                    preview: lastMsg.message_text,
                    type: 'walker',
                    unread: unreadCount,
                    bookingId: bookingId,
                    lastMessageTime: new Date(lastMsg.created_at)
                };
            }).sort((a, b) => b.lastMessageTime - a.lastMessageTime);

            // If no messages, show sample
            if (conversations.length === 0) {
                setMessages([
                    { id: 1, name: 'Zumi Support', preview: 'Welcome to Zumi! How can we help you today?', type: 'walker', unread: 0 },
                ]);
            } else {
                setMessages(conversations);
            }
        } catch (error) {
            console.log('Error fetching messages:', error);
            setMessages([
                { id: 1, name: 'Zumi Support', preview: 'Welcome to Zumi! Book a service to chat with providers.', type: 'walker', unread: 0 },
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
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : messages.length > 0 ? (
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
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },

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

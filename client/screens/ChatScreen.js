import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import api from '../services/api';

export default function ChatScreen({ route, navigation }) {
    const { name, type, bookingId } = route.params || { name: 'Support', type: 'vet', bookingId: null };
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef();

    useEffect(() => {
        let interval;
        const fetchAndSchedule = async () => {
            const success = await fetchMessages();
            if (success) {
                interval = setTimeout(fetchAndSchedule, 3000); // Use Timeout instead of Interval for control
            }
        };

        fetchAndSchedule();

        return () => clearTimeout(interval);
    }, []);

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/messages?bookingId=${bookingId || ''}`);
            // Map backend messages to UI format
            const formattedMessages = response.data.data.map(m => ({
                id: m.id,
                text: m.message_text,
                sender: m.sender_type === 'user' ? 'me' : 'other', // Logic depends on who simulates provider
                time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }));

            // Avoid jitter if lengths are same (simple check)
            setMessages(prev => {
                if (prev.length !== formattedMessages.length) return formattedMessages;
                return prev;
            });
            return true; // Success, continue polling
        } catch (error) {
            console.log('Error fetching messages', error.response?.status);
            if (error.response?.status === 403 || error.response?.status === 401) {
                return false; // Stop polling on Auth Error
            }
            return true; // Retry on other errors
        }
    };

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        haptic.light();
        const tempId = Date.now();
        const textToSend = inputText;

        // Optimistic UI update
        const newMessage = {
            id: tempId,
            text: textToSend,
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, newMessage]);
        setInputText('');

        try {
            await api.post('/messages', { text: textToSend, bookingId });
            fetchMessages(); // Sync with server ID
        } catch (error) {
            console.error('Error sending message', error);
        }
    };

    useEffect(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const renderItem = ({ item }) => {
        const isMe = item.sender === 'me';
        return (
            <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
                <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>{item.text}</Text>
                <Text style={[styles.timeText, isMe ? styles.myTime : styles.otherTime]}>{item.time}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <View style={styles.avatar}>
                        <Ionicons name={type === 'vet' ? "medical" : "paw"} size={20} color="#fff" />
                    </View>
                    <View>
                        <Text style={styles.headerName}>{name}</Text>
                        <Text style={styles.headerStatus}>Online</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.callButton}>
                    <Ionicons name="call-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.emptyText}>Start the conversation...</Text>}
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor="#A4B0BE"
                        multiline
                    />
                    <TouchableOpacity onPress={sendMessage} style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.primary : '#E0E0E0' }]} disabled={!inputText.trim()}>
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },

    header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    backButton: { marginRight: 15 },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    headerName: { fontSize: 16, fontWeight: '700', color: colors.text },
    headerStatus: { fontSize: 12, color: '#4CAF50' },
    callButton: { padding: 5 },

    listContent: { padding: 20, paddingBottom: 20, flexGrow: 1 },

    messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 10 },
    myBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 2 },
    otherBubble: { alignSelf: 'flex-start', backgroundColor: '#F0F4F8', borderBottomLeftRadius: 2 },

    messageText: { fontSize: 15, lineHeight: 22 },
    myText: { color: '#fff' },
    otherText: { color: colors.text },

    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    myTime: { color: 'rgba(255,255,255,0.7)' },
    otherTime: { color: '#A4B0BE' },

    emptyText: { textAlign: 'center', marginTop: 50, color: '#A4B0BE' },

    inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 10, paddingHorizontal: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#fff' },
    input: { flex: 1, backgroundColor: '#F8F9FD', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, maxHeight: 100, fontSize: 15, marginRight: 10 },
    sendButton: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
});

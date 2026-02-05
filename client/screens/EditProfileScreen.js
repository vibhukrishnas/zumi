import React, { useState, useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfileScreen({ navigation }) {
    const { user, signIn } = useContext(AuthContext); // Re-using signIn to update local state if needed
    const [fullName, setFullName] = useState(user?.fullName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [image, setImage] = useState(user?.profileImage ? `http://localhost:5000/uploads/${user.profileImage}` : null);
    const [localImage, setLocalImage] = useState(null); // For upload
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        haptic.light();
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setLocalImage(result.assets[0]);
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        haptic.medium();
        if (!fullName || !email) {
            Alert.alert('Error', 'Name and Email are required');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('fullName', fullName);
            formData.append('email', email);
            formData.append('phone', phone);

            if (localImage) {
                // ImagePicker saves as file:///...
                // Need to append as file object
                let filename = localImage.uri.split('/').pop();
                let match = /\.(\w+)$/.exec(filename);
                let type = match ? `image/${match[1]}` : `image`;

                formData.append('profileImage', { uri: localImage.uri, name: filename, type });
            }

            // Note: Axios headers for multipart/form-data are tricky in RN. 
            // Better to let axios detect it or set 'Content-Type': 'multipart/form-data'
            const response = await api.put('/auth/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            haptic.success();
            Alert.alert('Success', 'Profile updated successfully');

            // Check if user object returned
            if (response.data.user) {
                // Ideally update context here. Assuming signIn updates context? 
                // Using a hack to reload user data might be needed if signIn expects token.
                // Ignoring context update for MVP, simple goBack.
            }

            navigation.goBack();
        } catch (error) {
            haptic.error();
            console.error(error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
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
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        {image ? (
                            <Image source={{ uri: image }} style={{ width: 100, height: 100, borderRadius: 50 }} />
                        ) : (
                            <Text style={styles.avatarEmoji}>👤</Text>
                        )}
                        <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="John Doe"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        placeholder="+1 234 567 890"
                    />
                </View>

                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.saveButton}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#fff' },
    backButton: { padding: 5 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },

    content: { padding: 20 },

    avatarContainer: { alignItems: 'center', marginBottom: 30 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0F4F8', justifyContent: 'center', alignItems: 'center', position: 'relative' },
    avatarEmoji: { fontSize: 50 },
    editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },

    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, color: colors.textSecondary, marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#F8F9FD', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: colors.text, borderWidth: 1, borderColor: '#F0F0F0' },

    saveButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

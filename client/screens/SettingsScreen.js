import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Animated, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { haptic } from '../utils/haptics';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ZumiLogo from '../components/ZumiLogo';

function SettingsItem({ icon, title, subtitle, onPress, isSwitch, switchValue, onSwitchChange, index }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 60, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, delay: index * 60, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.settingsItem, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity style={styles.settingsItemInner} onPress={() => { haptic.light(); onPress?.(); }} activeOpacity={isSwitch ? 1 : 0.7} disabled={isSwitch}>
                <View style={styles.settingsIcon}>
                    <Ionicons name={icon} size={22} color={colors.primary} />
                </View>
                <View style={styles.settingsInfo}>
                    <Text style={styles.settingsTitle}>{title}</Text>
                    {subtitle && <Text style={styles.settingsSubtitle}>{subtitle}</Text>}
                </View>
                {isSwitch ? (
                    <Switch
                        value={switchValue}
                        onValueChange={(val) => { haptic.light(); onSwitchChange?.(val); }}
                        trackColor={{ false: colors.border, true: colors.primaryLight }}
                        thumbColor={switchValue ? colors.primary : '#f4f3f4'}
                    />
                ) : (
                    <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

export default function SettingsScreen({ navigation }) {
    const { signOut, user } = useContext(AuthContext);
    const [notifications, setNotifications] = useState(true);

    const handleLogout = () => {
        haptic.medium();
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: () => { haptic.success(); signOut(); } }
            ]
        );
    };

    const handleEditProfile = () => {
        haptic.light();
        navigation.navigate('EditProfile');
    };

    const handleSubscription = () => {
        haptic.light();
        navigation.navigate('Subscription');
    };

    const handleChangePassword = () => {
        haptic.light();
        Alert.alert('Change Password', 'Password change coming soon!');
    };

    const settingsItems = [
        { icon: 'person-outline', title: 'Edit Profile', subtitle: user?.email || 'Edit your details', onPress: handleEditProfile },
        { icon: 'paw-outline', title: 'My Pets', subtitle: 'Manage your pets', onPress: () => navigation.navigate('MyPets') },
        { icon: 'star-outline', title: 'My Subscription', subtitle: 'Manage plan & upgrades', onPress: handleSubscription },
        { icon: 'key-outline', title: 'Change Password', subtitle: 'Update your password', onPress: () => navigation.navigate('ChangePassword') },
        { icon: 'notifications-outline', title: 'Push Notifications', subtitle: null, isSwitch: true },
        { icon: 'card-outline', title: 'Payment Methods', subtitle: 'Manage payment options', onPress: () => Alert.alert('Payment', 'Coming soon!') },
        { icon: 'shield-checkmark-outline', title: 'Privacy Policy', subtitle: null, onPress: () => { } },
        { icon: 'document-text-outline', title: 'Terms of Service', subtitle: null, onPress: () => { } },
        { icon: 'help-circle-outline', title: 'Help & Support', subtitle: null, onPress: () => { } },
        { icon: 'briefcase-outline', title: 'Provider Dashboard', subtitle: 'Manage bookings', onPress: () => navigation.navigate('ProviderDashboard') },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <ZumiLogo size="small" />
            </View>

            <Text style={styles.pageTitle}>Settings</Text>

            <ScrollView style={styles.settingsList} showsVerticalScrollIndicator={false} contentContainerStyle={styles.settingsListContent}>
                {/* User Info Card */}
                <View style={styles.userCard}>
                    <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarEmoji}>👤</Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                    </View>
                </View>

                {settingsItems.map((item, index) => (
                    <SettingsItem
                        key={item.title}
                        icon={item.icon}
                        title={item.title}
                        subtitle={item.subtitle}
                        index={index}
                        isSwitch={item.isSwitch}
                        switchValue={item.isSwitch ? notifications : undefined}
                        onSwitchChange={item.isSwitch ? async (val) => {
                            setNotifications(val);
                            try {
                                await api.put('/auth/profile', { notificationsEnabled: val });
                            } catch (e) { console.error(e); }
                        } : undefined}
                        onPress={!item.isSwitch ? item.onPress : undefined}
                    />
                ))}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                {/* App Version */}
                <Text style={styles.versionText}>Zumi v1.0.0</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    logoContainer: { alignItems: 'center', paddingTop: 20, paddingBottom: 10 },

    pageTitle: { fontSize: 22, fontWeight: '700', color: colors.text, paddingHorizontal: 20, marginVertical: 10 },

    settingsList: { flex: 1 },
    settingsListContent: { paddingHorizontal: 20, paddingBottom: 100 },

    userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    userAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: `${colors.primary}15`, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    userAvatarEmoji: { fontSize: 28 },
    userInfo: { flex: 1 },
    userName: { fontSize: 18, fontWeight: '700', color: colors.text },
    userEmail: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },

    settingsItem: { marginBottom: 10 },
    settingsItemInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
    settingsIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.primary}10`, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    settingsInfo: { flex: 1 },
    settingsTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
    settingsSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

    logoutButton: { alignItems: 'center', paddingVertical: 15, marginTop: 20 },
    logoutText: { color: colors.error, fontSize: 16, fontWeight: '600' },

    versionText: { textAlign: 'center', color: colors.textLight, fontSize: 12, marginTop: 10 },
});

import React, { useContext, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Avatar, Title, Caption, Text, List, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { haptic } from '../utils/haptics';
import PremiumButton from '../components/PremiumButton';

function FadeInView({ children, delay = 0, direction = 'down' }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateAnim = useRef(new Animated.Value(direction === 'up' ? -30 : 30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateAnim, {
                toValue: 0,
                duration: 500,
                delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateAnim }] }}>
            {children}
        </Animated.View>
    );
}

export default function ProfileScreen({ navigation }) {
    const { user, signOut } = useContext(AuthContext);

    const handleLogout = async () => {
        haptic.medium();
        await signOut();
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        return parts.length > 1
            ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
            : name[0].toUpperCase();
    };

    const getTierColor = (tier) => {
        switch (tier) {
            case 'premium': return ['#FFD700', '#FFA500'];
            case 'basic': return ['#C0C0C0', '#A0A0A0'];
            default: return ['#6C63FF', '#4834d4'];
        }
    };

    const getTierIcon = (tier) => {
        switch (tier) {
            case 'premium': return '👑';
            case 'basic': return '⭐';
            default: return '🆓';
        }
    };

    const subscriptionTier = user?.subscription?.tier || 'free';

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Gradient Header */}
            <FadeInView direction="up">
                <LinearGradient
                    colors={['#6C63FF', '#4834d4']}
                    style={styles.headerGradient}
                >
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={getTierColor(subscriptionTier)}
                            style={styles.avatarBorder}
                        >
                            <Avatar.Text
                                size={90}
                                label={getInitials(user?.fullName)}
                                style={styles.avatar}
                                labelStyle={styles.avatarLabel}
                            />
                        </LinearGradient>
                        <View style={styles.tierBadge}>
                            <Text style={styles.tierIcon}>{getTierIcon(subscriptionTier)}</Text>
                        </View>
                    </View>
                    <Title style={styles.name}>{user?.fullName || 'User'}</Title>
                    <Caption style={styles.email}>{user?.email || 'user@example.com'}</Caption>
                </LinearGradient>
            </FadeInView>

            {/* Stats Card */}
            <FadeInView delay={200} style={styles.statsWrapper}>
                <View style={styles.statsContainer}>
                    <TouchableOpacity style={styles.statBox} onPress={() => haptic.light()}>
                        <Text style={styles.statValue}>{getTierIcon(subscriptionTier)}</Text>
                        <Text style={styles.statLabel}>{subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)}</Text>
                        <Text style={styles.statSublabel}>Plan</Text>
                    </TouchableOpacity>
                    <View style={styles.statDivider} />
                    <TouchableOpacity style={styles.statBox} onPress={() => haptic.light()}>
                        <Text style={styles.statValue}>0</Text>
                        <Text style={styles.statLabel}>Bookings</Text>
                        <Text style={styles.statSublabel}>This month</Text>
                    </TouchableOpacity>
                    <View style={styles.statDivider} />
                    <TouchableOpacity style={styles.statBox} onPress={() => haptic.light()}>
                        <Text style={styles.statValue}>$0</Text>
                        <Text style={styles.statLabel}>Saved</Text>
                        <Text style={styles.statSublabel}>Total</Text>
                    </TouchableOpacity>
                </View>
            </FadeInView>

            {/* Menu Items */}
            <FadeInView delay={300} style={styles.menuWrapper}>
                <Text style={styles.menuTitle}>Account</Text>
                <List.Section style={styles.menuSection}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => haptic.light()}
                    >
                        <View style={[styles.menuIconBg, { backgroundColor: '#6C63FF15' }]}>
                            <Text style={styles.menuIcon}>📅</Text>
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuItemTitle}>My Bookings</Text>
                            <Text style={styles.menuItemDesc}>View past and upcoming bookings</Text>
                        </View>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => haptic.light()}
                    >
                        <View style={[styles.menuIconBg, { backgroundColor: '#4CAF5015' }]}>
                            <Text style={styles.menuIcon}>💳</Text>
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuItemTitle}>Payment Methods</Text>
                            <Text style={styles.menuItemDesc}>Manage your cards</Text>
                        </View>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => haptic.light()}
                    >
                        <View style={[styles.menuIconBg, { backgroundColor: '#FFD70015' }]}>
                            <Text style={styles.menuIcon}>👑</Text>
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuItemTitle}>Upgrade Plan</Text>
                            <Text style={styles.menuItemDesc}>Get premium discounts</Text>
                        </View>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => haptic.light()}
                    >
                        <View style={[styles.menuIconBg, { backgroundColor: '#2196F315' }]}>
                            <Text style={styles.menuIcon}>❓</Text>
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={styles.menuItemTitle}>Help & Support</Text>
                            <Text style={styles.menuItemDesc}>Get help with your orders</Text>
                        </View>
                        <Text style={styles.menuArrow}>›</Text>
                    </TouchableOpacity>
                </List.Section>
            </FadeInView>

            {/* Logout Button */}
            <FadeInView delay={400} style={styles.logoutWrapper}>
                <PremiumButton
                    title="Log Out"
                    onPress={handleLogout}
                    colors={['#FF6584', '#FF4757']}
                />
            </FadeInView>

            <View style={styles.footer}>
                <Text style={styles.version}>Pet Services v1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FD',
    },
    headerGradient: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatarContainer: {
        marginBottom: 15,
        position: 'relative',
    },
    avatarBorder: {
        padding: 4,
        borderRadius: 50,
    },
    avatar: {
        backgroundColor: '#fff',
    },
    avatarLabel: {
        color: '#6C63FF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    tierBadge: {
        position: 'absolute',
        bottom: 0,
        right: -5,
        backgroundColor: '#fff',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    tierIcon: {
        fontSize: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    email: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    statsWrapper: {
        paddingHorizontal: 20,
        marginTop: -25,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E0E0E0',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    statLabel: {
        fontSize: 14,
        color: '#2D3436',
        fontWeight: '600',
        marginTop: 4,
    },
    statSublabel: {
        fontSize: 11,
        color: '#A4A4A4',
    },
    menuWrapper: {
        paddingHorizontal: 20,
        marginTop: 25,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 15,
    },
    menuSection: {
        marginTop: 0,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    menuIconBg: {
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuIcon: {
        fontSize: 20,
    },
    menuContent: {
        flex: 1,
        marginLeft: 15,
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2D3436',
    },
    menuItemDesc: {
        fontSize: 12,
        color: '#A4A4A4',
        marginTop: 2,
    },
    menuArrow: {
        fontSize: 24,
        color: '#ccc',
        fontWeight: '300',
    },
    logoutWrapper: {
        paddingHorizontal: 20,
        marginTop: 20,
    },
    footer: {
        alignItems: 'center',
        padding: 20,
        paddingBottom: 40,
    },
    version: {
        color: '#A4A4A4',
        fontSize: 12,
    },
});

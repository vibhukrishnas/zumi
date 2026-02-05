import React, { useEffect, useState, useRef, useContext } from 'react';
import { View, StyleSheet, ScrollView, Image, Dimensions, Animated, Alert } from 'react-native';
import { Title, Text, Paragraph, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import PremiumButton from '../components/PremiumButton';
import { colors } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const { width } = Dimensions.get('window');

function FadeInView({ children, delay = 0, direction = 'down', style }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateAnim = useRef(new Animated.Value(direction === 'up' ? -30 : 30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
            Animated.timing(translateAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: translateAnim }] }, style]}>
            {children}
        </Animated.View>
    );
}

export default function DetailScreen({ route, navigation }) {
    const { id, title, type = 'event' } = route.params;
    const [item, setItem] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        fetchDetails();
    }, []);

    // Re-fetch reviews when screen comes into focus (after adding one)
    useEffect(() => {
        if (id) fetchReviews();
    }, [id, navigation]); // Simplified

    const fetchReviews = async () => {
        try {
            setLoadingReviews(true);
            const res = await api.get(`/reviews/service/${id}`);
            setReviews(res.data.data);
        } catch (e) { } finally { setLoadingReviews(false); }
    };

    const fetchDetails = async () => {
        try {
            const endpoint = type === 'service' ? `/services/${id}` : `/events/${id}`;
            const response = await api.get(endpoint);
            setItem(response.data.data);
        } catch (error) { console.error('Error fetching details:', error); }
        finally { setLoading(false); }
    };

    if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6C63FF" /></View>;
    if (!item) return <View style={styles.loadingContainer}><Text style={styles.errorText}>Item not found</Text></View>;

    // GATING LOGIC: Dynamic via Backend
    const isPremiumOnly = item?.is_premium === 1 || item?.is_premium === true;
    const canAccess = !isPremiumOnly || user?.subscription?.tier === 'premium';

    const handleBookNow = () => {
        if (canAccess) {
            navigation.navigate('Booking', { id: item.id, title: item.title, price: item.price, type });
        } else {
            Alert.alert("Premium Only 💎", "This exclusive service is for Premium members only.", [
                { text: "Cancel", style: "cancel" },
                { text: "Upgrade Now", onPress: () => navigation.navigate('Subscription') }
            ]);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <FadeInView direction="up">
                    <Image source={{ uri: item.image_url || 'https://via.placeholder.com/400x200' }} style={styles.heroImage} />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.imageOverlay} />
                </FadeInView>
                <View style={styles.content}>
                    <FadeInView delay={200}>
                        <View style={styles.badgeRow}>
                            <View style={styles.typeBadge}><Text style={styles.badgeText}>{type === 'service' ? '🛠️ Service' : '📅 Event'}</Text></View>
                            {item.discount_eligible && <View style={[styles.typeBadge, styles.discountBadge]}><Text style={styles.badgeText}>💎 Discount Eligible</Text></View>}
                        </View>
                        <Title style={styles.title}>{item.title}</Title>
                        <View style={styles.providerRow}><Text style={styles.providerLabel}>by</Text><Text style={styles.providerName}>{item.provider}</Text></View>
                    </FadeInView>
                    <FadeInView delay={300}>
                        <View style={styles.infoCard}>
                            {type === 'event' && item.event_date && <View style={styles.infoRow}><Text style={styles.infoIcon}>📅</Text><View><Text style={styles.infoLabel}>Date</Text><Text style={styles.infoValue}>{new Date(item.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text></View></View>}
                            {item.location && <View style={styles.infoRow}><Text style={styles.infoIcon}>📍</Text><View><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>{item.location}</Text></View></View>}
                            {item.service_type && <View style={styles.infoRow}><Text style={styles.infoIcon}>🏷️</Text><View><Text style={styles.infoLabel}>Category</Text><Text style={styles.infoValue}>{item.service_type}</Text></View></View>}
                        </View>
                    </FadeInView>
                    <FadeInView delay={400}>
                        <Text style={styles.sectionTitle}>Description</Text>
                        <Paragraph style={styles.description}>{item.description || 'No description available for this item.'}</Paragraph>
                    </FadeInView>

                    <FadeInView delay={450}>
                        <View style={styles.reviewsHeader}>
                            <Text style={styles.sectionTitle}>Reviews</Text>
                            <Text style={styles.writeReviewLink} onPress={() => navigation.navigate('AddReview', { serviceId: item.id, providerId: 1 })}>Write a Review</Text>
                        </View>
                        {loadingReviews ? <ActivityIndicator color={colors.primary} /> : (
                            reviews.length === 0 ? <Text style={{ color: '#888', fontStyle: 'italic' }}>No reviews yet. Be the first!</Text> :
                                reviews.map(review => (
                                    <View key={review.id} style={styles.reviewCard}>
                                        <View style={styles.reviewHeader}>
                                            <Text style={styles.reviewUser}>{review.full_name}</Text>
                                            <View style={styles.reviewRating}><Ionicons name="star" size={12} color="#FFD700" /><Text style={styles.reviewRatingText}>{review.rating}</Text></View>
                                        </View>
                                        <Text style={styles.reviewComment}>{review.comment}</Text>
                                        <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                                    </View>
                                ))
                        )}
                    </FadeInView>
                </View>
            </ScrollView>
            <FadeInView delay={500} direction="up" style={styles.bottomBar}>
                <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Price</Text>
                    <Text style={styles.priceValue}>${item.price}</Text>
                    {item.provider_discount > 0 && <Text style={styles.discountText}>{item.provider_discount}% off available</Text>}
                </View>
                <View style={styles.bookButtonContainer}>
                    <PremiumButton
                        title={canAccess ? "Book Now" : "Unlock with Premium 🔒"}
                        onPress={handleBookNow}
                        colors={canAccess ? undefined : ['#95a5a6', '#7f8c8d']}
                    />
                </View>
            </FadeInView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FD' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FD' },
    errorText: { color: '#636e72', fontSize: 16 },
    heroImage: { width: width, height: 250, backgroundColor: '#E0E0E0' },
    imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
    content: { padding: 20, marginTop: -30, backgroundColor: '#F8F9FD', borderTopLeftRadius: 30, borderTopRightRadius: 30 },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
    typeBadge: { backgroundColor: '#6C63FF15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    discountBadge: { backgroundColor: '#4CAF5015' },
    badgeText: { color: '#6C63FF', fontWeight: '600', fontSize: 12 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#2D3436', marginBottom: 8 },
    providerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    providerLabel: { color: '#A4A4A4', marginRight: 5 },
    providerName: { color: '#6C63FF', fontWeight: '600' },
    infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 15, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    infoIcon: { fontSize: 24, marginRight: 15 },
    infoLabel: { color: '#A4A4A4', fontSize: 12 },
    infoValue: { color: '#2D3436', fontWeight: '600', fontSize: 14 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3436', marginBottom: 10 },
    description: { color: '#636e72', lineHeight: 24, fontSize: 15 },
    bottomBar: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10 },
    priceContainer: { flex: 1 },
    priceLabel: { color: '#A4A4A4', fontSize: 12 },
    priceValue: { fontSize: 28, fontWeight: 'bold', color: '#6C63FF' },
    discountText: { color: '#4CAF50', fontSize: 12, fontWeight: '600' },
    bookButtonContainer: { flex: 1 },
    reviewsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10 },
    writeReviewLink: { color: colors.primary, fontWeight: '600' },
    reviewCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10 },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    reviewUser: { fontWeight: '700', fontSize: 14 },
    reviewRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    reviewRatingText: { fontSize: 12, fontWeight: 'bold' },
    reviewComment: { color: '#555', fontSize: 14, marginBottom: 5 },
    reviewDate: { color: '#aaa', fontSize: 10 },
});

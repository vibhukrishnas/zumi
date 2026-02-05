import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function ZumiLogo({ size = 'medium', showText = true }) {
    const dimensions = {
        small: { logo: 50, text: 16 },
        medium: { logo: 70, text: 22 },
        large: { logo: 100, text: 28 },
    };

    const dim = dimensions[size] || dimensions.medium;

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/zumi-logo.png')}
                style={{ width: dim.logo, height: dim.logo }}
                resizeMode="contain"
            />
            {showText && <Text style={[styles.brandName, { fontSize: dim.text }]}>Zumi</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center' },
    brandName: { fontWeight: '700', color: '#2E3A59', marginTop: 8 },
});

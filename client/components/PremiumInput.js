import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, TextInput, View, Text, Animated } from 'react-native';
import { theme } from '../theme';

export default function PremiumInput({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    autoCapitalize
}) {
    const [isFocused, setIsFocused] = useState(false);
    const borderColorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(borderColorAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused]);

    const borderColor = borderColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#E0E0E0', theme.colors.primary],
    });

    const backgroundColor = borderColorAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#fff', '#F8F9FD'],
    });

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, isFocused && styles.labelFocused]}>{label}</Text>}
            <Animated.View style={[styles.inputWrapper, { borderColor, backgroundColor }]}>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#A4A4A4"
                    secureTextEntry={secureTextEntry}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        color: '#2D3436',
        fontWeight: '600',
        fontSize: 14,
        marginLeft: 4,
    },
    labelFocused: {
        color: theme.colors.primary,
    },
    inputWrapper: {
        borderRadius: 15,
        borderWidth: 1.5,
        overflow: 'hidden',
    },
    input: {
        padding: 15,
        fontSize: 16,
        color: '#2D3436',
    },
});

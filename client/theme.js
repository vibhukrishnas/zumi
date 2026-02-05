import { DefaultTheme } from 'react-native-paper';

// Zumi Color Palette
export const colors = {
    primary: '#2DB78A',        // Teal/Mint green
    primaryLight: '#5ECFAA',
    primaryDark: '#1A9B6C',
    secondary: '#4ECDC4',      // Cyan
    accent: '#00B4D8',         // Blue accent
    gradient: {
        start: '#4ECDC4',      // Cyan
        end: '#2DB78A',        // Teal
    },
    background: '#FFFFFF',
    surface: '#F8FAFB',
    card: '#FFFFFF',
    text: '#2D3436',
    textSecondary: '#636E72',
    textLight: '#A4B0BE',
    border: '#E8ECEF',
    error: '#FF6B6B',
    success: '#2DB78A',
    warning: '#FFA502',
    white: '#FFFFFF',
    overlay: 'rgba(0,0,0,0.5)',
};

export const theme = {
    ...DefaultTheme,
    roundness: 16,
    colors: {
        ...DefaultTheme.colors,
        primary: colors.primary,
        accent: colors.accent,
        background: colors.background,
        surface: colors.surface,
        text: colors.text,
        placeholder: colors.textLight,
        error: colors.error,
    },
    fonts: {
        ...DefaultTheme.fonts,
        regular: { fontFamily: 'Outfit_400Regular' },
        medium: { fontFamily: 'Outfit_500Medium' },
        bold: { fontFamily: 'Outfit_700Bold' },
        light: { fontFamily: 'Outfit_400Regular' },
    },
};

export const layout = {
    padding: 20,
    borderRadius: 16,
    cardRadius: 20,
};

export const shadows = {
    small: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    medium: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    large: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
};

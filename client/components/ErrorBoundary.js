import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console (in production, send to error tracking service)
        console.error('Error Boundary caught an error:', error, errorInfo);
        
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // TODO: Log to error tracking service (e.g., Sentry, LogRocket)
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ 
            hasError: false, 
            error: null,
            errorInfo: null 
        });
        
        // Call optional reset callback from props
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="warning-outline" size={80} color={colors.primary} />
                    </View>
                    
                    <Text style={styles.title}>Oops! Something went wrong</Text>
                    <Text style={styles.message}>
                        {this.props.fallbackMessage || 
                         "We're sorry for the inconvenience. The app encountered an unexpected error."}
                    </Text>

                    {__DEV__ && this.state.error && (
                        <View style={styles.errorDetails}>
                            <Text style={styles.errorText}>
                                {this.state.error.toString()}
                            </Text>
                            {this.state.errorInfo && (
                                <Text style={styles.stackTrace}>
                                    {this.state.errorInfo.componentStack}
                                </Text>
                            )}
                        </View>
                    )}

                    <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={this.handleReset}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="refresh" size={20} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>

                    {this.props.showReportButton && (
                        <TouchableOpacity 
                            style={styles.reportButton}
                            onPress={() => {
                                // TODO: Implement error reporting
                                console.log('Report error tapped');
                            }}
                        >
                            <Text style={styles.reportButtonText}>Report Problem</Text>
                        </TouchableOpacity>
                    )}
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8F9FD',
    },
    iconContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    errorDetails: {
        backgroundColor: '#FFF3F3',
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B6B',
        maxHeight: 200,
        width: '100%',
    },
    errorText: {
        color: '#C92A2A',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    stackTrace: {
        color: '#868E96',
        fontSize: 10,
        fontFamily: 'monospace',
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    buttonIcon: {
        marginRight: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    reportButton: {
        marginTop: 15,
        paddingVertical: 10,
    },
    reportButtonText: {
        color: colors.primary,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});

export default ErrorBoundary;

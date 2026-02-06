import React, { useContext, useCallback } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import ServiceBookingScreen from './screens/ServiceBookingScreen';
import ChatScreen from './screens/ChatScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import MessagesScreen from './screens/MessagesScreen';
import SettingsScreen from './screens/SettingsScreen';
import DetailScreen from './screens/DetailScreen';
import BookingScreen from './screens/BookingScreen';
import MyPetsScreen from './screens/MyPetsScreen';
import AddPetScreen from './screens/AddPetScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import PaymentGatewayScreen from './screens/PaymentGatewayScreen';
import ProviderDashboardScreen from './screens/ProviderDashboardScreen';
import ProviderAvailabilityScreen from './screens/ProviderAvailabilityScreen';
import AddReviewScreen from './screens/AddReviewScreen';
import { theme, colors } from './theme';

SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function CenterTabButton({ children, onPress }) {
  return (
    <TouchableOpacity style={styles.centerButton} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.centerButtonGradient}>
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Schedule') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'PawCenter') iconName = 'paw';
          else if (route.name === 'Messages') iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={route.name === 'PawCenter' ? 28 : 24} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#A4B0BE',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          height: 75,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontFamily: 'Outfit_500Medium', fontSize: 11 },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen
        name="PawCenter"
        component={ServiceBookingScreen}
        options={{
          tabBarLabel: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.pawIconContainer}>
              <Text style={styles.pawIcon}>🐾</Text>
            </View>
          ),
          tabBarButton: (props) => <CenterTabButton {...props} />,
        }}
      />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AppNav() {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.loadingGradient}>
          <Image source={require('./assets/zumi-logo.png')} style={styles.loadingLogo} resizeMode="contain" />
          <Text style={styles.loadingBrand}>Zumi</Text>
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
        </LinearGradient>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="EventDetail"
              component={DetailScreen}
              options={{
                headerShown: true,
                headerTitle: 'Event Details',
                headerStyle: { backgroundColor: colors.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff',
                headerTitleStyle: { fontFamily: 'Outfit_600SemiBold' },
              }}
            />
            <Stack.Screen
              name="ServiceDetail"
              component={DetailScreen}
              options={{
                headerShown: true,
                headerTitle: 'Service Details',
                headerStyle: { backgroundColor: colors.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff',
                headerTitleStyle: { fontFamily: 'Outfit_600SemiBold' },
              }}
            />
            <Stack.Screen
              name="Detail"
              component={DetailScreen}
              options={{
                headerShown: true,
                headerTitle: 'Details',
                headerStyle: { backgroundColor: colors.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff',
                headerTitleStyle: { fontFamily: 'Outfit_600SemiBold' },
              }}
            />
            <Stack.Screen
              name="Booking"
              component={BookingScreen}
              options={{
                headerShown: true,
                headerTitle: 'Confirm Booking',
                headerStyle: { backgroundColor: colors.primary, elevation: 0, shadowOpacity: 0 },
                headerTintColor: '#fff',
                headerTitleStyle: { fontFamily: 'Outfit_600SemiBold' },
              }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProviderDashboard"
              component={ProviderDashboardScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ProviderAvailability"
              component={ProviderAvailabilityScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PaymentGateway"
              component={PaymentGatewayScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MyPets"
              component={MyPetsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddPet"
              component={AddPetScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AddReview"
              component={AddReviewScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1 },
  loadingGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingLogo: { width: 120, height: 120 },
  loadingBrand: { fontSize: 32, fontWeight: '700', color: '#fff', marginTop: 10 },
  centerButton: { top: -20, justifyContent: 'center', alignItems: 'center' },
  centerButtonGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  pawIconContainer: { justifyContent: 'center', alignItems: 'center' },
  pawIcon: { fontSize: 24 },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <StripeProvider publishableKey="pk_test_51SxUwDFF8UagZ97u5A03Ks7TdBTbQOw4YJAUrj2brtfXxOx4uwPrPBN5YQNzAN1PrXhX6yg8qo1KVfi2Vuc6ZcQY00ewLTK3Ef">
          <PaperProvider theme={theme}>
            <AppNav />
          </PaperProvider>
        </StripeProvider>
      </AuthProvider>
    </View>
  );
}

/**
 * navigation/AppNavigator.js — Root navigator
 *
 * Renders AuthStack if not logged in, MainTabs if logged in.
 * Bootstraps auth state on mount.
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useAuthStore from '../store/authStore';
import { COLORS } from '../utils/theme';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';


// App screens
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import ResultScreen from '../screens/ResultScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import InvoiceDetailScreen from '../screens/InvoiceDetailScreen'; // ✅ ADD THIS
import PricingScreen from '../screens/PricingScreen';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.border,
        paddingBottom: 6,
        height: 60,
      },
      tabBarIcon: ({ focused, color, size }) => {
        const icons = {
          Home: focused ? 'home' : 'home-outline',
          Dashboard: focused ? 'bar-chart' : 'bar-chart-outline',
          History: focused ? 'time' : 'time-outline',
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
    <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Reports' }} />
    <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'History' }} />
  </Tab.Navigator>
);

// ─── Auth Stack ───────────────────────────────────────────────────────────────
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

// ─── Main App Stack (tabs + modal screens) ────────────────────────────────────
const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />

    <Stack.Screen
      name="Scan"
      component={ScanScreen}
      options={{ presentation: 'modal' }}
    />

    <Stack.Screen name="Result" component={ResultScreen} />

    <Stack.Screen
      name="InvoiceDetail"
      component={InvoiceDetailScreen}
      options={{
        headerShown: false,
        title: 'Invoice Details',
      }}
    />

    {/* ✅ ADD THIS */}
    <Stack.Screen
      name="Pricing"
      component={PricingScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
);
// ─── Root Navigator ───────────────────────────────────────────────────────────
const AppNavigator = () => {
  const { user, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;

/**
 * App.js — Root component
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="#F8FAFC" />
      <AppNavigator />
      <Toast />
    </SafeAreaProvider>
  );
}

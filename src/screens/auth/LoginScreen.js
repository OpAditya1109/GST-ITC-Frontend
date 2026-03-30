/**
 * screens/auth/LoginScreen.js
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../utils/theme';

const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!phone.trim() || !password.trim()) {
      return Alert.alert('Error', 'Please enter phone number and password');
    }
    if (phone.length !== 10) {
      return Alert.alert('Error', 'Enter a valid 10-digit phone number');
    }

    setLoading(true);
    try {
      await login(phone, password);
      // Navigation handled by AppNavigator (user state change)
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Ionicons name="receipt" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>GST Invoice</Text>
            <Text style={styles.tagline}>Smart invoice scanning for India</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Welcome back</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.prefix}>+91</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Login</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkBold}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: SPACING.lg },
  header: { alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xl },
  logoBox: {
    width: 72, height: 72, borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
  },
  appName: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  tagline: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.md,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background, height: 50,
  },
  prefix: { color: COLORS.textSecondary, fontWeight: '600', marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
    height: 50, justifyContent: 'center', alignItems: 'center',
    marginTop: SPACING.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkBtn: { alignItems: 'center', marginTop: SPACING.md },
  linkText: { color: COLORS.textSecondary, fontSize: 14 },
  linkBold: { color: COLORS.primary, fontWeight: '700' },
});

export default LoginScreen;

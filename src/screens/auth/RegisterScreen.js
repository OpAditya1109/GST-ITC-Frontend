/**
 * screens/auth/RegisterScreen.js
 */

import React, { useState, useCallback, memo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { COLORS, SPACING, RADIUS, SHADOW } from '../../utils/theme';

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    businessName: '',
    gstin: '',
  });

  const [loading, setLoading] = useState(false);

  // ✅ FIX: Only subscribe to register (prevents re-render)
  const register = useAuthStore((state) => state.register);

  // ✅ Optimized update function
  const update = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleRegister = async () => {
    if (!form.phone || !form.password || !form.name) {
      return Alert.alert('Error', 'Name, phone, and password are required');
    }

    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      console.log(err);
      Alert.alert(
        'Registration Failed',
        err?.response?.data?.message || 'Please try again'
      );
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Start managing your GST invoices
          </Text>

          <View style={styles.card}>
            <Field label="Full Name *" fieldKey="name" form={form} update={update} placeholder="Your name" />

            <Field
              label="Mobile Number *"
              fieldKey="phone"
              form={form}
              update={update}
              placeholder="10-digit number"
              keyboardType="phone-pad"
              maxLength={10}
            />

            <Field
              label="Password *"
              fieldKey="password"
              form={form}
              update={update}
              placeholder="Min 6 characters"
              secureTextEntry
            />

            <Field
              label="Business Name (optional)"
              fieldKey="businessName"
              form={form}
              update={update}
              placeholder="Your business / firm name"
            />

            <Field
              label="Your GSTIN (optional)"
              fieldKey="gstin"
              form={form}
              update={update}
              placeholder="e.g. 27AAAAA0000A1Z5"
              autoCapitalize="characters"
              maxLength={15}
            />

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.6 }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


// ✅ FIX: Memoized Field (prevents re-render)
const Field = memo(({ label, fieldKey, form, update, ...props }) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={COLORS.textMuted}
        value={form[fieldKey]}
        onChangeText={(v) => update(fieldKey, v)}
        {...props}
      />
    </View>
  );
});


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: SPACING.lg },
  back: { marginBottom: SPACING.md },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOW.md,
  },
  inputGroup: { marginBottom: SPACING.md },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 50,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default RegisterScreen;
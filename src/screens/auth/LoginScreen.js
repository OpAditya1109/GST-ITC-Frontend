/**
 * screens/auth/LoginScreen.js — Premium Redesign
 *
 * Design direction: Dark luxury — deep navy base, electric indigo accents,
 * frosted-glass card, staggered spring animations, subtle mesh background orbs.
 * Phone ↔ Email mode via an animated pill toggle switch.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../../store/authStore';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { authAPI } from '../../services/api';

const { width, height } = Dimensions.get('window');

// ─── Floating orb background ──────────────────────────────────────────────────
const BackgroundOrbs = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={['#0A0818', '#0F0E2A', '#0A0818']}
      style={StyleSheet.absoluteFill}
    />
    <View style={[orb.base, {
      width: 280, height: 280, borderRadius: 140,
      top: -80, right: -80,
      backgroundColor: 'rgba(108, 99, 255, 0.18)',
    }]} />
    <View style={[orb.base, {
      width: 220, height: 220, borderRadius: 110,
      bottom: 60, left: -60,
      backgroundColor: 'rgba(99, 179, 255, 0.10)',
    }]} />
    <View style={[orb.base, {
      width: 160, height: 160, borderRadius: 80,
      top: height * 0.38, left: width * 0.5 - 80,
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
    }]} />
  </View>
);
const orb = StyleSheet.create({ base: { position: 'absolute' } });

// ─── Phone ↔ Email Pill Toggle ────────────────────────────────────────────────
const LoginModeToggle = ({ mode, onToggle }) => {
  const slideAnim = useRef(new Animated.Value(mode === 'phone' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: mode === 'phone' ? 0 : 1,
      tension: 80,
      friction: 11,
      useNativeDriver: false,
    }).start();
  }, [mode]);

  // Track width = card inner width = screen - (24 padding * 2) - (24 card padding * 2)
  const TRACK_WIDTH = width - 96;
  const PILL_WIDTH = (TRACK_WIDTH - 6) / 2;

  const pillLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, PILL_WIDTH + 3],
  });

  return (
    <View style={toggleStyles.wrapper}>
      <View style={[toggleStyles.track, { width: TRACK_WIDTH }]}>
        {/* Sliding pill */}
        <Animated.View
          style={[toggleStyles.pill, { left: pillLeft, width: PILL_WIDTH }]}
        >
          <LinearGradient
            colors={['#6C63FF', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            borderRadius={11}
          />
        </Animated.View>

        {/* Phone tab */}
        <TouchableOpacity
          style={[toggleStyles.tab, { width: PILL_WIDTH }]}
          onPress={() => onToggle('phone')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="call-outline"
            size={14}
            color={mode === 'phone' ? '#fff' : 'rgba(255,255,255,0.35)'}
          />
          <Text style={[
            toggleStyles.tabLabel,
            mode === 'phone' && toggleStyles.tabLabelActive,
          ]}>
            Phone
          </Text>
        </TouchableOpacity>

        {/* Email tab */}
        <TouchableOpacity
          style={[toggleStyles.tab, { width: PILL_WIDTH }]}
          onPress={() => onToggle('email')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="mail-outline"
            size={14}
            color={mode === 'email' ? '#fff' : 'rgba(255,255,255,0.35)'}
          />
          <Text style={[
            toggleStyles.tabLabel,
            mode === 'email' && toggleStyles.tabLabelActive,
          ]}>
            Email
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const toggleStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginBottom: 22,
  },
  track: {
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 3,
  },
  pill: {
    position: 'absolute',
    height: 36,
    borderRadius: 11,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  tab: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },
});

// ─── Animated input field ─────────────────────────────────────────────────────
const PremiumInput = ({
  label, value, onChangeText, placeholder,
  keyboardType, maxLength, secureTextEntry,
  rightElement, prefix, autoComplete,
}) => {
  const focused = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    Animated.spring(focused, { toValue: 1, tension: 80, friction: 8, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    Animated.spring(focused, { toValue: 0, tension: 80, friction: 8, useNativeDriver: false }).start();
  };

  const borderColor = focused.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.08)', 'rgba(108,99,255,0.8)'],
  });
  const bgColor = focused.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.04)', 'rgba(108,99,255,0.07)'],
  });

  return (
    <View style={inputStyles.group}>
      <Text style={inputStyles.label}>{label}</Text>
      <Animated.View style={[inputStyles.wrapper, { borderColor, backgroundColor: bgColor }]}>
        {prefix && <Text style={inputStyles.prefix}>{prefix}</Text>}
        {prefix && <View style={inputStyles.prefixDivider} />}
        <TextInput
          style={inputStyles.field}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          keyboardType={keyboardType}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete={autoComplete}
          autoCapitalize="none"
        />
        {rightElement}
      </Animated.View>
    </View>
  );
};

const inputStyles = StyleSheet.create({
  group: { marginBottom: 20 },
  label: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8,
  },
  wrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 16,
    paddingHorizontal: 16, height: 56,
  },
  prefix: {
    fontSize: 15, fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginRight: 8,
  },
  prefixDivider: {
    width: 1, height: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginRight: 12,
  },
  field: {
    flex: 1, fontSize: 16, color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

// ─── Main LoginScreen ─────────────────────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const [loginMode, setLoginMode] = useState('phone'); // 'phone' | 'email'
  const [phone, setPhone]         = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]     = useState(false);

  const { login } = useAuthStore();

  // Fade-swap animation when switching input mode
  const inputFade = useRef(new Animated.Value(1)).current;

  const handleModeToggle = (newMode) => {
    if (newMode === loginMode) return;
    Animated.timing(inputFade, {
      toValue: 0, duration: 120, useNativeDriver: true,
    }).start(() => {
      setLoginMode(newMode);
      setPhone('');
      setEmail('');
      Animated.timing(inputFade, {
        toValue: 1, duration: 160, useNativeDriver: true,
      }).start();
    });
  };

  // Entry animations
  const logoAnim   = useRef(new Animated.Value(0)).current;
  const titleAnim  = useRef(new Animated.Value(0)).current;
  const cardAnim   = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(logoAnim,   { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(titleAnim,  { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(cardAnim,   { toValue: 1, tension: 55, friction: 10, useNativeDriver: true }),
      Animated.spring(footerAnim, { toValue: 1, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const slideUp = (anim, distance = 30) => ({
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }),
    }],
  });

  const handleLogin = async () => {
    // authController accepts identifier = phone or email
    const identifier = loginMode === 'phone' ? phone.trim() : email.trim();

    if (!identifier || !password.trim()) {
      return Alert.alert(
        'Missing Info',
        `Please enter your ${loginMode === 'phone' ? 'phone number' : 'email'} and password.`
      );
    }
    if (loginMode === 'phone' && phone.length !== 10) {
      return Alert.alert('Invalid Number', 'Enter a valid 10-digit mobile number.');
    }
    if (loginMode === 'email' && !email.includes('@')) {
      return Alert.alert('Invalid Email', 'Enter a valid email address.');
    }

    setLoading(true);
    try {
      await login(identifier, password);

      if (Device.isDevice) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
          try { await authAPI.saveDeviceToken(expoToken); } catch (e) { /* silent */ }
        }
      }
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Button press scale
  const btnScale = useRef(new Animated.Value(1)).current;
  const onBtnPressIn  = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  const onBtnPressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <View style={styles.root}>
      <BackgroundOrbs />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── Logo & Brand ─────────────────────────────────────────── */}
            <Animated.View style={[styles.brandWrap, slideUp(logoAnim, 20)]}>
              <LinearGradient
                colors={['#6C63FF', '#8B5CF6']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <View style={styles.logoInner}>
                  <Ionicons name="receipt-outline" size={30} color="#fff" />
                </View>
              </LinearGradient>

              <View style={styles.brandNameRow}>
                <Text style={styles.brandName}>GST</Text>
                <View style={styles.brandDot} />
                <Text style={styles.brandNameAccent}>Invoice</Text>
              </View>
              <Text style={styles.tagline}>Smart scanning for Indian businesses</Text>
            </Animated.View>

            {/* ── Headline ─────────────────────────────────────────────── */}
            <Animated.View style={[styles.headlineWrap, slideUp(titleAnim)]}>
              <Text style={styles.headlineHi}>Welcome back 👋</Text>
              <Text style={styles.headlineSub}>Sign in to continue managing your GST</Text>
            </Animated.View>

            {/* ── Glass Card ───────────────────────────────────────────── */}
            <Animated.View style={[styles.cardShadow, slideUp(cardAnim)]}>
              <View style={styles.card}>
                {/* Shimmer border line at top */}
                <LinearGradient
                  colors={['transparent', '#6C63FF', '#8B5CF6', 'transparent']}
                  start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                  style={styles.cardTopBar}
                />

                {/* ── Mode Toggle ─────────────────────────────────────── */}
                <LoginModeToggle mode={loginMode} onToggle={handleModeToggle} />

                {/* ── Animated Input Area (fades on switch) ───────────── */}
                <Animated.View style={{ opacity: inputFade }}>
                  {loginMode === 'phone' ? (
                    <PremiumInput
                      key="phone"
                      label="Mobile Number"
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="10-digit number"
                      keyboardType="phone-pad"
                      maxLength={10}
                      prefix="+91"
                      autoComplete="tel"
                    />
                  ) : (
                    <PremiumInput
                      key="email"
                      label="Email Address"
                      value={email}
                      onChangeText={setEmail}
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  )}
                </Animated.View>

                <PremiumInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  rightElement={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="rgba(255,255,255,0.35)"
                      />
                    </TouchableOpacity>
                  }
                />

                {/* ── Forgot Password ──────────────────────────────────── */}
                <TouchableOpacity
                  style={styles.forgotBtn}
                  onPress={() => navigation.navigate('ForgotPassword')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* ── Login Button ─────────────────────────────────────── */}
                <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={handleLogin}
                    onPressIn={onBtnPressIn}
                    onPressOut={onBtnPressOut}
                    disabled={loading}
                    activeOpacity={1}
                  >
                    <LinearGradient
                      colors={loading ? ['#4B4891', '#4B4891'] : ['#6C63FF', '#8B5CF6', '#A78BFA']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.loginBtn}
                    >
                      <View style={styles.btnGlow} />
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Text style={styles.loginBtnText}>Sign In</Text>
                          <View style={styles.btnArrow}>
                            <Ionicons name="arrow-forward" size={16} color="#6C63FF" />
                          </View>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* ── Divider ───────────────────────────────────────────── */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* ── Register link ─────────────────────────────────────── */}
                <TouchableOpacity
                  style={styles.registerBtn}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.registerText}>New here?</Text>
                  <Text style={styles.registerAccent}> Create an account</Text>
                  <Ionicons name="chevron-forward" size={14} color="#8B5CF6" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* ── Trust badges ─────────────────────────────────────────── */}
            <Animated.View style={[styles.trustRow, slideUp(footerAnim)]}>
              {[
                { icon: 'shield-checkmark-outline', label: 'Secure' },
                { icon: 'flash-outline',            label: 'Fast OCR' },
                { icon: 'document-text-outline',    label: 'GSTR Ready' },
              ].map((t) => (
                <View key={t.label} style={styles.trustItem}>
                  <Ionicons name={t.icon} size={14} color="rgba(255,255,255,0.3)" />
                  <Text style={styles.trustLabel}>{t.label}</Text>
                </View>
              ))}
            </Animated.View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0A0818' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  // Brand
  brandWrap: { alignItems: 'center', marginTop: 44, marginBottom: 32 },
  logoGradient: {
    width: 72, height: 72, borderRadius: 22,
    padding: 2,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55, shadowRadius: 20,
    elevation: 12,
  },
  logoInner: {
    flex: 1, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  brandNameRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 14, gap: 6,
  },
  brandName: {
    fontSize: 22, fontWeight: '900', color: '#fff',
    letterSpacing: 1.5,
  },
  brandDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#8B5CF6',
  },
  brandNameAccent: {
    fontSize: 22, fontWeight: '300', color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13, color: 'rgba(255,255,255,0.35)',
    marginTop: 6, letterSpacing: 0.2,
  },

  // Headline
  headlineWrap: { marginBottom: 24 },
  headlineHi: {
    fontSize: 28, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: -0.6, marginBottom: 6,
  },
  headlineSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 20,
  },

  // Card
  cardShadow: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 28,
    elevation: 16, borderRadius: 28,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    paddingTop: 6,
    overflow: 'hidden',
  },
  cardTopBar: {
    height: 2, borderRadius: 1,
    marginBottom: 24,
  },

  // Forgot Password
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '600',
  },

  // Login Button
  loginBtn: {
    height: 56, borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', gap: 10,
  },
  btnGlow: {
    position: 'absolute', top: -20,
    width: 120, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  loginBtnText: {
    fontSize: 16, fontWeight: '800', color: '#fff',
    letterSpacing: 0.3,
  },
  btnArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 20, gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)' },
  dividerText: { fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: '600' },

  // Register
  registerBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderRadius: 14, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)',
  },
  registerText:   { fontSize: 14, color: 'rgba(255,255,255,0.45)' },
  registerAccent: { fontSize: 14, fontWeight: '700', color: '#8B5CF6' },

  // Trust badges
  trustRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 24, marginTop: 28,
  },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustLabel: { fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: '600' },
});

export default LoginScreen;
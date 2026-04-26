/**
 * screens/auth/RegisterScreen.js — Premium Redesign
 *
 * Design direction: Matches LoginScreen dark luxury aesthetic.
 * Deep navy base, indigo/violet accents, glassmorphism card,
 * staggered spring entry animations, animated focus inputs,
 * step-progress indicator, memoized fields preserved.
 *
 * Updated: Added email field per auth controller (phone OR email required).
 */

import React, { useState, useCallback, memo, useRef, useEffect } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import useAuthStore from "../../store/authStore";

const { width } = Dimensions.get("window");

// ─── Background orbs (reused from LoginScreen) ────────────────────────────────
const BackgroundOrbs = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={["#0A0818", "#0F0E2A", "#0A0818"]}
      style={StyleSheet.absoluteFill}
    />
    <View
      style={[
        styles.orb,
        {
          width: 260,
          height: 260,
          borderRadius: 130,
          top: -70,
          right: -70,
          backgroundColor: "rgba(108,99,255,0.16)",
        },
      ]}
    />
    <View
      style={[
        styles.orb,
        {
          width: 200,
          height: 200,
          borderRadius: 100,
          bottom: 80,
          left: -50,
          backgroundColor: "rgba(99,179,255,0.09)",
        },
      ]}
    />
    <View
      style={[
        styles.orb,
        {
          width: 140,
          height: 140,
          borderRadius: 70,
          top: "45%",
          left: width / 2 - 70,
          backgroundColor: "rgba(139,92,246,0.07)",
        },
      ]}
    />
  </View>
);

// ─── Step progress dots ───────────────────────────────────────────────────────
const StepDots = ({ total = 2, current = 0 }) => (
  <View style={styles.dotsRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.dot,
          i === current && styles.dotActive,
          i < current && styles.dotDone,
        ]}
      >
        {i < current && <Ionicons name="checkmark" size={9} color="#fff" />}
      </View>
    ))}
    <View style={[styles.dotTrack, { width: (total - 1) * 36 }]}>
      <View
        style={[styles.dotFill, { width: `${(current / (total - 1)) * 100}%` }]}
      />
    </View>
  </View>
);

// ─── Animated premium input ───────────────────────────────────────────────────
const PremiumField = memo(
  ({
    label,
    fieldKey,
    form,
    update,
    placeholder,
    keyboardType,
    maxLength,
    secureTextEntry,
    autoCapitalize,
    icon,
    optional = false,
  }) => {
    const [show, setShow] = useState(false);
    const focused = useRef(new Animated.Value(0)).current;

    const onFocus = () => {
      Animated.spring(focused, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: false,
      }).start();
    };
    const onBlur = () => {
      Animated.spring(focused, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: false,
      }).start();
    };

    const borderColor = focused.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(255,255,255,0.08)", "rgba(108,99,255,0.75)"],
    });
    const bgColor = focused.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(255,255,255,0.04)", "rgba(108,99,255,0.08)"],
    });

    const isPassword = secureTextEntry !== undefined;

    return (
      <View style={fieldStyles.group}>
        <View style={fieldStyles.labelRow}>
          <Text style={fieldStyles.label}>{label}</Text>
          {optional && <Text style={fieldStyles.optionalBadge}>optional</Text>}
        </View>
        <Animated.View
          style={[
            fieldStyles.wrapper,
            { borderColor, backgroundColor: bgColor },
          ]}
        >
          {icon && (
            <View style={fieldStyles.iconWrap}>
              <Ionicons name={icon} size={16} color="rgba(255,255,255,0.3)" />
            </View>
          )}
          <TextInput
            style={fieldStyles.field}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType={keyboardType || "default"}
            maxLength={maxLength}
            secureTextEntry={isPassword ? !show : false}
            autoCapitalize={autoCapitalize || "words"}
            value={form[fieldKey]}
            onChangeText={(v) => update(fieldKey, v)}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          {isPassword && (
            <TouchableOpacity
              onPress={() => setShow(!show)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={show ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="rgba(255,255,255,0.3)"
              />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    );
  },
);

const fieldStyles = StyleSheet.create({
  group: { marginBottom: 18 },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  optionalBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(139,92,246,0.7)",
    backgroundColor: "rgba(139,92,246,0.12)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
  },
  iconWrap: { marginRight: 10 },
  field: { flex: 1, fontSize: 15, color: "#FFFFFF", letterSpacing: 0.2 },
});

// ─── Section divider ──────────────────────────────────────────────────────────
const SectionDivider = ({ label }) => (
  <View style={styles.sectionDivRow}>
    <View style={styles.sectionDivLine} />
    <Text style={styles.sectionDivLabel}>{label}</Text>
    <View style={styles.sectionDivLine} />
  </View>
);

// ─── Main RegisterScreen ──────────────────────────────────────────────────────
const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    businessName: "",
    gstin: "",
    referCode: "",
  });
  const [loading, setLoading] = useState(false);

  const register = useAuthStore((state) => state.register);

  const update = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Entry animations
  const backAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.spring(backAnim, {
        toValue: 1,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(titleAnim, {
        toValue: 1,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(card1Anim, {
        toValue: 1,
        tension: 55,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(card2Anim, {
        toValue: 1,
        tension: 55,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(btnAnim, {
        toValue: 1,
        tension: 55,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const slideUp = (anim, distance = 28) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  });

  const handleRegister = async () => {
    const hasPhone = form.phone.trim().length > 0;
    const hasEmail = form.email.trim().length > 0;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!form.name.trim()) {
      return Alert.alert("Missing Info", "Please enter your full name.");
    }

    if (!hasPhone) {
      return Alert.alert("Missing Info", "Please enter your mobile number.");
    }

    if (form.phone.trim().length !== 10) {
      return Alert.alert(
        "Invalid Number",
        "Enter a valid 10-digit mobile number.",
      );
    }

    if (!hasEmail) {
      return Alert.alert("Missing Info", "Please enter your email address.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return Alert.alert(
        "Invalid Email",
        "Please enter a valid email address.",
      );
    }

    if (!form.password.trim()) {
      return Alert.alert("Missing Info", "Please enter a password.");
    }

    if (form.password.length < 6) {
      return Alert.alert(
        "Weak Password",
        "Password must be at least 6 characters.",
      );
    }

    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      Alert.alert(
        "Registration Failed",
        err?.response?.data?.message || "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Button press scale
  const btnScale = useRef(new Animated.Value(1)).current;
  const onBtnIn = () =>
    Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  const onBtnOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <View style={styles.root}>
      <BackgroundOrbs />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Back button ───────────────────────────────────────────── */}
            <Animated.View style={[styles.backWrap, slideUp(backAnim, 12)]}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="arrow-back"
                  size={18}
                  color="rgba(255,255,255,0.8)"
                />
              </TouchableOpacity>
              <Text style={styles.backLabel}>Back to Sign in</Text>
            </Animated.View>

            {/* ── Title block ───────────────────────────────────────────── */}
            <Animated.View style={[styles.titleBlock, slideUp(titleAnim)]}>
              <View style={styles.titleBadge}>
                <View style={styles.titleBadgeDot} />
                <Text style={styles.titleBadgeText}>New Account</Text>
              </View>
              <Text style={styles.headline}>
                Create your{"\n"}GST workspace
              </Text>
              <Text style={styles.subline}>
                Join thousands of Indian businesses managing GST smarter
              </Text>
            </Animated.View>

            {/* ── Card 1: Identity ─────────────────────────────────────── */}
            <Animated.View style={[styles.cardShadow, slideUp(card1Anim)]}>
              <View style={styles.card}>
                <LinearGradient
                  colors={["transparent", "#6C63FF", "#8B5CF6", "transparent"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.cardTopBar}
                />

                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderIcon}>
                    <Ionicons name="person-outline" size={14} color="#8B5CF6" />
                  </View>
                  <Text style={styles.cardHeaderLabel}>Your Identity</Text>
                </View>

                <PremiumField
                  label="Full Name"
                  fieldKey="name"
                  form={form}
                  update={update}
                  placeholder="e.g. Rahul Sharma"
                  icon="person-outline"
                  autoCapitalize="words"
                />

                {/* ── Phone · OR · Email (controller accepts either) ── */}
                <PremiumField
                  label="Mobile Number"
                  fieldKey="phone"
                  form={form}
                  update={update}
                  placeholder="+91 · 10-digit number"
                  keyboardType="phone-pad"
                  maxLength={10}
                  icon="call-outline"
                  autoCapitalize="none"
                />

                <PremiumField
                  label="Email Address"
                  fieldKey="email"
                  form={form}
                  update={update}
                  placeholder="e.g. rahul@example.com"
                  keyboardType="email-address"
                  icon="mail-outline"
                  autoCapitalize="none"
                />

                <PremiumField
                  label="Password"
                  fieldKey="password"
                  form={form}
                  update={update}
                  placeholder="Min 6 characters"
                  secureTextEntry={false}
                  icon="lock-closed-outline"
                  autoCapitalize="none"
                />
              </View>
            </Animated.View>

            {/* ── Card 2: Business ─────────────────────────────────────── */}
            <Animated.View style={[styles.cardShadow, slideUp(card2Anim)]}>
              <View style={styles.card}>
                <LinearGradient
                  colors={["transparent", "#059669", "#10B981", "transparent"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.cardTopBar}
                />

                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.cardHeaderIcon,
                      { backgroundColor: "rgba(5,150,105,0.15)" },
                    ]}
                  >
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color="#10B981"
                    />
                  </View>
                  <Text style={styles.cardHeaderLabel}>Business Details</Text>
                  <View style={styles.cardOptBadge}>
                    <Text style={styles.cardOptText}>optional</Text>
                  </View>
                </View>

                <PremiumField
                  label="Business Name"
                  fieldKey="businessName"
                  form={form}
                  update={update}
                  placeholder="Your firm / company name"
                  icon="storefront-outline"
                  optional
                />

                <PremiumField
                  label="GSTIN"
                  fieldKey="gstin"
                  form={form}
                  update={update}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  autoCapitalize="characters"
                  maxLength={15}
                  icon="barcode-outline"
                  optional
                />

                {/* GSTIN hint */}
                <View style={styles.gstinHint}>
                  <Ionicons
                    name="information-circle-outline"
                    size={13}
                    color="rgba(255,255,255,0.25)"
                  />
                  <Text style={styles.gstinHintText}>
                    15-character alphanumeric · can be added later
                  </Text>
                </View>

                {/* Referral Code */}
                <View style={{ marginTop: 8 }}>
                  <PremiumField
                    label="Referral Code"
                    fieldKey="referCode"
                    form={form}
                    update={update}
                    placeholder="e.g. A3F9B2"
                    autoCapitalize="characters"
                    maxLength={6}
                    icon="gift-outline"
                    optional
                  />
                  <View style={styles.gstinHint}>
                    <Ionicons
                      name="people-outline"
                      size={13}
                      color="rgba(255,255,255,0.25)"
                    />
                    <Text style={styles.gstinHintText}>
                      Got a code from a friend? Enter it here · optional
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* ── Create Account button ─────────────────────────────────── */}
            <Animated.View
              style={[{ transform: [{ scale: btnScale }] }, slideUp(btnAnim)]}
            >
              <TouchableOpacity
                onPress={handleRegister}
                onPressIn={onBtnIn}
                onPressOut={onBtnOut}
                disabled={loading}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={
                    loading
                      ? ["#4B4891", "#4B4891"]
                      : ["#6C63FF", "#8B5CF6", "#A78BFA"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createBtn}
                >
                  <View style={styles.createBtnGlow} />
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.createBtnText}>Create Account</Text>
                      <View style={styles.createBtnArrow}>
                        <Ionicons
                          name="arrow-forward"
                          size={16}
                          color="#6C63FF"
                        />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* ── Sign in link ──────────────────────────────────────────── */}
            <Animated.View style={[styles.signinRow, slideUp(btnAnim)]}>
              <Text style={styles.signinText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Text style={styles.signinAccent}> Sign in</Text>
              </TouchableOpacity>
              <Ionicons
                name="chevron-forward"
                size={13}
                color="#8B5CF6"
                style={{ marginLeft: 2 }}
              />
            </Animated.View>

            {/* ── Terms note ────────────────────────────────────────────── */}
            <Animated.View style={[styles.termsRow, slideUp(btnAnim)]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={12}
                color="rgba(255,255,255,0.18)"
              />
              <Text style={styles.termsText}>
                By registering, you agree to our Terms & Privacy Policy
              </Text>
            </Animated.View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0818" },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  orb: { position: "absolute" },

  // Back
  backWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  backLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  // Title
  titleBlock: { marginBottom: 24 },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(108,99,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(108,99,255,0.2)",
  },
  titleBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#8B5CF6",
  },
  titleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#A78BFA",
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 30,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
    lineHeight: 36,
    marginBottom: 10,
  },
  subline: { fontSize: 14, color: "rgba(255,255,255,0.38)", lineHeight: 20 },

  // Cards
  cardShadow: {
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 14,
    borderRadius: 24,
    marginBottom: 14,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    paddingTop: 6,
    overflow: "hidden",
  },
  cardTopBar: { height: 2, borderRadius: 1, marginBottom: 20 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  cardHeaderIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(108,99,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.3,
    flex: 1,
  },
  cardOptBadge: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
  },
  cardOptText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#10B981",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // GSTIN hint
  gstinHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    padding: 10,
    marginTop: -4,
  },
  gstinHintText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    lineHeight: 16,
    flex: 1,
  },

  // Create button
  createBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  createBtnGlow: {
    position: "absolute",
    top: -18,
    width: 120,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  createBtnArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  // Sign in link
  signinRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  signinText: { fontSize: 14, color: "rgba(255,255,255,0.4)" },
  signinAccent: { fontSize: 14, fontWeight: "700", color: "#8B5CF6" },

  // Terms
  termsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  termsText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    textAlign: "center",
    flex: 1,
  },

  // Section divider
  sectionDivRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 16,
  },
  sectionDivLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  sectionDivLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    fontWeight: "600",
  },

  // Dots (kept for future step UI)
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    position: "relative",
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  dotActive: { backgroundColor: "#6C63FF", borderColor: "#8B5CF6" },
  dotDone: { backgroundColor: "#059669", borderColor: "#10B981" },
  dotTrack: {
    position: "absolute",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  dotFill: { height: "100%", backgroundColor: "#6C63FF" },
});

export default RegisterScreen;

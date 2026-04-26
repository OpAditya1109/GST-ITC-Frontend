/**
 * screens/auth/ForgotPasswordScreen.js
 * 3-step flow: Enter Email → Verify OTP → Set New Password
 * OTP step uses 6 individual boxes with auto-advance & backspace handling.
 */

import React, { useState, useRef, useEffect } from "react";
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
import { authAPI } from "../../services/api";

const { width } = Dimensions.get("window");

// ─── Background ───────────────────────────────────────────────────────────────
const BackgroundOrbs = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={["#0A0818", "#0F0E2A", "#0A0818"]}
      style={StyleSheet.absoluteFill}
    />
    <View style={[styles.orb, { width: 260, height: 260, borderRadius: 130, top: -70, right: -70, backgroundColor: "rgba(108,99,255,0.16)" }]} />
    <View style={[styles.orb, { width: 180, height: 180, borderRadius: 90, bottom: 80, left: -50, backgroundColor: "rgba(99,179,255,0.09)" }]} />
  </View>
);

// ─── Animated input ───────────────────────────────────────────────────────────
const PremiumInput = ({ label, value, onChangeText, placeholder, keyboardType, maxLength, secureTextEntry, icon, rightElement }) => {
  const focused = useRef(new Animated.Value(0)).current;

  const borderColor = focused.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", "rgba(108,99,255,0.75)"],
  });
  const bgColor = focused.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.04)", "rgba(108,99,255,0.08)"],
  });

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={inputStyles.label}>{label}</Text>
      <Animated.View style={[inputStyles.wrapper, { borderColor, backgroundColor: bgColor }]}>
        {icon && (
          <View style={inputStyles.iconWrap}>
            <Ionicons name={icon} size={16} color="rgba(255,255,255,0.3)" />
          </View>
        )}
        <TextInput
          style={inputStyles.field}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          keyboardType={keyboardType || "default"}
          maxLength={maxLength}
          secureTextEntry={secureTextEntry || false}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          onFocus={() => Animated.spring(focused, { toValue: 1, tension: 80, friction: 8, useNativeDriver: false }).start()}
          onBlur={() => Animated.spring(focused, { toValue: 0, tension: 80, friction: 8, useNativeDriver: false }).start()}
        />
        {rightElement}
      </Animated.View>
    </View>
  );
};

const inputStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  wrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, height: 54 },
  iconWrap: { marginRight: 10 },
  field: { flex: 1, fontSize: 15, color: "#FFFFFF", letterSpacing: 0.2 },
});

// ─── 6-Box OTP Input ──────────────────────────────────────────────────────────
const OtpBoxes = ({ value, onChange }) => {
  const digits = value.split("");
  const inputRefs = useRef([]);

  const handleChange = (text, index) => {
    // Only allow single digit
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;

    // Pad/trim to 6
    const newValue = newDigits.join("").padEnd(6, "").slice(0, 6).trimEnd
      ? newDigits.slice(0, 6).join("")
      : newDigits.join("");

    onChange(newValue);

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace") {
      if (digits[index]) {
        // Clear current box
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      } else if (index > 0) {
        // Move to previous box and clear it
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={otpStyles.container}>
      <Text style={otpStyles.label}>6-DIGIT OTP</Text>
      <View style={otpStyles.row}>
        {Array.from({ length: 6 }).map((_, i) => {
          const isFilled = !!digits[i];
          const isActive = digits.length === i || (i === 5 && digits.length >= 5);
          return (
            <Animated.View key={i} style={[otpStyles.box, isFilled && otpStyles.boxFilled, isActive && otpStyles.boxActive]}>
              <TextInput
                ref={(r) => (inputRefs.current[i] = r)}
                style={otpStyles.digit}
                keyboardType="number-pad"
                maxLength={2} // allow 2 so backspace replacement works
                value={digits[i] || ""}
                onChangeText={(t) => handleChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                caretHidden
                selectTextOnFocus
              />
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const otpStyles = StyleSheet.create({
  container: { marginBottom: 8 },
  label: {
    fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.4)",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  box: {
    flex: 1,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  boxFilled: {
    borderColor: "rgba(108,99,255,0.6)",
    backgroundColor: "rgba(108,99,255,0.1)",
  },
  boxActive: {
    borderColor: "rgba(108,99,255,0.9)",
    backgroundColor: "rgba(108,99,255,0.12)",
  },
  digit: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    width: "100%",
    height: "100%",
    padding: 0,
  },
});

// ─── Step progress bar ────────────────────────────────────────────────────────
const StepBar = ({ step }) => {
  const steps = ["Email", "OTP", "Password"];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <View style={{ alignItems: "center" }}>
            <View style={[stepBarStyles.circle, i < step && stepBarStyles.done, i === step && stepBarStyles.active]}>
              {i < step
                ? <Ionicons name="checkmark" size={12} color="#fff" />
                : <Text style={[stepBarStyles.num, i === step && { color: "#fff" }]}>{i + 1}</Text>
              }
            </View>
            <Text style={[stepBarStyles.stepLabel, i === step && { color: "#A78BFA" }]}>{s}</Text>
          </View>
          {i < steps.length - 1 && (
            <View style={[stepBarStyles.line, i < step && { backgroundColor: "#6C63FF" }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

const stepBarStyles = StyleSheet.create({
  circle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  active: { backgroundColor: "#6C63FF", borderColor: "#8B5CF6" },
  done: { backgroundColor: "#059669", borderColor: "#10B981" },
  num: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.3)" },
  stepLabel: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4, fontWeight: "600" },
  line: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginHorizontal: 6, marginBottom: 18 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const cardAnim = useRef(new Animated.Value(0)).current;

  const animateIn = () => {
    cardAnim.setValue(0);
    Animated.spring(cardAnim, { toValue: 1, tension: 55, friction: 10, useNativeDriver: true }).start();
  };

  useEffect(() => { animateIn(); }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const slideUp = {
    opacity: cardAnim,
    transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };

  const goToStep = (n) => { animateIn(); setStep(n); };

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes("@")) {
      return Alert.alert("Invalid Email", "Please enter a valid email address.");
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      goToStep(1);
      setResendCountdown(60);
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      return Alert.alert("Invalid OTP", "Please fill in all 6 digits.");
    }
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp(email.trim(), otp);
      setResetToken(res.data.resetToken);
      goToStep(2);
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) return Alert.alert("Weak Password", "Password must be at least 6 characters.");
    if (newPassword !== confirmPassword) return Alert.alert("Mismatch", "Passwords do not match.");
    setLoading(true);
    try {
      await authAPI.resetPassword(resetToken, newPassword);
      Alert.alert("Success 🎉", "Your password has been reset. Please log in.", [
        { text: "Sign In", onPress: () => navigation.replace("Login") },
      ]);
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setOtp("");
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim());
      setResendCountdown(60);
      Alert.alert("OTP Resent", "A new OTP has been sent to your email.");
    } catch (err) {
      Alert.alert("Error", err?.response?.data?.message || "Could not resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = [
    { headline: "Forgot Password?", sub: "Enter your registered email and we'll send you a 6-digit OTP." },
    { headline: "Enter OTP", sub: `A 6-digit code was sent to\n${email}` },
    { headline: "New Password", sub: "Choose a strong password to secure your account." },
  ];

  const handleBack = () => {
    if (step === 0) navigation.goBack();
    else goToStep(step - 1);
  };

  return (
    <View style={styles.root}>
      <BackgroundOrbs />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Back */}
            <View style={styles.backWrap}>
              <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.75}>
                <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
              <Text style={styles.backLabel}>{step === 0 ? "Back to Sign in" : "Back"}</Text>
            </View>

            <StepBar step={step} />

            <View style={styles.titleBlock}>
              <Text style={styles.headline}>{stepTitles[step].headline}</Text>
              <Text style={styles.subline}>{stepTitles[step].sub}</Text>
            </View>

            <Animated.View style={[styles.cardShadow, slideUp]}>
              <View style={styles.card}>
                <LinearGradient
                  colors={["transparent", "#6C63FF", "#8B5CF6", "transparent"]}
                  start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                  style={styles.cardTopBar}
                />

                {step === 0 && (
                  <PremiumInput
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    icon="mail-outline"
                  />
                )}

                {step === 1 && (
                  <>
                    <OtpBoxes value={otp} onChange={setOtp} />
                    <TouchableOpacity
                      onPress={handleResend}
                      disabled={resendCountdown > 0}
                      activeOpacity={0.7}
                      style={styles.resendRow}
                    >
                      <Text style={[styles.resendText, resendCountdown > 0 && { color: "rgba(255,255,255,0.3)" }]}>
                        {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : "Didn't receive it? Resend OTP"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {step === 2 && (
                  <>
                    <PremiumInput
                      label="New Password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Min 6 characters"
                      secureTextEntry={!showPwd}
                      icon="lock-closed-outline"
                      rightElement={
                        <TouchableOpacity onPress={() => setShowPwd((v) => !v)} activeOpacity={0.7}>
                          <Ionicons name={showPwd ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>
                      }
                    />
                    <PremiumInput
                      label="Confirm Password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Repeat your password"
                      secureTextEntry={!showConfirm}
                      icon="lock-closed-outline"
                      rightElement={
                        <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} activeOpacity={0.7}>
                          <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.3)" />
                        </TouchableOpacity>
                      }
                    />
                  </>
                )}

                {/* CTA */}
                <TouchableOpacity
                  onPress={step === 0 ? handleSendOtp : step === 1 ? handleVerifyOtp : handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={{ marginTop: 12 }}
                >
                  <LinearGradient
                    colors={loading ? ["#4B4891", "#4B4891"] : ["#6C63FF", "#8B5CF6", "#A78BFA"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.ctaBtn}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.ctaBtnText}>
                          {step === 0 ? "Send OTP" : step === 1 ? "Verify OTP" : "Reset Password"}
                        </Text>
                        <View style={styles.ctaBtnArrow}>
                          <Ionicons name="arrow-forward" size={16} color="#6C63FF" />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <View style={styles.signinRow}>
              <Text style={styles.signinText}>Remembered your password?</Text>
              <TouchableOpacity onPress={() => navigation.replace("Login")} activeOpacity={0.7}>
                <Text style={styles.signinAccent}> Sign in</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0818" },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  orb: { position: "absolute" },

  backWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28 },
  backBtn: {
    width: 38, height: 38, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  backLabel: { fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: "500" },

  titleBlock: { marginBottom: 24 },
  headline: { fontSize: 28, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.8, lineHeight: 34, marginBottom: 8 },
  subline: { fontSize: 14, color: "rgba(255,255,255,0.38)", lineHeight: 20 },

  cardShadow: {
    shadowColor: "#6C63FF", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 14,
    borderRadius: 24, marginBottom: 14,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 24, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20, paddingTop: 6, overflow: "hidden",
  },
  cardTopBar: { height: 2, borderRadius: 1, marginBottom: 20 },

  resendRow: { alignSelf: "flex-end", marginTop: 8, marginBottom: 8 },
  resendText: { fontSize: 13, color: "#8B5CF6", fontWeight: "600" },

  ctaBtn: {
    height: 56, borderRadius: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, overflow: "hidden",
  },
  ctaBtnText: { fontSize: 16, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  ctaBtnArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },

  signinRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20 },
  signinText: { fontSize: 14, color: "rgba(255,255,255,0.4)" },
  signinAccent: { fontSize: 14, fontWeight: "700", color: "#8B5CF6" },
});

export default ForgotPasswordScreen;
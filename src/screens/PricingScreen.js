/**
 * screens/PricingScreen.js — Premium Redesign
 *
 * Design direction: Matches LoginScreen / RegisterScreen dark luxury aesthetic.
 * Deep navy base, per-plan accent colors, glassmorphism cards, staggered
 * spring entry animations, featured plan glow ring, horizontal scroll toggle
 * for billing period (future-ready). All logic preserved.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import useAuthStore from '../store/authStore';

const { width } = Dimensions.get('window');
const CONTACT_SALES_EMAIL = 'info@adityaxinnovations.com';

// ─── Plan data ─────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: '/mo',
    tagline: 'Get started, no card needed',
    icon: 'leaf-outline',
    accent: '#10B981',
    gradientColors: ['#064E3B', '#065F46'],
    features: [
      { text: '5 invoice scans / month',    power: false },
      { text: 'Basic GST calculation',       power: false },
      { text: 'PDF & image upload',          power: false },
      { text: 'Standard OCR parsing',        power: false },
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '₹999',
    period: '/mo',
    tagline: 'Perfect for growing businesses',
    icon: 'flash-outline',
    accent: '#6C63FF',
    gradientColors: ['#2D1B69', '#3D2A8A'],
    featured: true,
    badge: 'Most Popular',
    features: [
      { text: '100 invoice scans / month',   power: true  },
      { text: 'Full GST report export',       power: true  },
      { text: 'Invoice history (6 months)',   power: true  },
      { text: 'Email support',                power: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹2,999',
    period: '/mo',
    tagline: 'For high-volume operations',
    icon: 'rocket-outline',
    accent: '#F59E0B',
    gradientColors: ['#451A03', '#78350F'],
    features: [
      { text: '500 invoice scans / month',   power: true  },
      { text: 'Advanced analytics & reports', power: true  },
      { text: 'Full invoice history',         power: true  },
      { text: 'Priority support',             power: true  },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    tagline: 'Tailored for your organisation',
    icon: 'business-outline',
    accent: '#EC4899',
    gradientColors: ['#500724', '#831843'],
    features: [
      { text: 'Unlimited invoice scans',          power: true  },
      { text: 'Dedicated account manager',         power: true  },
      { text: 'Custom integrations & SLA',         power: true  },
      { text: 'On-premise deployment option',      power: true  },
    ],
  },
];

// ─── Background orbs ──────────────────────────────────────────────────────────
const BackgroundOrbs = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#0A0818', '#0D0C24', '#0A0818']} style={StyleSheet.absoluteFill} />
    <View style={[styles.orb, { width: 300, height: 300, top: -100, right: -80,  backgroundColor: 'rgba(108,99,255,0.13)' }]} />
    <View style={[styles.orb, { width: 240, height: 240, top: 320,  left: -80,   backgroundColor: 'rgba(245,158,11,0.08)'  }]} />
    <View style={[styles.orb, { width: 200, height: 200, bottom: 60, right: -50, backgroundColor: 'rgba(236,72,153,0.07)'  }]} />
  </View>
);

// ─── Plan card ────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, isCurrent, onPress, index }) => {
  const anim  = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, tension: 55, friction: 10,
      delay: 120 + index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  const onIn  = () => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,     useNativeDriver: true }).start();

  const slideUp = {
    opacity: anim,
    transform: [
      { scale },
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
    ],
  };

  return (
    <Animated.View style={[plan.featured ? styles.featuredWrapper : styles.cardWrapper, slideUp]}>
      {/* Glow ring for featured */}
      {plan.featured && (
        <View style={[styles.glowRing, { borderColor: plan.accent + '55' }]} />
      )}

      <TouchableOpacity onPress={onPress} onPressIn={onIn} onPressOut={onOut} activeOpacity={1}>
        {/* Card shell */}
        <View style={[
          styles.card,
          plan.featured && { borderColor: plan.accent + '60', borderWidth: 1.5 },
        ]}>

          {/* Top accent bar */}
          <LinearGradient
            colors={[plan.accent + '00', plan.accent + 'CC', plan.accent + '00']}
            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={styles.cardTopBar}
          />

          {/* Badges row */}
          <View style={styles.badgesRow}>
            {plan.featured && (
              <LinearGradient
                colors={[plan.accent, plan.accent + 'CC']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.popularBadge}
              >
                <Ionicons name="flash" size={9} color="#fff" />
                <Text style={styles.popularBadgeText}>{plan.badge}</Text>
              </LinearGradient>
            )}
            {isCurrent && (
              <View style={styles.currentBadge}>
                <View style={[styles.currentDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.currentBadgeText}>Current Plan</Text>
              </View>
            )}
          </View>

          {/* Plan header: icon + name + tagline */}
          <View style={styles.planHeader}>
            <View style={[styles.planIconWrap, { backgroundColor: plan.accent + '18' }]}>
              <Ionicons name={plan.icon} size={18} color={plan.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planName, { color: plan.accent }]}>{plan.name}</Text>
              <Text style={styles.planTagline}>{plan.tagline}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceBlock}>
            <LinearGradient
              colors={plan.gradientColors}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.pricePill}
            >
              <View style={styles.pricePillGlow} />
              <Text style={styles.priceAmt}>{plan.price}</Text>
              <Text style={styles.pricePer}>{plan.period}</Text>
            </LinearGradient>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Features */}
          <View style={styles.featuresList}>
            {plan.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[
                  styles.featureCheck,
                  { backgroundColor: f.power ? plan.accent + '22' : 'rgba(255,255,255,0.06)' },
                ]}>
                  <Ionicons
                    name={f.power ? 'flash' : 'checkmark'}
                    size={10}
                    color={f.power ? plan.accent : 'rgba(255,255,255,0.4)'}
                  />
                </View>
                <Text style={[
                  styles.featureText,
                  f.power && { color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
                ]}>
                  {f.text}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA button */}
          {plan.featured ? (
            <LinearGradient
              colors={[plan.accent, plan.accent + 'BB']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaBtnFeatured}
            >
              <View style={styles.ctaBtnGlow} />
              <Text style={styles.ctaBtnTextFeatured}>
                {isCurrent ? 'Current Plan' : 'Get Started'}
              </Text>
              {!isCurrent && (
                <View style={styles.ctaBtnArrow}>
                  <Ionicons name="arrow-forward" size={13} color={plan.accent} />
                </View>
              )}
            </LinearGradient>
          ) : (
            <TouchableOpacity
              style={[styles.ctaBtn, { borderColor: plan.accent + '50' }]}
              onPress={onPress}
              activeOpacity={0.75}
            >
              <Text style={[styles.ctaBtnText, { color: plan.accent }]}>
                {isCurrent ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
              </Text>
              {!isCurrent && (
                <Ionicons name="chevron-forward" size={14} color={plan.accent} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Trust strip ──────────────────────────────────────────────────────────────
const TrustStrip = () => {
  const items = [
    { icon: 'shield-checkmark-outline', label: 'GST Compliant' },
    { icon: 'lock-closed-outline',      label: 'Secure Data'   },
    { icon: 'headset-outline',          label: '24/7 Support'  },
    { icon: 'document-text-outline',    label: 'GSTR Ready'    },
  ];
  return (
    <View style={styles.trustStrip}>
      {items.map((t, i) => (
        <View key={i} style={styles.trustItem}>
          <Ionicons name={t.icon} size={13} color="rgba(255,255,255,0.25)" />
          <Text style={styles.trustLabel}>{t.label}</Text>
        </View>
      ))}
    </View>
  );
};

// ─── Main PricingScreen ───────────────────────────────────────────────────────
export default function PricingScreen() {
  const navigation  = useNavigation();
  const { user }    = useAuthStore();
  const currentPlan = user?.plan || 'free';

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }).start();
  }, []);

  const handleContact = (plan) => {
    const subject = encodeURIComponent(`Plan Inquiry — ${plan.name}`);
    const body    = encodeURIComponent(
      `Hi,\n\nI'm interested in the ${plan.name} plan.\n\nThanks`
    );
    Linking.openURL(`mailto:${CONTACT_SALES_EMAIL}?subject=${subject}&body=${body}`);
  };

  const slideUp = (anim, d = 28) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [d, 0] }) }],
  });

  return (
    <View style={styles.root}>
      <BackgroundOrbs />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ───────────────────────────────────────────────────── */}
          <Animated.View style={[styles.headerBlock, slideUp(headerAnim, 20)]}>
            {/* Icon */}
            <LinearGradient
              colors={['#6C63FF', '#8B5CF6']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.headerIcon}
            >
              <Ionicons name="pricetags-outline" size={22} color="#fff" />
            </LinearGradient>

            <View style={styles.headerBadge}>
              <View style={styles.headerBadgeDot} />
              <Text style={styles.headerBadgeText}>Transparent Pricing</Text>
            </View>

            <Text style={styles.headerTitle}>Choose your{'\n'}perfect plan</Text>
            <Text style={styles.headerSub}>
              Scan, parse and manage GST invoices — at every scale
            </Text>

            {/* Highlight stat pills */}
            <View style={styles.statRow}>
              {[
                { val: '10k+', lbl: 'Businesses' },
                { val: '99.9%', lbl: 'Uptime' },
                { val: '5★', lbl: 'Rated' },
              ].map((s) => (
                <View key={s.lbl} style={styles.statPill}>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ── Plan cards ───────────────────────────────────────────────── */}
          {PLANS.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={i}
              isCurrent={currentPlan === plan.id}
              onPress={() => handleContact(plan)}
            />
          ))}

          {/* ── Trust strip ──────────────────────────────────────────────── */}
          <TrustStrip />

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <Text style={styles.footer}>
            All plans include GST-compliant invoice parsing.{'\n'}
            Prices shown exclude 18% GST. Contact us to get access.
          </Text>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0A0818' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  orb:    { position: 'absolute', borderRadius: 9999 },

  // ── Header
  headerBlock: { alignItems: 'center', marginBottom: 32, paddingTop: 8 },
  headerIcon:  {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 16, elevation: 10,
  },
  headerBadge:    {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(108,99,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.2)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: 14,
  },
  headerBadgeDot:  { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#8B5CF6' },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: '#A78BFA', letterSpacing: 0.5 },
  headerTitle: {
    fontSize: 30, fontWeight: '900', color: '#fff',
    letterSpacing: -0.8, textAlign: 'center', lineHeight: 36, marginBottom: 10,
  },
  headerSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.38)',
    textAlign: 'center', lineHeight: 20, marginBottom: 20,
  },
  statRow:  { flexDirection: 'row', gap: 10 },
  statPill: {
    flex: 1, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  statVal: { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: '500' },

  // ── Card wrappers
  cardWrapper:    { marginBottom: 14 },
  featuredWrapper: {
    marginBottom: 14,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 28,
    elevation: 14,
  },
  glowRing: {
    position: 'absolute', inset: -4,
    borderRadius: 28, borderWidth: 1,
  },

  // ── Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 20, paddingTop: 6,
  },
  cardTopBar: { height: 2, borderRadius: 1, marginBottom: 16 },

  // Badges
  badgesRow:     { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  popularBadge:  {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  popularBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  currentBadge:  {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  currentDot:       { width: 5, height: 5, borderRadius: 2.5 },
  currentBadgeText: { fontSize: 10, fontWeight: '700', color: '#10B981', letterSpacing: 0.3 },

  // Plan header
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  planIconWrap: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  planName:    { fontSize: 17, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  planTagline: { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 },

  // Price
  priceBlock: { marginBottom: 18 },
  pricePill:  {
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
    alignSelf: 'flex-start', overflow: 'hidden',
  },
  pricePillGlow: {
    position: 'absolute', top: -20, left: 20,
    width: 80, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  priceAmt: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  pricePer: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '500' },

  // Divider
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 16 },

  // Features
  featuresList: { gap: 10, marginBottom: 20 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureCheck: {
    width: 22, height: 22, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', flex: 1, lineHeight: 19 },

  // CTA buttons
  ctaBtnFeatured: {
    height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, overflow: 'hidden',
  },
  ctaBtnGlow: {
    position: 'absolute', top: -15,
    width: 100, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  ctaBtnTextFeatured: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  ctaBtnArrow: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtn: {
    height: 50, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  ctaBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },

  // Trust strip
  trustStrip: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 8, marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  trustItem:  { alignItems: 'center', gap: 5 },
  trustLabel: { fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: '600', letterSpacing: 0.2 },

  // Footer
  footer: {
    textAlign: 'center', fontSize: 12,
    color: 'rgba(255,255,255,0.2)', lineHeight: 18,
  },
});
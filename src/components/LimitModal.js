/**
 * components/LimitModal.js — Premium Scan Limit Reached Modal
 * Glassmorphism design with animated entrance, matching ScanScreen aesthetic
 */

import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Animated ring orbiting the icon ─────────────────────────────────────────
const OrbitRing = ({ delay = 0, radius = 44, duration = 3000, color = '#6C63FF' }) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration, delay, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: radius * 2, height: radius * 2,
        borderRadius: radius,
        borderWidth: 1.5, borderColor: color,
        borderStyle: 'dashed',
        opacity: 0.35,
        transform: [{ rotate }],
      }}
    />
  );
};

// ─── Floating particle ────────────────────────────────────────────────────────
const Particle = ({ x, delay }) => {
  const floatAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(floatAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 1, duration: 600,  useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
          ]),
        ]),
        Animated.timing(floatAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });

  return (
    <Animated.View
      style={{
        position: 'absolute', bottom: 20, left: x,
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: '#8B5CF6',
        opacity: opacityAnim,
        transform: [{ translateY }],
      }}
    />
  );
};

// ─── Perk row ─────────────────────────────────────────────────────────────────
const PerkRow = ({ icon, label, delay, enterAnim }) => {
  const itemSlide = enterAnim.interpolate({
    inputRange: [0, 1], outputRange: [20, 0], extrapolate: 'clamp',
  });
  const itemOpacity = enterAnim.interpolate({
    inputRange: [delay, delay + 0.3], outputRange: [0, 1], extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.perkRow, { opacity: itemOpacity, transform: [{ translateX: itemSlide }] }]}>
      <View style={styles.perkIconWrap}>
        <Ionicons name={icon} size={14} color="#A78BFA" />
      </View>
      <Text style={styles.perkText}>{label}</Text>
    </Animated.View>
  );
};

// ─── Plan-aware upgrade target ────────────────────────────────────────────────
// Maps current plan → what they should upgrade to, with real prices from planController
const getUpgradeTarget = (planName) => {
  switch (planName?.toLowerCase()) {
    case 'free':    return { label: 'Starter',    price: '₹999/mo'      };
    case 'starter': return { label: 'Pro',        price: '₹2,999/mo'    };
    case 'pro':     return { label: 'Enterprise', price: 'Contact Sales' };
    default:        return { label: 'Starter',    price: '₹999/mo'      };
  }
};

// ─── Plan-aware perks ─────────────────────────────────────────────────────────
const getPlanPerks = (planName) => {
  switch (planName?.toLowerCase()) {
    case 'free':
      return [
        { icon: 'infinite-outline',         label: '100 invoice scans/month',        delay: 0.0  },
        { icon: 'document-text-outline',    label: 'Full GST report export',         delay: 0.15 },
        { icon: 'time-outline',             label: 'Invoice history (6 months)',      delay: 0.3  },
        { icon: 'mail-outline',             label: 'Email support',                  delay: 0.45 },
      ];
    case 'starter':
      return [
        { icon: 'trending-up-outline',      label: '500 invoice scans/month',        delay: 0.0  },
        { icon: 'analytics-outline',        label: 'Advanced analytics dashboard',   delay: 0.15 },
        { icon: 'infinite-outline',         label: 'Full invoice history',           delay: 0.3  },
        { icon: 'flash-outline',            label: 'Priority AI processing',         delay: 0.45 },
      ];
    case 'pro':
      return [
        { icon: 'infinite-outline',         label: 'Unlimited scans',                delay: 0.0  },
        { icon: 'people-outline',           label: 'Dedicated account manager',      delay: 0.15 },
        { icon: 'git-merge-outline',        label: 'Custom integrations',            delay: 0.3  },
        { icon: 'shield-checkmark-outline', label: 'SLA & enterprise support',       delay: 0.45 },
      ];
    default:
      return [
        { icon: 'infinite-outline',         label: '100 invoice scans/month',        delay: 0.0  },
        { icon: 'document-text-outline',    label: 'Full GST report export',         delay: 0.15 },
        { icon: 'time-outline',             label: 'Invoice history (6 months)',      delay: 0.3  },
        { icon: 'mail-outline',             label: 'Email support',                  delay: 0.45 },
      ];
  }
};

// ─── Main LimitModal ──────────────────────────────────────────────────────────
const LimitModal = ({ visible, onClose, onUpgrade, scansUsed, scansTotal, planName }) => {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide       = useRef(new Animated.Value(80)).current;
  const cardOpacity     = useRef(new Animated.Value(0)).current;
  const iconScale       = useRef(new Animated.Value(0.3)).current;
  const enterProgress   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.parallel([
          Animated.spring(cardSlide,   { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
          Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]),
        Animated.spring(iconScale,     { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(enterProgress, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(cardOpacity,     { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(cardSlide,       { toValue: 60, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        iconScale.setValue(0.3);
        enterProgress.setValue(0);
      });
    }
  }, [visible]);

  const displayPlan   = planName || 'Free';
  const progressWidth = scansTotal ? (scansUsed / scansTotal) * 100 : 100;
  const upgrade       = getUpgradeTarget(displayPlan);
  const perks         = getPlanPerks(displayPlan);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>

      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Card */}
      <Animated.View
        style={[styles.cardWrap, { opacity: cardOpacity, transform: [{ translateY: cardSlide }] }]}
        pointerEvents="box-none"
      >
        <BlurView intensity={80} tint="dark" style={styles.cardBlur}>
          <LinearGradient
            colors={['rgba(108,99,255,0.12)', 'rgba(139,92,246,0.06)', 'rgba(15,13,30,0.95)']}
            style={styles.cardGrad}
          >
            {/* Particles */}
            {[18, 50, 82, 120, 155, 190].map((x, i) => (
              <Particle key={i} x={x} delay={i * 400} />
            ))}

            {/* Top border */}
            <LinearGradient
              colors={['transparent', '#6C63FF', '#8B5CF6', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.topBorder}
            />

            {/* Icon cluster */}
            <View style={styles.iconCluster}>
              <OrbitRing radius={52} duration={4000} color="#6C63FF" />
              <OrbitRing radius={38} duration={2800} delay={500} color="#8B5CF6" />
              <Animated.View style={[styles.iconCircle, { transform: [{ scale: iconScale }] }]}>
                <LinearGradient colors={['#6C63FF', '#8B5CF6']} style={styles.iconGrad}>
                  <Ionicons name="lock-closed" size={28} color="#fff" />
                </LinearGradient>
              </Animated.View>
            </View>

            {/* Badge — real plan name */}
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>{displayPlan.toUpperCase()} PLAN</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>Scan Limit Reached</Text>

            {/* Subtitle — no hardcoded "free" */}
            <Text style={styles.subtitle}>
              You've used all {scansTotal} scans on your {displayPlan} plan this month.{'\n'}
              Upgrade to keep scanning without limits.
            </Text>

            {/* Usage bar */}
            <View style={styles.usageWrap}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageLabel}>Monthly Scans</Text>
                <Text style={styles.usageCount}>
                  <Text style={styles.usageCountUsed}>{scansUsed}</Text>
                  <Text style={styles.usageCountSep}> / </Text>
                  {scansTotal}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={['#6C63FF', '#EC4899']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${progressWidth}%` }]}
                />
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Perks — dynamic per plan */}
            <Text style={styles.perksTitle}>✦  What you unlock with {upgrade.label}</Text>
            <View style={styles.perksList}>
              {perks.map((p) => (
                <PerkRow key={p.icon} {...p} enterAnim={enterProgress} />
              ))}
            </View>

            {/* CTA — dynamic label & real price */}
            <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade} activeOpacity={0.88}>
              <LinearGradient
                colors={['#6C63FF', '#8B5CF6', '#A855F7']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.upgradeBtnGrad}
              >
                <Ionicons name="rocket-outline" size={18} color="#fff" />
                <Text style={styles.upgradeBtnText}>Upgrade to {upgrade.label}</Text>
                <View style={styles.upgradePriceBadge}>
                  <Text style={styles.upgradePriceText}>{upgrade.price}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Dismiss */}
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.dismissBtn}>
              <Text style={styles.dismissText}>Maybe later</Text>
            </TouchableOpacity>

          </LinearGradient>
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },

  cardWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  cardBlur: {
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  cardGrad: {
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },

  topBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
  },

  iconCluster: {
    width: 104, height: 104,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  iconCircle: { width: 64, height: 64, borderRadius: 22, overflow: 'hidden' },
  iconGrad:   { flex: 1, alignItems: 'center', justifyContent: 'center' },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(108,99,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.3)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    marginBottom: 14,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6C63FF' },
  badgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: '#A78BFA' },

  title: {
    fontSize: 26, fontWeight: '800', color: '#fff',
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 10,
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },

  usageWrap:   { width: '100%', marginBottom: 24 },
  usageHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  usageLabel:     { fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: '600' },
  usageCount:     { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.45)' },
  usageCountUsed: { color: '#EC4899' },
  usageCountSep:  { color: 'rgba(255,255,255,0.3)' },
  progressTrack: {
    height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  divider: {
    width: '100%', height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 20,
  },

  perksTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
    alignSelf: 'flex-start', marginBottom: 12,
  },
  perksList: { width: '100%', gap: 10, marginBottom: 24 },
  perkRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  perkIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(108,99,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(108,99,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  perkText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

  upgradeBtn:     { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  upgradeBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, paddingHorizontal: 20,
  },
  upgradeBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  upgradePriceBadge: {
    marginLeft: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  upgradePriceText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  dismissBtn:  { paddingVertical: 8 },
  dismissText: { color: 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: '600' },
});

export default LimitModal;
/**
 * screens/HomeScreen.js — Premium Landing Screen (Redesigned)
 * Changes:
 *  - Removed "Pricing" from Quick Actions (now only 3 focused actions)
 *  - Added a premium "Upgrade to Pro" banner section with its own visual identity
 *  - Refreshed design: tighter card hierarchy, better spacing, floating stat pills
 */

import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import useAuthStore from '../store/authStore';
import useInvoiceStore from '../store/invoiceStore';
import { COLORS, SPACING, RADIUS, SHADOW } from '../utils/theme';

// ─── Greeting helper ───────────────────────────────────────────────────────────
const getGreeting = () => {
  const hour = dayjs().hour();
  if (hour < 12) return { text: 'Good Morning', icon: '☀️' };
  if (hour < 17) return { text: 'Good Afternoon', icon: '🌤️' };
  return { text: 'Good Evening', icon: '🌙' };
};

// ─── Action Card ───────────────────────────────────────────────────────────────
const ActionCard = ({ icon, title, subtitle, gradientColors, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionCard}
        >
          <View style={styles.actionDeco} />
          <View style={styles.actionIconWrap}>
            <Ionicons name={icon} size={20} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
          <View style={styles.actionArrow}>
            <Ionicons name="arrow-forward" size={11} color="rgba(255,255,255,0.9)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Tip Card ─────────────────────────────────────────────────────────────────
const TipCard = ({ tip, index }) => {
  const icons = ['bulb', 'checkmark-circle', 'information-circle'];
  const colors = ['#F59E0B', '#059669', '#6C63FF'];
  return (
    <View style={styles.tipCard}>
      <View style={[styles.tipIconWrap, { backgroundColor: colors[index % 3] + '18' }]}>
        <Ionicons name={icons[index % 3]} size={15} color={colors[index % 3]} />
      </View>
      <Text style={styles.tipText}>{tip}</Text>
    </View>
  );
};

// ─── Pricing / Upgrade Banner ──────────────────────────────────────────────────
const UpgradeBanner = ({ onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const perks = ['Unlimited scans', 'Bulk Excel exports', 'Priority support'];

  return (
    <Animated.View style={[styles.upgradeShadow, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <LinearGradient
          colors={['#18122B', '#2D1B69', '#3D2A8A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.upgradeBanner}
        >
          {/* Decorative orbs */}
          <View style={styles.upgradeOrb1} />
          <View style={styles.upgradeOrb2} />
          <View style={styles.upgradeOrb3} />

          {/* Left content */}
          <View style={styles.upgradeLeft}>
            {/* Badge */}
            <View style={styles.upgradeBadge}>
              <Ionicons name="flash" size={10} color="#FDE68A" />
              <Text style={styles.upgradeBadgeText}>PRO PLAN</Text>
            </View>

            <Text style={styles.upgradeHeadline}>Unlock the full{'\n'}GST toolkit</Text>

            {/* Perk pills */}
            <View style={styles.upgradePerks}>
              {perks.map((p) => (
                <View key={p} style={styles.upgradePerkRow}>
                  <View style={styles.upgradePerkDot} />
                  <Text style={styles.upgradePerkText}>{p}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <View style={styles.upgradeCta}>
              <Text style={styles.upgradeCtaText}>View Plans</Text>
              <Ionicons name="arrow-forward" size={13} color="#FDE68A" />
            </View>
          </View>

          {/* Right: price pill */}
          <View style={styles.upgradeRight}>
            <View style={styles.upgradePricePill}>
              <Text style={styles.upgradePriceFrom}>from</Text>
              <Text style={styles.upgradePriceAmt}>₹2,999</Text>
              <Text style={styles.upgradePricePer}>/mo</Text>
            </View>
            <View style={styles.upgradeStarRow}>
              {[...Array(5)].map((_, i) => (
                <Ionicons key={i} name="star" size={9} color="#FDE68A" style={{ marginHorizontal: 1 }} />
              ))}
            </View>
            <Text style={styles.upgradeRatingText}>4.9 · 2k+ users</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main HomeScreen ───────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { summary, fetchSummary } = useInvoiceStore();
  const greeting = getGreeting();
  const currentMonth = dayjs().format('YYYY-MM');

  // Entry animations
  const headerAnim  = useRef(new Animated.Value(0)).current;
  const heroAnim    = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const upgradeAnim = useRef(new Animated.Value(0)).current;
  const featureAnim = useRef(new Animated.Value(0)).current;
  const bottomAnim  = useRef(new Animated.Value(0)).current;

  const runEntryAnimations = useCallback(() => {
    [headerAnim, heroAnim, actionsAnim, upgradeAnim, featureAnim, bottomAnim].forEach((a) =>
      a.setValue(0)
    );
    Animated.stagger(100, [
      Animated.spring(headerAnim,  { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.spring(heroAnim,    { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(actionsAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(upgradeAnim, { toValue: 1, tension: 55, friction: 10, useNativeDriver: true }),
      Animated.spring(featureAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(bottomAnim,  { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSummary(currentMonth);
      runEntryAnimations();
    }, [])
  );

  // ── Derived hero stats ──────────────────────────────────────────────────────
  const totalInvoices = summary?.totalInvoices || 0;
  const gstPayable    = summary?.gstPayable    || 0;
  const isRefund      = gstPayable < 0;

  const breakdownMap =
    summary?.breakdown?.reduce((acc, item) => {
      acc[item._id] = item;
      return acc;
    }, {}) || {};

  const outputCount = breakdownMap['output']?.count || 0;
  const salesPct    = totalInvoices > 0 ? Math.round((outputCount / totalInvoices) * 100) : 0;

  const formatAmount = (val) => {
    const abs = Math.abs(val);
    if (abs >= 100000) return `₹${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000)   return `₹${(abs / 1000).toFixed(1)}K`;
    return `₹${abs.toFixed(0)}`;
  };

  const slideUp = (anim) => ({
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
    ],
  });

  const tips = [
    'Ensure good lighting for best OCR results',
    'Always verify extracted data before saving',
    'CGST + SGST = intra-state · IGST = inter-state',
  ];

  // ── Quick Actions — Pricing removed, now 3 focused cards ──────────────────
  const quickActions = [
    {
      icon: 'camera',
      title: 'Scan',
      subtitle: 'OCR extract',
      gradientColors: ['#6C63FF', '#8B5CF6'],
      onPress: () => navigation.navigate('Scan'),
    },
    {
      icon: 'bar-chart',
      title: 'GST Report',
      subtitle: 'Monthly view',
      gradientColors: ['#059669', '#10B981'],
      onPress: () => navigation.navigate('Dashboard'),
    },
    {
      icon: 'time',
      title: 'History',
      subtitle: 'Past invoices',
      gradientColors: ['#F59E0B', '#FBBF24'],
      onPress: () => navigation.navigate('History'),
    },
  ];

  // ── Feature items ──────────────────────────────────────────────────────────
  const featureItems = [
    {
      icon: 'camera-outline',
      title: 'Smart OCR Scanning',
      sub: 'Auto-extract vendor, amount, GSTIN & tax fields',
      color: '#6C63FF',
      onPress: () => navigation.navigate('Scan'),
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'GST Reconciliation',
      sub: 'Auto-compute payable, ITC credit & carry-forward',
      color: '#059669',
      onPress: () => navigation.navigate('Dashboard'),
    },
    {
      icon: 'cloud-download-outline',
      title: 'Excel Report Export',
      sub: 'Download GSTR-ready .xlsx for any month',
      color: '#0EA5E9',
      onPress: () => navigation.navigate('Dashboard'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F7FF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, slideUp(headerAnim)]}>
          <View>
            <Text style={styles.headerEyebrow}>
              {greeting.icon} {greeting.text}
            </Text>
            <Text style={styles.headerTitle}>
              {user?.name ? user.name.split(' ')[0] : 'Welcome'}
            </Text>
            {user?.businessName && (
              <View style={styles.businessPill}>
                <Ionicons name="business" size={10} color="#6C63FF" />
                <Text style={styles.businessText}>{user.businessName}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.75}>
            <View style={styles.logoutInner}>
              <Ionicons name="log-out-outline" size={18} color="#6C63FF" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Hero CTA ────────────────────────────────────────────────────── */}
        <Animated.View style={slideUp(heroAnim)}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Scan')}
            style={styles.heroWrapper}
          >
            <LinearGradient
              colors={
                isRefund
                  ? ['#059669', '#10B981']
                  : ['#6C63FF', '#8B5CF6', '#A78BFA']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroDeco1} />
              <View style={styles.heroDeco2} />
              <View style={styles.heroDeco3} />

              <View style={styles.heroContent}>
                <View style={styles.heroIconWrap}>
                  <Ionicons name="scan" size={30} color="#fff" />
                </View>
                <View style={styles.heroTextWrap}>
                  <View style={styles.heroChip}>
                    <View style={styles.heroChipDot} />
                    <Text style={styles.heroChipText}>AI-Powered OCR</Text>
                  </View>
                  <Text style={styles.heroTitle}>Scan New Invoice</Text>
                  <Text style={styles.heroSub}>Extract GST data instantly</Text>
                </View>
                <View style={styles.heroArrowCircle}>
                  <Ionicons name="chevron-forward" size={18} color="#6C63FF" />
                </View>
              </View>

              {/* Live stats */}
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatNum}>{formatAmount(gstPayable)}</Text>
                  <Text style={styles.heroStatLbl}>
                    {isRefund ? 'Refund Due' : 'GST Due'}
                  </Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatNum}>{totalInvoices}</Text>
                  <Text style={styles.heroStatLbl}>Invoices</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatNum}>{salesPct}%</Text>
                  <Text style={styles.heroStatLbl}>Sales</Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Quick Actions (3 cards — no Pricing) ────────────────────────── */}
        <Animated.View style={slideUp(actionsAnim)}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            {quickActions.map((action) => (
              <ActionCard key={action.title} {...action} />
            ))}
          </View>
        </Animated.View>

        {/* ── ✨ Upgrade Banner (Pricing) ──────────────────────────────────── */}
        <Animated.View style={slideUp(upgradeAnim)}>
          <View style={styles.upgradeLabelRow}>
            <Ionicons name="flash" size={14} color="#F59E0B" />
            <Text style={styles.sectionTitleInline}>  Upgrade & Save</Text>
          </View>
          <UpgradeBanner onPress={() => navigation.navigate('Pricing')} />
        </Animated.View>

        {/* ── Feature Highlights ───────────────────────────────────────────── */}
        <Animated.View style={slideUp(featureAnim)}>
          <Text style={styles.sectionTitle}>What you can do</Text>
          <View style={styles.featuresCard}>
            {featureItems.map((f, i) => (
              <View key={f.title}>
                <TouchableOpacity
                  style={styles.featureRow}
                  onPress={f.onPress}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.featureIconWrap,
                      { backgroundColor: f.color + '15' },
                    ]}
                  >
                    <Ionicons name={f.icon} size={20} color={f.color} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureSub}>{f.sub}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#D1D5DB" />
                </TouchableOpacity>
                {i < featureItems.length - 1 && (
                  <View style={styles.featureDivider} />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── Tips ─────────────────────────────────────────────────────────── */}
        <Animated.View style={slideUp(bottomAnim)}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={15} color="#F59E0B" />
            <Text style={styles.sectionTitleInline}>  Pro Tips</Text>
          </View>
          <View style={styles.tipsWrap}>
            {tips.map((tip, i) => (
              <TipCard key={i} tip={tip} index={i} />
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  scroll: { paddingHorizontal: 16, paddingBottom: 16, gap: 14 },

  // ── Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerEyebrow: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 2 },
  headerTitle:   { fontSize: 30, fontWeight: '800', color: '#1A1535', letterSpacing: -0.8 },
  businessPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EDE9FE', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginTop: 6,
  },
  businessText: { fontSize: 11, fontWeight: '700', color: '#6C63FF', letterSpacing: 0.2 },
  logoutBtn:    { marginTop: 4 },
  logoutInner:  {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Hero
  heroWrapper: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 20,
    elevation: 10, borderRadius: 24,
  },
  heroCard:  { borderRadius: 24, padding: 20, overflow: 'hidden' },
  heroDeco1: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  heroDeco2: {
    position: 'absolute', bottom: -25, left: -25,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroDeco3: {
    position: 'absolute', top: 30, right: 80,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  heroContent:    { flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 },
  heroIconWrap:   {
    width: 58, height: 58, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTextWrap:   { flex: 1 },
  heroChip:       {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: 5,
  },
  heroChipDot:    { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FDE68A' },
  heroChipText:   { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  heroTitle:      { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  heroSub:        { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  heroArrowCircle:{
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  heroStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14, padding: 12,
  },
  heroStatItem:    { flex: 1, alignItems: 'center' },
  heroStatNum:     { fontSize: 18, fontWeight: '800', color: '#fff' },
  heroStatLbl:     { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontWeight: '500' },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

  // ── Section titles
  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: '#1A1535',
    letterSpacing: -0.3, marginTop: 4, marginBottom: 2,
  },
  upgradeLabelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 2 },
  tipsHeader:      { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 2 },
  sectionTitleInline: { fontSize: 16, fontWeight: '800', color: '#1A1535', letterSpacing: -0.3 },

  // ── Quick Actions
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionCard: {
    borderRadius: 20, padding: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    minHeight: 118, justifyContent: 'space-between',
  },
  actionDeco: {
    position: 'absolute', top: -20, right: -20,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  actionIconWrap: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle:    { fontSize: 13, fontWeight: '800', color: '#fff', marginTop: 8, letterSpacing: -0.2 },
  actionSubtitle: { fontSize: 10, color: 'rgba(255,255,255,0.72)', fontWeight: '500' },
  actionArrow: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end', marginTop: 4,
  },

  // ── Upgrade / Pricing Banner
  upgradeShadow: {
    shadowColor: '#2D1B69',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 22,
    elevation: 12, borderRadius: 24,
  },
  upgradeBanner: {
    borderRadius: 24, padding: 22,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden',
  },
  upgradeOrb1: {
    position: 'absolute', top: -30, right: 60,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(108,99,255,0.35)',
  },
  upgradeOrb2: {
    position: 'absolute', bottom: -40, right: -20,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(167,139,250,0.2)',
  },
  upgradeOrb3: {
    position: 'absolute', top: 10, left: 120,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(253,230,138,0.08)',
  },
  upgradeLeft: { flex: 1, paddingRight: 16 },
  upgradeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(253,230,138,0.15)',
    borderWidth: 1, borderColor: 'rgba(253,230,138,0.3)',
    borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  upgradeBadgeText: {
    fontSize: 9, fontWeight: '800', color: '#FDE68A',
    letterSpacing: 1.2,
  },
  upgradeHeadline: {
    fontSize: 20, fontWeight: '900', color: '#fff',
    letterSpacing: -0.5, lineHeight: 26, marginBottom: 12,
  },
  upgradePerks:    { gap: 6, marginBottom: 16 },
  upgradePerkRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  upgradePerkDot:  {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: '#A78BFA',
  },
  upgradePerkText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  upgradeCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(253,230,138,0.15)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(253,230,138,0.35)',
  },
  upgradeCtaText: { fontSize: 13, fontWeight: '800', color: '#FDE68A', letterSpacing: 0.2 },

  upgradeRight: { alignItems: 'center', gap: 8 },
  upgradePricePill: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  upgradePriceFrom: { fontSize: 9, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 0.5 },
  upgradePriceAmt:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  upgradePricePer:  { fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  upgradeStarRow:   { flexDirection: 'row', alignItems: 'center' },
  upgradeRatingText:{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },

  // ── Features card
  featuresCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 4,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  featureRow:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  featureIconWrap:{ width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  featureText:    { flex: 1 },
  featureTitle:   { fontSize: 14, fontWeight: '700', color: '#1A1535', letterSpacing: -0.2 },
  featureSub:     { fontSize: 11, color: '#6B7280', marginTop: 2, lineHeight: 15 },
  featureDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 14 },

  // ── Tips
  tipsWrap: { gap: 8 },
  tipCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 12, gap: 10,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  tipIconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tipText:     { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500', lineHeight: 18 },
});

export default HomeScreen;
/**
 * screens/DashboardScreen.js — Monthly GST Summary Dashboard
 * Premium startup-grade UI with glassmorphism, animated cards & micro-interactions
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import useInvoiceStore from '../store/invoiceStore';
import { COLORS, SPACING, RADIUS, SHADOW } from '../utils/theme';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import { Buffer } from 'buffer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Animated Number Component ─────────────────────────────────────────────────
const AnimatedAmount = ({ value, style }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState('0.00');

  useEffect(() => {
    const target = parseFloat(value) || 0;
    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: target,
      duration: 900,
      useNativeDriver: false,
    }).start();
    const listener = animValue.addListener(({ value: v }) => {
      setDisplay(v.toFixed(2));
    });
    return () => animValue.removeListener(listener);
  }, [value]);

  return <Text style={style}>₹{display}</Text>;
};

// ─── Pulse Badge ───────────────────────────────────────────────────────────────
const PulseBadge = ({ children }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      {children}
    </Animated.View>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const DashboardScreen = () => {
  const { summary, fetchSummary, isLoading } = useInvoiceStore();
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [downloading, setDownloading] = useState(false);

  // Entry animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const cardsAnim = useRef(new Animated.Value(0)).current;
  const bottomAnim = useRef(new Animated.Value(0)).current;

  const runEntryAnimations = useCallback(() => {
    headerAnim.setValue(0);
    heroAnim.setValue(0);
    cardsAnim.setValue(0);
    bottomAnim.setValue(0);
    Animated.stagger(120, [
      Animated.spring(headerAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      Animated.spring(heroAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(cardsAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.spring(bottomAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSummary(selectedMonth);
      runEntryAnimations();
    }, [selectedMonth])
  );

  const downloadReport = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/reports/gst-report?month=${selectedMonth}`,
        { responseType: 'arraybuffer' }
      );
      const fileUri = FileSystem.documentDirectory + `GST_Report_${selectedMonth}.xlsx`;
      await FileSystem.writeAsStringAsync(
        fileUri,
        Buffer.from(response.data, 'binary').toString('base64'),
        { encoding: 'base64' }
      );
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: `GST Report — ${dayjs(selectedMonth).format('MMMM YYYY')}`,
      });
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const changeMonth = (direction) => {
    const newMonth = dayjs(selectedMonth).add(direction, 'month').format('YYYY-MM');
    setSelectedMonth(newMonth);
  };

  const isCurrentMonth = selectedMonth >= dayjs().format('YYYY-MM');

  const breakdownMap = summary?.breakdown?.reduce((acc, item) => {
    acc[item._id] = item;
    return acc;
  }, {}) || {};

  const gstPayable = summary?.gstPayable || 0;
  const isRefund = gstPayable < 0;

  // ── Animated slide-up helpers ────────────────────────────────────────────────
  const slideUp = (anim) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, slideUp(headerAnim)]}>
        <View>
          <Text style={styles.headerEyebrow}>GST Dashboard</Text>
          <Text style={styles.headerTitle}>Tax Overview</Text>
        </View>
        <TouchableOpacity style={styles.avatarBtn}>
          <LinearGradient colors={['#6C63FF', '#A78BFA']} style={styles.avatar}>
            <Ionicons name="person" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Month Selector ──────────────────────────────────────────────────── */}
      <Animated.View style={[styles.monthWrapper, slideUp(headerAnim)]}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Ionicons name="calendar" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.monthText}>{dayjs(selectedMonth).format('MMMM YYYY')}</Text>
        </View>
        <TouchableOpacity
          onPress={() => changeMonth(1)}
          style={[styles.monthArrow, isCurrentMonth && styles.monthArrowDisabled]}
          disabled={isCurrentMonth}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-forward" size={18} color={isCurrentMonth ? COLORS.border : COLORS.primary} />
        </TouchableOpacity>
      </Animated.View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Calculating GST…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Hero Payable Card ─────────────────────────────────────────── */}
          <Animated.View style={slideUp(heroAnim)}>
            <LinearGradient
              colors={isRefund ? ['#059669', '#10B981'] : ['#6C63FF', '#8B5CF6', '#A78BFA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Decorative circles */}
              <View style={styles.heroDeco1} />
              <View style={styles.heroDeco2} />

              <View style={styles.heroTop}>
                <View style={styles.heroStatusChip}>
                  <View style={[styles.heroStatusDot, { backgroundColor: isRefund ? '#6EE7B7' : '#FDE68A' }]} />
                  <Text style={styles.heroStatusText}>{isRefund ? 'Refund Due' : 'Tax Payable'}</Text>
                </View>
                <Text style={styles.heroMonth}>{dayjs(selectedMonth).format('MMM YYYY')}</Text>
              </View>

              <Text style={styles.heroLabel}>Net GST {isRefund ? 'Refund' : 'Payable'}</Text>
              <AnimatedAmount value={Math.abs(gstPayable)} style={styles.heroAmount} />
              <Text style={styles.heroFormula}>Output GST − Input GST (ITC)</Text>

              {summary?.itcCarryForward > 0 && (
                <PulseBadge>
                  <View style={styles.carryChip}>
                    <Ionicons name="arrow-forward-circle" size={13} color="#fff" />
                    <Text style={styles.carryText}>
                      ₹{summary.itcCarryForward.toFixed(2)} ITC carry forward
                    </Text>
                  </View>
                </PulseBadge>
              )}

              {/* Mini stats row */}
              <View style={styles.heroStats}>
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>{summary?.totalInvoices || 0}</Text>
                  <Text style={styles.heroStatLabel}>Invoices</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>{breakdownMap['input']?.count || 0}</Text>
                  <Text style={styles.heroStatLabel}>Purchases</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>{breakdownMap['output']?.count || 0}</Text>
                  <Text style={styles.heroStatLabel}>Sales</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* ── ITC & Output Cards ───────────────────────────────────────── */}
          <Animated.View style={[styles.row, slideUp(cardsAnim)]}>
            <GSTCard
              label="Input GST (ITC)"
              amount={summary?.inputGST}
              icon="arrow-down-circle"
              gradientColors={['#ECFDF5', '#D1FAE5']}
              iconColor="#059669"
              amountColor="#065F46"
              badge="Credit"
              badgeColor="#059669"
            />
            <GSTCard
              label="Output GST"
              amount={summary?.outputGST}
              icon="arrow-up-circle"
              gradientColors={['#FFF1F2', '#FFE4E6']}
              iconColor="#E11D48"
              amountColor="#9F1239"
              badge="Liability"
              badgeColor="#E11D48"
            />
          </Animated.View>

          {/* ── Formula Card ─────────────────────────────────────────────── */}
          <Animated.View style={slideUp(cardsAnim)}>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="calculator" size={16} color={COLORS.primary} />
                <Text style={styles.cardTitle}>GST Calculation</Text>
              </View>
              <View style={styles.formulaRow}>
                <FormulaBox label="Output GST" value={summary?.outputGST} color="#9F1239" bg="#FFF1F2" />
                <Text style={styles.formulaOp}>−</Text>
                <FormulaBox label="ITC Credit" value={summary?.inputGST} color="#065F46" bg="#ECFDF5" />
                <Text style={styles.formulaOp}>=</Text>
                <FormulaBox
                  label="Payable"
                  value={Math.abs(gstPayable)}
                  color={isRefund ? '#059669' : '#7C3AED'}
                  bg={isRefund ? '#ECFDF5' : '#EDE9FE'}
                  bold
                />
              </View>
              <View style={styles.taxTypeRow}>
                <TaxChip label="CGST" sublabel="Central" color="#6C63FF" />
                <TaxChip label="SGST" sublabel="State" color="#EC4899" />
                <TaxChip label="IGST" sublabel="Inter-state" color="#0EA5E9" />
              </View>
            </View>
          </Animated.View>

          {/* ── Invoice Breakdown ─────────────────────────────────────────── */}
          <Animated.View style={slideUp(bottomAnim)}>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="receipt" size={16} color={COLORS.primary} />
                <Text style={styles.cardTitle}>Invoice Breakdown</Text>
              </View>
              <View style={styles.breakdownGrid}>
                <BreakdownTile
                  icon="bag-handle"
                  iconColor="#6C63FF"
                  label="Purchase Invoices"
                  count={breakdownMap['input']?.count || 0}
                  amount={breakdownMap['input']?.totalAmount}
                  bg="#EDE9FE"
                />
                <BreakdownTile
                  icon="storefront"
                  iconColor="#E11D48"
                  label="Sale Invoices"
                  count={breakdownMap['output']?.count || 0}
                  amount={breakdownMap['output']?.totalAmount}
                  bg="#FFF1F2"
                />
              </View>
            </View>
          </Animated.View>

          {/* ── Download Button ───────────────────────────────────────────── */}
          <Animated.View style={slideUp(bottomAnim)}>
            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={downloadReport}
              activeOpacity={0.85}
              disabled={downloading}
            >
              <LinearGradient
                colors={['#6C63FF', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.downloadGradient}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="download" size={18} color="#fff" />
                )}
                <Text style={styles.downloadText}>
                  {downloading ? 'Preparing Report…' : 'Download GST Report (.xlsx)'}
                </Text>
                {!downloading && (
                  <View style={styles.downloadChip}>
                    <Text style={styles.downloadChipText}>XLSX</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const GSTCard = ({ label, amount, icon, gradientColors, iconColor, amountColor, badge, badgeColor }) => (
  <LinearGradient colors={gradientColors} style={styles.gstCard}>
    <View style={styles.gstCardHeader}>
      <Ionicons name={icon} size={22} color={iconColor} />
      <View style={[styles.gstBadge, { backgroundColor: badgeColor + '20' }]}>
        <Text style={[styles.gstBadgeText, { color: badgeColor }]}>{badge}</Text>
      </View>
    </View>
    <Text style={[styles.gstAmount, { color: amountColor }]}>
      ₹{amount?.toFixed(2) || '0.00'}
    </Text>
    <Text style={styles.gstLabel}>{label}</Text>
  </LinearGradient>
);

const FormulaBox = ({ label, value, color, bg, bold }) => (
  <View style={[styles.formulaBox, { backgroundColor: bg }]}>
    <Text style={styles.formulaLabel}>{label}</Text>
    <Text style={[styles.formulaValue, { color }, bold && { fontSize: 15, fontWeight: '900' }]}>
      ₹{(value || 0).toFixed(2)}
    </Text>
  </View>
);

const TaxChip = ({ label, sublabel, color }) => (
  <View style={[styles.taxChip, { borderColor: color + '40', backgroundColor: color + '10' }]}>
    <Text style={[styles.taxChipLabel, { color }]}>{label}</Text>
    <Text style={styles.taxChipSub}>{sublabel}</Text>
  </View>
);

const BreakdownTile = ({ icon, iconColor, label, count, amount, bg }) => (
  <View style={[styles.breakdownTile, { backgroundColor: bg }]}>
    <View style={[styles.breakdownIcon, { backgroundColor: iconColor + '20' }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text style={styles.breakdownCount}>{count}</Text>
    <Text style={styles.breakdownLabel}>{label}</Text>
    <Text style={styles.breakdownAmount}>₹{(amount || 0).toFixed(2)}</Text>
  </View>
);

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C63FF',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1A1535',
    letterSpacing: -0.5,
  },
  avatarBtn: { padding: 2 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Month Selector
  monthWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowDisabled: { backgroundColor: '#F3F4F6' },
  monthCenter: { flexDirection: 'row', alignItems: 'center' },
  monthText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1535',
    letterSpacing: -0.2,
  },

  // Loading
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  loadingText: { color: '#6B7280', fontSize: 14, fontWeight: '500' },

  // Hero Card
  heroCard: {
    borderRadius: 24,
    padding: 22,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10,
  },
  heroDeco1: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroDeco2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  heroStatusDot: { width: 6, height: 6, borderRadius: 3 },
  heroStatusText: { fontSize: 11, color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  heroMonth: { fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: 4 },
  heroAmount: { fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1, marginBottom: 2 },
  heroFormula: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 },
  carryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 16,
  },
  carryText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    padding: 12,
  },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2, fontWeight: '500' },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 4 },

  // Row
  row: { flexDirection: 'row', gap: 12 },

  // GST Cards
  gstCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  gstCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gstBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  gstBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  gstAmount: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5, marginBottom: 3 },
  gstLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#1A1535', letterSpacing: -0.3 },

  // Formula
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
    marginBottom: 14,
  },
  formulaBox: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  formulaLabel: { fontSize: 9, color: '#6B7280', fontWeight: '600', marginBottom: 3, textAlign: 'center' },
  formulaValue: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  formulaOp: { fontSize: 20, fontWeight: '900', color: '#9CA3AF' },
  taxTypeRow: { flexDirection: 'row', gap: 8 },
  taxChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
  },
  taxChipLabel: { fontSize: 12, fontWeight: '800' },
  taxChipSub: { fontSize: 9, color: '#9CA3AF', marginTop: 1, fontWeight: '500' },

  // Breakdown
  breakdownGrid: { flexDirection: 'row', gap: 12 },
  breakdownTile: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 5,
  },
  breakdownIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  breakdownCount: { fontSize: 28, fontWeight: '900', color: '#1A1535', letterSpacing: -1 },
  breakdownLabel: { fontSize: 10, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
  breakdownAmount: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },

  // Download
  downloadBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  downloadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  downloadText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  downloadChip: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  downloadChipText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});

export default DashboardScreen;
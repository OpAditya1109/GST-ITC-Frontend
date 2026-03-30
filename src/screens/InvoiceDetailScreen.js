/**
 * screens/InvoiceDetailScreen.js — Premium invoice detail view
 */

import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Share, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import useInvoiceStore from '../store/invoiceStore';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (val) => (parseFloat(val) || 0).toFixed(2);
const isInput = (inv) => inv?.invoiceType === 'input';

// ─── Row Component ─────────────────────────────────────────────────────────────
const DetailRow = ({ label, value, valueColor, mono, last }) => (
  <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, mono && styles.rowMono, valueColor && { color: valueColor }]}>
      {value || '—'}
    </Text>
  </View>
);

// ─── Section Card ──────────────────────────────────────────────────────────────
const SectionCard = ({ title, icon, iconColor, children, style }) => (
  <View style={[styles.sectionCard, style]}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={15} color={iconColor} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

// ─── GST Bar ───────────────────────────────────────────────────────────────────
const GSTBar = ({ label, amount, total, color, bg }) => {
  const pct = total > 0 ? Math.min((amount / total) * 100, 100) : 0;
  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(barAnim, { toValue: pct, duration: 900, useNativeDriver: false }).start();
  }, [pct]);
  const barWidth = barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.gstBarRow}>
      <View style={styles.gstBarTop}>
        <Text style={styles.gstBarLabel}>{label}</Text>
        <Text style={[styles.gstBarAmount, { color }]}>₹{fmt(amount)}</Text>
      </View>
      <View style={[styles.gstBarTrack, { backgroundColor: bg }]}>
        <Animated.View style={[styles.gstBarFill, { width: barWidth, backgroundColor: color }]} />
      </View>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const InvoiceDetailScreen = ({ route, navigation }) => {
  const { invoice } = route.params;
  const { deleteInvoice } = useInvoiceStore();

  const purchase = isInput(invoice);
  const dateStr = invoice.invoiceDate
    ? dayjs(invoice.invoiceDate).format('DD MMMM YYYY')
    : 'Date unknown';

  // Animations
  const heroAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(heroAnim, { toValue: 1, tension: 65, friction: 11, useNativeDriver: true }),
      Animated.spring(contentAnim, { toValue: 1, tension: 65, friction: 11, useNativeDriver: true }),
    ]).start();
  }, []);

  const totalGST = (parseFloat(invoice.cgst) || 0)
    + (parseFloat(invoice.sgst) || 0)
    + (parseFloat(invoice.igst) || 0);

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          `Invoice from ${invoice.vendorName || 'Vendor'}\n` +
          `Date: ${dateStr}\n` +
          `Invoice No: ${invoice.invoiceNumber || '—'}\n` +
          `Total Amount: ₹${fmt(invoice.totalAmount)}\n` +
          `Total GST: ₹${fmt(totalGST)}\n` +
          `GSTIN: ${invoice.gstin || '—'}`,
      });
    } catch (e) { /* ignore */ }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Invoice',
      `Remove this invoice from ${invoice.vendorName || 'this vendor'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            deleteInvoice(invoice._id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const slideUp = (anim, delay = 0) => ({
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
    }],
  });

  const gradColors = purchase
    ? ['#059669', '#10B981', '#34D399']
    : ['#6C63FF', '#8B5CF6', '#A78BFA'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero Gradient Header ─────────────────────────────────────── */}
      <Animated.View style={[{ opacity: heroAnim }]}>
        <LinearGradient colors={gradColors} style={styles.hero}>
          {/* Decorative blobs */}
          <View style={styles.blob1} />
          <View style={styles.blob2} />

          {/* Nav bar */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.navActions}>
              <TouchableOpacity onPress={handleShare} style={styles.navBtn}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={[styles.navBtn, styles.navBtnDanger]}>
                <Ionicons name="trash-outline" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Type badge */}
          <View style={styles.typeBadge}>
            <View style={styles.typeDot} />
            <Text style={styles.typeText}>{purchase ? 'Purchase Invoice' : 'Sale Invoice'}</Text>
          </View>

          {/* Vendor & amount */}
          <Text style={styles.heroVendor} numberOfLines={2}>
            {invoice.vendorName || 'Invoice'}
          </Text>
          <Text style={styles.heroDate}>{dateStr}</Text>

          {/* Amount hero */}
          <View style={styles.heroAmountRow}>
            <View>
              <Text style={styles.heroAmountLabel}>Total Amount</Text>
              <Text style={styles.heroAmount}>₹{fmt(invoice.totalAmount)}</Text>
            </View>
            {invoice.itcEligible && (
              <View style={styles.itcBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={styles.itcText}>ITC Eligible</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── Scrollable Content ───────────────────────────────────────── */}
      <Animated.View style={[{ flex: 1 }, slideUp(contentAnim)]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Invoice Info ─────────────────────────────────────────── */}
          <SectionCard title="Invoice Info" icon="document-text" iconColor="#6C63FF">
            <DetailRow label="Invoice No." value={invoice.invoiceNumber} mono />
            <DetailRow label="GSTIN" value={invoice.gstin} mono />
            <DetailRow label="Invoice Date" value={dateStr} />
            <DetailRow label="Invoice Type" value={purchase ? 'Purchase' : 'Sale'} last
              valueColor={purchase ? '#059669' : '#6C63FF'} />
          </SectionCard>

          {/* ── GST Breakdown ────────────────────────────────────────── */}
          <SectionCard title="GST Breakdown" icon="pie-chart" iconColor="#8B5CF6">
            {/* Visual bars */}
            <View style={styles.gstBarsWrap}>
              <GSTBar label="CGST (9%)" amount={invoice.cgst} total={totalGST}
                color="#6C63FF" bg="#EDE9FE" />
              <GSTBar label="SGST (9%)" amount={invoice.sgst} total={totalGST}
                color="#EC4899" bg="#FDF2F8" />
              <GSTBar label="IGST (18%)" amount={invoice.igst} total={totalGST}
                color="#0EA5E9" bg="#E0F2FE" />
            </View>

            {/* Total GST */}
            <View style={styles.gstTotal}>
              <Text style={styles.gstTotalLabel}>Total GST</Text>
              <Text style={styles.gstTotalValue}>₹{fmt(totalGST)}</Text>
            </View>
          </SectionCard>

          {/* ── Amount Breakdown ─────────────────────────────────────── */}
          <SectionCard title="Amount Breakdown" icon="cash" iconColor="#059669">
            <DetailRow
              label="Base Amount"
              value={`₹${fmt(invoice.totalAmount - totalGST)}`}
            />
            <DetailRow label="GST" value={`₹${fmt(totalGST)}`} valueColor="#8B5CF6" />
            <View style={styles.totalHighlight}>
              <Text style={styles.totalHighlightLabel}>Grand Total</Text>
              <Text style={styles.totalHighlightValue}>₹{fmt(invoice.totalAmount)}</Text>
            </View>
          </SectionCard>

          {/* ── Status Flags ─────────────────────────────────────────── */}
          <View style={styles.flagsRow}>
            <View style={[styles.flagCard, invoice.itcEligible && styles.flagCardActive]}>
              <Ionicons
                name={invoice.itcEligible ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={invoice.itcEligible ? '#059669' : '#9CA3AF'}
              />
              <Text style={[styles.flagLabel, invoice.itcEligible && { color: '#059669' }]}>
                ITC Eligible
              </Text>
            </View>
            <View style={[styles.flagCard, invoice.isEdited && styles.flagCardWarning]}>
              <Ionicons
                name={invoice.isEdited ? 'create' : 'create-outline'}
                size={22}
                color={invoice.isEdited ? '#F59E0B' : '#9CA3AF'}
              />
              <Text style={[styles.flagLabel, invoice.isEdited && { color: '#F59E0B' }]}>
                Edited
              </Text>
            </View>
            <View style={styles.flagCard}>
              <Ionicons name="shield-checkmark" size={22} color="#6C63FF" />
              <Text style={[styles.flagLabel, { color: '#6C63FF' }]}>Verified</Text>
            </View>
          </View>

          {/* ── Action Buttons ───────────────────────────────────────── */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare} activeOpacity={0.85}>
              <LinearGradient colors={['#6C63FF', '#8B5CF6']} style={styles.actionBtnGrad}>
                <Ionicons name="share-social" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Share</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnOutline]}
              onPress={handleDelete}
              activeOpacity={0.85}
            >
              <Ionicons name="trash-outline" size={16} color="#E11D48" />
              <Text style={[styles.actionBtnText, { color: '#E11D48' }]}>Delete</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blob2: {
    position: 'absolute', bottom: -30, left: -30,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Nav
  navBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18,
  },
  navActions: { flexDirection: 'row', gap: 8 },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnDanger: { backgroundColor: 'rgba(225,29,72,0.3)' },

  // Type badge
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 10,
  },
  typeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FDE68A' },
  typeText: { fontSize: 11, color: '#fff', fontWeight: '700', letterSpacing: 0.4 },

  // Hero text
  heroVendor: {
    fontSize: 24, fontWeight: '900', color: '#fff',
    letterSpacing: -0.5, marginBottom: 4,
  },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 20, fontWeight: '500' },

  // Amount
  heroAmountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, padding: 14,
  },
  heroAmountLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '600', marginBottom: 3 },
  heroAmount: { fontSize: 34, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  itcBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
  },
  itcText: { fontSize: 12, color: '#fff', fontWeight: '700' },

  // Scroll
  scroll: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },

  // Section card
  sectionCard: {
    backgroundColor: '#fff', borderRadius: 20,
    padding: 16,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1A1535', letterSpacing: -0.3 },

  // Detail rows
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
  },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  rowValue: { fontSize: 13, fontWeight: '700', color: '#1A1535', maxWidth: '60%', textAlign: 'right' },
  rowMono: { fontFamily: 'Courier', fontSize: 12, letterSpacing: 0.3 },

  // GST bars
  gstBarsWrap: { gap: 12, marginBottom: 14 },
  gstBarRow: { gap: 5 },
  gstBarTop: { flexDirection: 'row', justifyContent: 'space-between' },
  gstBarLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  gstBarAmount: { fontSize: 12, fontWeight: '800' },
  gstBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  gstBarFill: { height: 6, borderRadius: 3 },
  gstTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: '#F8F7FF', borderRadius: 12, padding: 12,
  },
  gstTotalLabel: { fontSize: 13, fontWeight: '700', color: '#1A1535' },
  gstTotalValue: { fontSize: 15, fontWeight: '900', color: '#8B5CF6' },

  // Amount breakdown total
  totalHighlight: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 10, paddingTop: 12,
    borderTopWidth: 1.5, borderTopColor: '#EDE9FE',
  },
  totalHighlightLabel: { fontSize: 14, fontWeight: '800', color: '#1A1535' },
  totalHighlightValue: { fontSize: 18, fontWeight: '900', color: '#059669' },

  // Flags
  flagsRow: { flexDirection: 'row', gap: 10 },
  flagCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#F3F4F6',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  flagCardActive: { borderColor: '#D1FAE5', backgroundColor: '#F0FDF4' },
  flagCardWarning: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  flagLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textAlign: 'center' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  actionBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 14,
  },
  actionBtnOutline: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#FFE4E6',
  },
  actionBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});

export default InvoiceDetailScreen;
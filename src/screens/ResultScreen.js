/**
 * screens/ResultScreen.js — Premium Invoice Extraction Result
 *
 * Design: Dark-to-light gradient hero, animated staggered card entries,
 * glassmorphism stat bubbles, polished inline edit experience.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import useInvoiceStore from '../store/invoiceStore';
import { COLORS, SPACING, RADIUS } from '../utils/theme';

const { width: W } = Dimensions.get('window');

// ─── Animated stat bubble ─────────────────────────────────────────────────────
const StatBubble = ({ label, value, color, icon, delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, tension: 60, friction: 10,
      delay, useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
      flex: 1,
    }}>
      <View style={[styles.statBubble, { borderColor: color + '30' }]}>
        <LinearGradient colors={[color + '18', color + '08']} style={styles.statBubbleGrad}>
          <View style={[styles.statIconWrap, { backgroundColor: color + '22' }]}>
            <Ionicons name={icon} size={14} color={color} />
          </View>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </LinearGradient>
      </View>
    </Animated.View>
  );
};

// ─── Section card with stagger ────────────────────────────────────────────────
const AnimCard = ({ children, delay, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1, tension: 55, friction: 11,
      delay, useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={[{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
    }, style]}>
      {children}
    </Animated.View>
  );
};

// ─── Individual field row ─────────────────────────────────────────────────────
const Field = ({ label, fieldKey, form, update, editMode, keyboardType = 'default', placeholder, icon }) => (
  <View style={styles.fieldRow}>
    <View style={styles.fieldLabelWrap}>
      {icon && <Ionicons name={icon} size={13} color="#9CA3AF" style={{ marginRight: 5 }} />}
      <Text style={styles.fieldLabel}>{label}</Text>
    </View>
    {editMode ? (
      <View style={styles.fieldInputWrap}>
        <TextInput
          style={styles.fieldInput}
          value={form[fieldKey]}
          onChangeText={(v) => update(fieldKey, v)}
          keyboardType={keyboardType}
          placeholder={placeholder || label}
          placeholderTextColor="#6B7280"
          selectionColor="#6C63FF"
        />
      </View>
    ) : (
      <Text style={styles.fieldValue} numberOfLines={1}>
        {form[fieldKey] || '—'}
      </Text>
    )}
  </View>
);

// ─── GST amount row ────────────────────────────────────────────────────────────
const GstRow = ({ label, fieldKey, form, update, editMode, color }) => {
  const val = parseFloat(form[fieldKey]) || 0;
  return (
    <View style={styles.gstRow}>
      <View style={[styles.gstDot, { backgroundColor: color }]} />
      <Text style={styles.gstRowLabel}>{label}</Text>
      {editMode ? (
        <View style={styles.gstInputWrap}>
          <Text style={styles.gstRupee}>₹</Text>
          <TextInput
            style={styles.gstInput}
            value={form[fieldKey]}
            onChangeText={(v) => update(fieldKey, v)}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#6B7280"
            selectionColor="#6C63FF"
          />
        </View>
      ) : (
        <Text style={[styles.gstRowValue, val > 0 && { color }]}>
          {val > 0 ? `₹${val.toFixed(2)}` : '—'}
        </Text>
      )}
    </View>
  );
};

// ─── Main ResultScreen ────────────────────────────────────────────────────────
const ResultScreen = ({ navigation }) => {
  const { currentInvoice, editInvoice } = useInvoiceStore();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving]     = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }).start();
  }, []);

  const [form, setForm] = useState({
    gstin:         currentInvoice?.gstin         || '',
    invoiceNumber: currentInvoice?.invoiceNumber || '',
    invoiceDate:   currentInvoice?.invoiceDate
      ? dayjs(currentInvoice.invoiceDate).format('YYYY-MM-DD') : '',
    vendorName:    currentInvoice?.vendorName    || '',
    totalAmount:   String(currentInvoice?.totalAmount || ''),
    cgst:          String(currentInvoice?.cgst   || ''),
    sgst:          String(currentInvoice?.sgst   || ''),
    igst:          String(currentInvoice?.igst   || ''),
    invoiceType:   currentInvoice?.invoiceType   || 'input',
  });

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const saveChanges = async () => {
    setSaving(true);
    try {
      await editInvoice(currentInvoice._id, {
        ...form,
        totalAmount: parseFloat(form.totalAmount) || 0,
        cgst: parseFloat(form.cgst) || 0,
        sgst: parseFloat(form.sgst) || 0,
        igst: parseFloat(form.igst) || 0,
      });
      setEditMode(false);
      Alert.alert('✓ Saved', 'Invoice updated successfully');
    } catch {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!currentInvoice) {
    return (
      <LinearGradient colors={['#F8F7FF', '#EDE9FE']} style={{ flex: 1 }}>
        <SafeAreaView style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <LinearGradient colors={['#6C63FF', '#8B5CF6']} style={styles.emptyIconGrad}>
              <Ionicons name="document-outline" size={36} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.emptyTitle}>No Invoice Found</Text>
          <Text style={styles.emptySub}>Scan or upload an invoice to extract GST data</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Scan')} style={styles.emptyCta}>
            <LinearGradient colors={['#6C63FF', '#8B5CF6']} style={styles.emptyCtaGrad}>
              <Ionicons name="camera-outline" size={18} color="#fff" />
              <Text style={styles.emptyCtaText}>Scan Invoice</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const inv       = currentInvoice;
  const totalGst  = inv.totalGst || 0;
  const cgstVal   = parseFloat(form.cgst) || 0;
  const sgstVal   = parseFloat(form.sgst) || 0;
  const igstVal   = parseFloat(form.igst) || 0;
  const totalAmt  = parseFloat(form.totalAmount) || 0;
  const isIntra   = inv.transactionType === 'intra-state';
  const confidence = inv.ocrConfidence !== undefined ? Math.round(inv.ocrConfidence * 100) : null;
  const confColor  = confidence >= 80 ? '#059669' : confidence >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F7FF' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* ── Hero Header ── */}
          <LinearGradient
            colors={['#1A1535', '#2D1F6E', '#3D2B8A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* Decorative circles */}
            <View style={styles.heroDeco1} />
            <View style={styles.heroDeco2} />

            <SafeAreaView edges={['top']}>
              {/* Nav bar */}
              <Animated.View style={[styles.navBar, {
                opacity: headerAnim,
                transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [-12, 0] }) }],
              }]}>
                <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.navBtn}>
                  <Ionicons name="home-outline" size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
                <View style={styles.navChip}>
                  <View style={[styles.navChipDot, { backgroundColor: '#4ADE80' }]} />
                  <Text style={styles.navChipText}>Extraction Complete</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditMode(e => !e)}
                  style={[styles.navBtn, editMode && styles.navBtnActive]}
                >
                  <Ionicons
                    name={editMode ? 'close' : 'create-outline'}
                    size={18}
                    color={editMode ? '#F87171' : 'rgba(255,255,255,0.7)'}
                  />
                </TouchableOpacity>
              </Animated.View>

              {/* Hero content */}
              <Animated.View style={[styles.heroBody, {
                opacity: headerAnim,
                transform: [{ translateY: headerAnim.interpolate({ inputRange: [0,1], outputRange: [20, 0] }) }],
              }]}>
                <Text style={styles.heroVendor} numberOfLines={1}>
                  {form.vendorName || 'Unknown Vendor'}
                </Text>
                <Text style={styles.heroAmount}>
                  ₹{totalAmt > 0 ? totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                </Text>
                <View style={styles.heroBadgeRow}>
                  {/* Invoice type */}
                  <View style={[styles.heroBadge, {
                    backgroundColor: inv.invoiceType === 'input' ? '#6C63FF33' : '#05966933',
                    borderColor: inv.invoiceType === 'input' ? '#6C63FF55' : '#05966955',
                  }]}>
                    <Ionicons
                      name={inv.invoiceType === 'input' ? 'download-outline' : 'upload-outline'}
                      size={11} color={inv.invoiceType === 'input' ? '#A78BFA' : '#34D399'}
                    />
                    <Text style={[styles.heroBadgeText, {
                      color: inv.invoiceType === 'input' ? '#A78BFA' : '#34D399',
                    }]}>
                      {inv.invoiceType === 'input' ? 'Purchase' : 'Sale'}
                    </Text>
                  </View>
                  {/* Transaction type */}
                  <View style={[styles.heroBadge, { backgroundColor: '#F59E0B22', borderColor: '#F59E0B44' }]}>
                    <Ionicons name="swap-horizontal-outline" size={11} color="#FCD34D" />
                    <Text style={[styles.heroBadgeText, { color: '#FCD34D' }]}>
                      {isIntra ? 'Intra-State' : 'Inter-State'}
                    </Text>
                  </View>
                  {/* OCR confidence */}
                  {confidence !== null && (
                    <View style={[styles.heroBadge, { backgroundColor: confColor + '22', borderColor: confColor + '44' }]}>
                      <Ionicons name="analytics-outline" size={11} color={confColor} />
                      <Text style={[styles.heroBadgeText, { color: confColor }]}>{confidence}% OCR</Text>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Stat bubbles */}
              <View style={styles.statsRow}>
                <StatBubble label="GST Total"  value={`₹${totalGst.toFixed(0)}`} color="#6C63FF" icon="receipt-outline" delay={100} />
                <StatBubble label="CGST"        value={cgstVal > 0 ? `₹${cgstVal.toFixed(0)}` : '—'} color="#8B5CF6" icon="layers-outline" delay={180} />
                <StatBubble label="SGST"        value={sgstVal > 0 ? `₹${sgstVal.toFixed(0)}` : '—'} color="#A78BFA" icon="layers-outline" delay={260} />
                <StatBubble label="IGST"        value={igstVal > 0 ? `₹${igstVal.toFixed(0)}` : '—'} color="#C4B5FD" icon="git-merge-outline" delay={340} />
              </View>
            </SafeAreaView>
          </LinearGradient>

          {/* ── ITC Banner ── */}
          <AnimCard delay={100} style={{ marginHorizontal: 16, marginTop: -14 }}>
            <LinearGradient
              colors={inv.itcEligible ? ['#059669', '#10B981'] : ['#DC2626', '#EF4444']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.itcBanner}
            >
              <View style={styles.itcBannerLeft}>
                <View style={styles.itcBannerIcon}>
                  <Ionicons
                    name={inv.itcEligible ? 'shield-checkmark' : 'shield-outline'}
                    size={20} color="#fff"
                  />
                </View>
                <View>
                  <Text style={styles.itcBannerTitle}>
                    ITC {inv.itcEligible ? 'Eligible' : 'Not Eligible'}
                  </Text>
                  <Text style={styles.itcBannerSub}>
                    {inv.itcEligible
                      ? `₹${totalGst.toFixed(2)} claimable as Input Tax Credit`
                      : 'This invoice does not qualify for ITC'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </AnimCard>

          {/* ── Invoice Details Card ── */}
          <AnimCard delay={200} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="document-text-outline" size={16} color="#6C63FF" />
              </View>
              <Text style={styles.cardTitle}>Invoice Details</Text>
              {editMode && (
                <View style={styles.editingPill}>
                  <View style={styles.editingDot} />
                  <Text style={styles.editingText}>Editing</Text>
                </View>
              )}
            </View>

            <Field label="GSTIN"          fieldKey="gstin"         form={form} update={update} editMode={editMode} icon="business-outline"    placeholder="27AAAAA0000A1Z5" />
            <Field label="Invoice No."    fieldKey="invoiceNumber"  form={form} update={update} editMode={editMode} icon="document-outline" />
            <Field label="Date"           fieldKey="invoiceDate"    form={form} update={update} editMode={editMode} icon="calendar-outline"    placeholder="YYYY-MM-DD" />
            <Field label="Vendor / Supplier" fieldKey="vendorName" form={form} update={update} editMode={editMode} icon="storefront-outline" />
            <Field label="Total Amount"   fieldKey="totalAmount"    form={form} update={update} editMode={editMode} icon="cash-outline"        keyboardType="numeric" />
          </AnimCard>

          {/* ── GST Breakdown Card ── */}
          <AnimCard delay={300} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: '#05966915' }]}>
                <Ionicons name="pie-chart-outline" size={16} color="#059669" />
              </View>
              <Text style={styles.cardTitle}>GST Breakdown</Text>
            </View>

            {/* Visual GST bar */}
            {totalGst > 0 && (
              <View style={styles.gstBar}>
                {cgstVal > 0 && (
                  <View style={[styles.gstBarSegment, {
                    flex: cgstVal, backgroundColor: '#6C63FF',
                  }]} />
                )}
                {sgstVal > 0 && (
                  <View style={[styles.gstBarSegment, {
                    flex: sgstVal, backgroundColor: '#8B5CF6',
                  }]} />
                )}
                {igstVal > 0 && (
                  <View style={[styles.gstBarSegment, {
                    flex: igstVal, backgroundColor: '#A78BFA',
                  }]} />
                )}
              </View>
            )}

            <GstRow label="CGST" fieldKey="cgst" form={form} update={update} editMode={editMode} color="#6C63FF" />
            <GstRow label="SGST" fieldKey="sgst" form={form} update={update} editMode={editMode} color="#8B5CF6" />
            <GstRow label="IGST" fieldKey="igst" form={form} update={update} editMode={editMode} color="#A78BFA" />

            {/* Total row */}
            <View style={styles.gstTotalRow}>
              <LinearGradient colors={['#6C63FF12', '#8B5CF608']} style={styles.gstTotalGrad}>
                <Text style={styles.gstTotalLabel}>Total GST</Text>
                <Text style={styles.gstTotalValue}>₹{totalGst.toFixed(2)}</Text>
              </LinearGradient>
            </View>

            {/* GST type info */}
            <View style={[styles.gstInfoRow, { backgroundColor: isIntra ? '#6C63FF0D' : '#F59E0B0D' }]}>
              <Ionicons name="information-circle-outline" size={14} color={isIntra ? '#6C63FF' : '#F59E0B'} />
              <Text style={[styles.gstInfoText, { color: isIntra ? '#6C63FF' : '#F59E0B' }]}>
                {isIntra
                  ? 'Intra-state: CGST + SGST apply'
                  : 'Inter-state: IGST applies'}
              </Text>
            </View>
          </AnimCard>

          {/* ── Low confidence warning ── */}
          {confidence !== null && confidence < 60 && (
            <AnimCard delay={380} style={{ marginHorizontal: 16 }}>
              <View style={styles.warningBanner}>
                <Ionicons name="warning-outline" size={18} color="#F59E0B" />
                <Text style={styles.warningText}>
                  Low OCR confidence ({confidence}%) — please verify all extracted fields before saving.
                </Text>
              </View>
            </AnimCard>
          )}

          {/* ── Save button (edit mode) ── */}
          {editMode && (
            <AnimCard delay={100} style={{ marginHorizontal: 16, marginTop: 8 }}>
              <TouchableOpacity
                onPress={saveChanges}
                disabled={saving}
                activeOpacity={0.88}
                style={{ borderRadius: 16, overflow: 'hidden' }}
              >
                <LinearGradient colors={['#059669', '#10B981']} style={styles.saveBtn}>
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                  }
                  <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditMode(false)}
                style={styles.cancelBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Cancel Editing</Text>
              </TouchableOpacity>
            </AnimCard>
          )}

          {/* ── Bottom actions (view mode) ── */}
          {!editMode && (
            <AnimCard delay={420} style={styles.bottomActions}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => navigation.navigate('Scan')}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={18} color="#6C63FF" />
                <Text style={styles.secondaryBtnText}>Scan Another</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1.5, borderRadius: 16, overflow: 'hidden' }}
                onPress={() => navigation.navigate('Dashboard')}
                activeOpacity={0.88}
              >
                <LinearGradient colors={['#6C63FF', '#8B5CF6']} style={styles.primaryBtn}>
                  <Ionicons name="bar-chart-outline" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>View Reports</Text>
                </LinearGradient>
              </TouchableOpacity>
            </AnimCard>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap:  { marginBottom: 20 },
  emptyIconGrad:  { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:     { fontSize: 22, fontWeight: '800', color: '#1A1535', marginBottom: 8 },
  emptySub:       { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  emptyCta:       { borderRadius: 16, overflow: 'hidden', width: '100%' },
  emptyCtaGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  emptyCtaText:   { color: '#fff', fontWeight: '700', fontSize: 16 },

  // Hero
  hero: { paddingBottom: 36, paddingHorizontal: 16, overflow: 'hidden' },
  heroDeco1: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(108,99,255,0.15)',
  },
  heroDeco2: {
    position: 'absolute', bottom: 20, left: -40,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(139,92,246,0.1)',
  },

  // Nav bar
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 8, marginBottom: 20,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  navBtnActive: { backgroundColor: 'rgba(248,113,113,0.15)', borderColor: 'rgba(248,113,113,0.3)' },
  navChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  navChipDot:  { width: 6, height: 6, borderRadius: 3 },
  navChipText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  // Hero body
  heroBody:   { marginBottom: 20 },
  heroVendor: { fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginBottom: 4, letterSpacing: 0.3 },
  heroAmount: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: -1.5, marginBottom: 12 },
  heroBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  // Stat bubbles
  statsRow:      { flexDirection: 'row', gap: 8, marginTop: 4 },
  statBubble:    { borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  statBubbleGrad:{ padding: 10, alignItems: 'center', gap: 4 },
  statIconWrap:  { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statValue:     { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  statLabel:     { fontSize: 9, color: 'rgba(255,255,255,0.45)', fontWeight: '600', letterSpacing: 0.2 },

  // ITC Banner
  itcBanner: {
    borderRadius: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 14,
    shadowColor: '#059669', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  itcBannerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itcBannerIcon:  {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  itcBannerTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  itcBannerSub:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2, lineHeight: 16 },

  // Cards
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    marginHorizontal: 16, marginTop: 12, padding: 16,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: '#6C63FF15', alignItems: 'center', justifyContent: 'center',
  },
  cardTitle:  { fontSize: 15, fontWeight: '800', color: '#1A1535', flex: 1, letterSpacing: -0.2 },
  editingPill:{
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FEF3C7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  editingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F59E0B' },
  editingText:{ fontSize: 11, fontWeight: '700', color: '#D97706' },

  // Fields
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11, borderBottomWidth: 1, borderColor: '#F3F4F6',
  },
  fieldLabelWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  fieldLabel:     { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  fieldValue:     { fontSize: 13, fontWeight: '700', color: '#1A1535', flex: 1.4, textAlign: 'right' },
  fieldInputWrap: {
    flex: 1.4, borderBottomWidth: 1.5, borderColor: '#6C63FF',
    backgroundColor: '#6C63FF08', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  fieldInput: { fontSize: 13, color: '#1A1535', fontWeight: '700', textAlign: 'right' },

  // GST rows
  gstBar: {
    flexDirection: 'row', height: 5, borderRadius: 4,
    overflow: 'hidden', marginBottom: 14, gap: 2,
  },
  gstBarSegment: { borderRadius: 4 },
  gstRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6',
  },
  gstDot:        { width: 8, height: 8, borderRadius: 4 },
  gstRowLabel:   { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  gstRowValue:   { fontSize: 15, fontWeight: '800', color: '#6B7280' },
  gstInputWrap:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  gstRupee:      { fontSize: 14, color: '#6C63FF', fontWeight: '700' },
  gstInput:      {
    fontSize: 15, color: '#1A1535', fontWeight: '800', minWidth: 70, textAlign: 'right',
    borderBottomWidth: 1.5, borderColor: '#6C63FF', paddingVertical: 2, paddingHorizontal: 4,
  },
  gstTotalRow:   { marginTop: 10, borderRadius: 12, overflow: 'hidden' },
  gstTotalGrad:  {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  gstTotalLabel: { fontSize: 15, fontWeight: '800', color: '#1A1535' },
  gstTotalValue: { fontSize: 22, fontWeight: '900', color: '#6C63FF', letterSpacing: -0.5 },
  gstInfoRow:    {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, borderRadius: 10, padding: 10,
  },
  gstInfoText:   { fontSize: 12, fontWeight: '600' },

  // Warning
  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#FEF3C7', borderRadius: 14, padding: 12, marginTop: 12,
    borderWidth: 1, borderColor: '#FCD34D44',
  },
  warningText:   { flex: 1, fontSize: 13, color: '#92400E', fontWeight: '500', lineHeight: 19 },

  // Save / Cancel
  saveBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancelBtn:   { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText:{ fontSize: 14, color: '#9CA3AF', fontWeight: '600' },

  // Bottom actions
  bottomActions: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 14 },
  secondaryBtn:  {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#6C63FF', borderRadius: 16, height: 52,
    backgroundColor: '#6C63FF08',
  },
  secondaryBtnText: { color: '#6C63FF', fontWeight: '700', fontSize: 15 },
  primaryBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52 },
  primaryBtnText:{ color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default ResultScreen;
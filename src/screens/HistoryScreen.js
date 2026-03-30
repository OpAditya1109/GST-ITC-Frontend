/**
 * screens/HistoryScreen.js — Invoice history with premium startup-grade UI
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Animated, TextInput,
  StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import useInvoiceStore from '../store/invoiceStore';
import { COLORS, SPACING, RADIUS, SHADOW } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Invoice Card ──────────────────────────────────────────────────────────────
const InvoiceCard = ({ item, navigation, onDelete, index }) => {
  const isInput = item.invoiceType === 'input';
  const dateStr = item.invoiceDate
    ? dayjs(item.invoiceDate).format('DD MMM YYYY')
    : 'Date unknown';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0, tension: 80, friction: 12,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97, tension: 200, friction: 10, useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1, tension: 200, friction: 10, useNativeDriver: true,
    }).start();
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Invoice',
      `Remove invoice from ${item.vendorName || item.invoiceNumber || 'this vendor'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item._id) },
      ]
    );
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => navigation.navigate('InvoiceDetail', { invoice: item })}
      >
        <View style={styles.card}>
          {/* Accent gradient bar */}
          <LinearGradient
            colors={isInput ? ['#059669', '#10B981'] : ['#E11D48', '#FB7185']}
            style={styles.colorBar}
          />

          <View style={styles.cardBody}>
            {/* Top row */}
            <View style={styles.cardTop}>
              <View style={styles.cardIconWrap}>
                <View style={[
                  styles.cardIcon,
                  { backgroundColor: isInput ? 'rgba(5,150,105,.12)' : 'rgba(225,29,72,.1)' }
                ]}>
                  <Ionicons
                    name={isInput ? 'bag-handle' : 'storefront'}
                    size={16}
                    color={isInput ? '#059669' : '#E11D48'}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardVendor} numberOfLines={1}>
                  {item.vendorName || item.invoiceNumber || 'Invoice'}
                </Text>
                <View style={styles.cardMeta}>
                  <Ionicons name="calendar-outline" size={10} color="#9CA3AF" />
                  <Text style={styles.cardDate}>{dateStr}</Text>
                  {item.isEdited && (
                    <>
                      <View style={styles.metaDot} />
                      <Text style={styles.editedTag}>Edited</Text>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>₹{item.totalAmount?.toFixed(0)}</Text>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: isInput ? 'rgba(5,150,105,.12)' : 'rgba(225,29,72,.1)' }
                ]}>
                  <Text style={[
                    styles.typeText,
                    { color: isInput ? '#059669' : '#E11D48' }
                  ]}>
                    {isInput ? 'Purchase' : 'Sale'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Footer row */}
            <View style={styles.cardFooter}>
              <View style={styles.gstPill}>
                <Ionicons name="receipt-outline" size={11} color="#6C63FF" />
                <Text style={styles.gstText}>GST ₹{item.totalGst?.toFixed(2) || '0.00'}</Text>
              </View>

              {item.itcEligible && (
                <View style={styles.itcPill}>
                  <Ionicons name="checkmark-circle" size={11} color="#059669" />
                  <Text style={styles.itcText}>ITC</Text>
                </View>
              )}

              <View style={{ flex: 1 }} />

              <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={15} color="#E11D48" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Filter Chip ───────────────────────────────────────────────────────────────
const FilterChip = ({ label, icon, value, current, onPress }) => {
  const isActive = current === value;
  return (
    <TouchableOpacity
      style={[styles.chip, isActive && styles.chipActive]}
      onPress={() => onPress(isActive ? '' : value)}
      activeOpacity={0.75}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={12}
          color={isActive ? '#6C63FF' : '#9CA3AF'}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─── Summary Strip ─────────────────────────────────────────────────────────────
const SummaryStrip = ({ invoices }) => {
  const total = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalGST = invoices.reduce((s, i) => s + (i.totalGst || 0), 0);
  const purchases = invoices.filter(i => i.invoiceType === 'input').length;
  const sales = invoices.filter(i => i.invoiceType === 'output').length;

  return (
    <LinearGradient colors={['#6C63FF', '#8B5CF6']} style={styles.summaryStrip}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryVal}>{invoices.length}</Text>
        <Text style={styles.summaryLbl}>Total</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryVal}>{purchases}</Text>
        <Text style={styles.summaryLbl}>Purchases</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryVal}>{sales}</Text>
        <Text style={styles.summaryLbl}>Sales</Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryVal}>₹{(totalGST / 1000).toFixed(1)}k</Text>
        <Text style={styles.summaryLbl}>GST</Text>
      </View>
    </LinearGradient>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const HistoryScreen = ({ navigation }) => {
  const { invoices, fetchInvoices, deleteInvoice, isLoading } = useInvoiceStore();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1, tension: 70, friction: 12, useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    fetchInvoices({ month: selectedMonth, type: typeFilter });
  }, [selectedMonth, typeFilter]);

  const toggleSearch = () => {
    const toVal = searchActive ? 0 : 1;
    setSearchActive(!searchActive);
    Animated.spring(searchAnim, {
      toValue: toVal, tension: 80, friction: 12, useNativeDriver: false,
    }).start();
    if (searchActive) setSearchQuery('');
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inv.vendorName?.toLowerCase().includes(q) ||
      inv.invoiceNumber?.toLowerCase().includes(q)
    );
  });

  const searchWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH - 100],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F7FF" />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Animated.View style={[
        styles.header,
        {
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        }
      ]}>
        <View>
          <Text style={styles.headerEyebrow}>Invoice</Text>
          <Text style={styles.headerTitle}>History</Text>
        </View>

        <View style={styles.headerActions}>
          {/* Search bar (animated expand) */}
          <Animated.View style={[styles.searchBar, { width: searchWidth, opacity: searchAnim }]}>
            <Ionicons name="search" size={14} color="#9CA3AF" style={{ marginLeft: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vendor, invoice…"
              placeholderTextColor="#C4C4C4"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={searchActive}
            />
          </Animated.View>

          <TouchableOpacity style={styles.iconBtn} onPress={toggleSearch}>
            <Ionicons
              name={searchActive ? 'close' : 'search'}
              size={18}
              color="#6C63FF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, styles.addIconBtn]}
            onPress={() => navigation.navigate('Scan')}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Summary Strip ──────────────────────────────────────────────── */}
      {!isLoading && invoices.length > 0 && (
        <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
          <SummaryStrip invoices={filteredInvoices} />
        </View>
      )}

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <View style={styles.filterSection}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Type</Text>
          <View style={styles.chipRow}>
            <FilterChip label="All" value="" current={typeFilter} onPress={setTypeFilter} />
            <FilterChip label="Purchase" icon="bag-handle-outline" value="input" current={typeFilter} onPress={setTypeFilter} />
            <FilterChip label="Sale" icon="storefront-outline" value="output" current={typeFilter} onPress={setTypeFilter} />
          </View>
        </View>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Period</Text>
          <View style={styles.chipRow}>
            <FilterChip label="All Time" value="" current={selectedMonth} onPress={setSelectedMonth} />
            <FilterChip label="This Month" value={dayjs().format('YYYY-MM')} current={selectedMonth} onPress={setSelectedMonth} />
            <FilterChip label="Last Month" value={dayjs().subtract(1, 'month').format('YYYY-MM')} current={selectedMonth} onPress={setSelectedMonth} />
          </View>
        </View>
      </View>

      {/* ── Results count ──────────────────────────────────────────────── */}
      {!isLoading && invoices.length > 0 && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}
          </Text>
          {(typeFilter || selectedMonth) && (
            <TouchableOpacity onPress={() => { setTypeFilter(''); setSelectedMonth(''); }}>
              <Text style={styles.clearText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Content ────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Loading invoices…</Text>
        </View>
      ) : filteredInvoices.length === 0 ? (
        <EmptyState onScan={() => navigation.navigate('Scan')} hasFilters={!!(typeFilter || selectedMonth || searchQuery)} />
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <InvoiceCard
              item={item}
              navigation={navigation}
              onDelete={deleteInvoice}
              index={index}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ onScan, hasFilters }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 700, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.emptyWrap}>
      <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
        <View style={styles.emptyIcon}>
          <Ionicons name="receipt-outline" size={40} color="#6C63FF" />
        </View>
      </Animated.View>
      <Text style={styles.emptyTitle}>
        {hasFilters ? 'No results found' : 'No invoices yet'}
      </Text>
      <Text style={styles.emptySub}>
        {hasFilters
          ? 'Try adjusting your filters or search'
          : 'Scan your first invoice to get started'}
      </Text>
      {!hasFilters && (
        <TouchableOpacity style={styles.scanBtn} onPress={onScan} activeOpacity={0.85}>
          <LinearGradient colors={['#6C63FF', '#8B5CF6']} style={styles.scanBtnGrad}>
            <Ionicons name="scan" size={16} color="#fff" />
            <Text style={styles.scanBtnText}>Scan Invoice</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10,
  },
  headerEyebrow: {
    fontSize: 11, fontWeight: '600', color: '#6C63FF',
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#1A1535', letterSpacing: -0.5 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20, height: 36,
    overflow: 'hidden',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  searchInput: {
    flex: 1, fontSize: 13, color: '#1A1535',
    paddingHorizontal: 8, height: '100%',
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center',
  },
  addIconBtn: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row', borderRadius: 16, padding: 14,
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 18, fontWeight: '900', color: '#fff' },
  summaryLbl: { fontSize: 10, color: 'rgba(255,255,255,.65)', marginTop: 2, fontWeight: '500' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,.2)', marginHorizontal: 4 },

  // Filters
  filterSection: { paddingHorizontal: 16, gap: 6, marginBottom: 6 },
  filterGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterLabel: {
    fontSize: 11, fontWeight: '700', color: '#9CA3AF',
    letterSpacing: 0.5, width: 44,
  },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 11, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#EDE9FE', borderColor: '#6C63FF' },
  chipText: { fontSize: 11, fontWeight: '600', color: '#9CA3AF' },
  chipTextActive: { color: '#6C63FF' },

  // Results row
  resultsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 6,
  },
  resultsText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  clearText: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },

  // List
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  colorBar: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardIconWrap: { paddingTop: 1 },
  cardIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardVendor: { fontSize: 14, fontWeight: '700', color: '#1A1535', marginBottom: 3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardDate: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#D1D5DB' },
  editedTag: { fontSize: 10, color: '#F59E0B', fontWeight: '700' },
  cardRight: { alignItems: 'flex-end', marginLeft: 'auto' },
  cardAmount: { fontSize: 16, fontWeight: '900', color: '#1A1535', letterSpacing: -0.4 },
  typeBadge: {
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 5,
  },
  typeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  // Footer
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
    gap: 6,
  },
  gstPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#EDE9FE', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  gstText: { fontSize: 11, color: '#6C63FF', fontWeight: '700' },
  itcPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(5,150,105,.1)', borderRadius: 20,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  itcText: { fontSize: 11, color: '#059669', fontWeight: '700' },
  deleteBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(225,29,72,.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Empty state
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1A1535', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  scanBtn: {
    marginTop: 24, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  scanBtnGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 28,
  },
  scanBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default HistoryScreen;
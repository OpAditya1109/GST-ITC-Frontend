/**
 * screens/ScanScreen.js — Premium Camera Capture + Gallery Upload + Preview
 * Redesigned: animated scanning frame, glassmorphism controls, polished preview UX
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, Alert, Platform, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import useInvoiceStore from '../store/invoiceStore';
import { COLORS, SPACING, RADIUS } from '../utils/theme';
import LimitModal from '../components/LimitModal';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FRAME_SIZE = SCREEN_W * 0.78;

// ─── Animated corner piece ────────────────────────────────────────────────────
const Corner = ({ style }) => (
  <View style={[styles.corner, style]}>
    <View style={[styles.cornerH]} />
    <View style={[styles.cornerV]} />
  </View>
);

// ─── Scan line animation ──────────────────────────────────────────────────────
const ScanLine = () => {
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_SIZE - 4],
  });

  return (
    <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
      <LinearGradient
        colors={['transparent', 'rgba(108,99,255,0.8)', 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ flex: 1, height: 2, borderRadius: 1 }}
      />
    </Animated.View>
  );
};

// ─── Pulse ring around capture button ────────────────────────────────────────
const PulseRing = () => {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse,   { toValue: 1.35, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse,   { toValue: 1,    duration: 1200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0,    duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6,  duration: 1200, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[
      styles.pulseRing,
      { transform: [{ scale: pulse }], opacity },
    ]} />
  );
};

// ─── Main ScanScreen ──────────────────────────────────────────────────────────
const ScanScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode]               = useState('camera');
  const [capturedUri, setCapturedUri] = useState(null);
  const [invoiceType, setInvoiceType] = useState('input');
  const [uploading, setUploading]     = useState(false);
  const [flash, setFlash]             = useState(false);
  const cameraRef = useRef(null);
const [showLimit, setShowLimit] = useState(false);
const [limitData, setLimitData] = useState(null);


  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const previewFade = useRef(new Animated.Value(0)).current;

  const { uploadInvoice } = useInvoiceStore();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const enterPreview = (uri) => {
    setCapturedUri(uri);
    setMode('preview');
    previewFade.setValue(0);
    Animated.timing(previewFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85, base64: false, skipProcessing: false,
      });
      enterPreview(photo.uri);
    } catch {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permission needed', 'Allow photo library access to upload invoices');
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85, allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) enterPreview(result.assets[0].uri);
  };

  const processInvoice = async () => {
    if (!capturedUri) return;
    setUploading(true);
    try {
      await uploadInvoice(capturedUri, invoiceType);
      navigation.replace('Result');
    } catch (err) {
  const data = err.response?.data;
  if (err.response?.status === 403 && data?.code === 'SCAN_LIMIT_REACHED') {
    setLimitData({
      used: data.scansUsed,
      total: data.scansTotal,
      planName: data.planName,   // ← add this

    });
    setShowLimit(true);
  } else {
    Alert.alert('Processing Failed', data?.message || 'OCR failed. Try a clearer image.');
  }
} finally {
      setUploading(false);
    }
  };

  const resetCamera = () => {
    setCapturedUri(null);
    setMode('camera');
  };

  // ── No permission yet ───────────────────────────────────────────────────────
  if (!permission) return <View style={styles.container} />;

  // ── Permission denied ───────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <LinearGradient colors={['#1A1535', '#2D2060', '#1A1535']} style={{ flex: 1 }}>
        <SafeAreaView style={styles.permContainer}>
          <View style={styles.permIconWrap}>
            <LinearGradient colors={['#6C63FF', '#8B5CF6']} style={styles.permIconGrad}>
              <Ionicons name="camera-outline" size={36} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.permTitle}>Camera Access Needed</Text>
          <Text style={styles.permSub}>
            Grant camera permission to scan invoices, or upload directly from your gallery.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission} activeOpacity={0.85}>
            <LinearGradient colors={['#6C63FF', '#8B5CF6']} style={styles.permBtnGrad}>
              <Ionicons name="camera" size={18} color="#fff" />
              <Text style={styles.permBtnText}>Allow Camera</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permOutlineBtn} onPress={pickFromGallery} activeOpacity={0.8}>
            <Ionicons name="images-outline" size={18} color="#A78BFA" />
            <Text style={styles.permOutlineBtnText}>Upload from Gallery</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Preview mode ─────────────────────────────────────────────────────────────
  if (mode === 'preview' && capturedUri) {
    return (
      <>
      <Animated.View style={[{ flex: 1, backgroundColor: '#0F0D1E' }, { opacity: previewFade }]}>
        <SafeAreaView style={{ flex: 1 }}>

          {/* Header */}
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={resetCamera} style={styles.previewBackBtn} activeOpacity={0.8}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View>
              <Text style={styles.previewTitle}>Review Invoice</Text>
              <Text style={styles.previewSubtitle}>Confirm before scanning</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Image */}
          <View style={styles.previewImageWrap}>
            <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="contain" />
            {/* Corners */}
            <Corner style={{ top: 10, left: 10 }} />
            <Corner style={{ top: 10, right: 10, transform: [{ scaleX: -1 }] }} />
            <Corner style={{ bottom: 10, left: 10, transform: [{ scaleY: -1 }] }} />
            <Corner style={{ bottom: 10, right: 10, transform: [{ scaleX: -1 }, { scaleY: -1 }] }} />
          </View>

          {/* Invoice type toggle */}
          <View style={styles.typeSection}>
            <Text style={styles.typeLabel}>Invoice Type</Text>
            <View style={styles.typeToggleRow}>
              {[
                { key: 'input',  icon: 'download-outline',   label: 'Purchase',  hint: 'Input GST' },
                { key: 'output', icon: 'upload-outline',     label: 'Sale',      hint: 'Output GST' },
              ].map((t) => {
                const active = invoiceType === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    onPress={() => setInvoiceType(t.key)}
                    activeOpacity={0.8}
                    style={[styles.typeBtn, active && styles.typeBtnActive]}
                  >
                    {active && (
                      <LinearGradient
                        colors={['#6C63FF22', '#8B5CF622']}
                        style={StyleSheet.absoluteFillObject}
                        borderRadius={14}
                      />
                    )}
                    <View style={[styles.typeIconWrap, active && styles.typeIconWrapActive]}>
                      <Ionicons name={t.icon} size={18} color={active ? '#fff' : '#6B7280'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.typeBtnLabel, active && styles.typeBtnLabelActive]}>
                        {t.label}
                      </Text>
                      <Text style={styles.typeBtnHint}>{t.hint}</Text>
                    </View>
                    {active && (
                      <View style={styles.typeCheckmark}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.typeInfo}>
              {invoiceType === 'input'
                ? '📥  Invoices you received — eligible for ITC credit'
                : '📤  Invoices you issued — GST collected from buyer'}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeBtn} onPress={resetCamera} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={18} color="#A78BFA" />
              <Text style={styles.retakeBtnText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.processBtn, uploading && { opacity: 0.7 }]}
              onPress={processInvoice}
              disabled={uploading}
              activeOpacity={0.88}
            >
              <LinearGradient colors={['#6C63FF', '#8B5CF6']} style={styles.processBtnGrad}>
                {uploading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Ionicons name="scan-outline" size={18} color="#fff" />
                }
                <Text style={styles.processBtnText}>
                  {uploading ? 'Scanning...' : 'Extract GST Data'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>


        </SafeAreaView>
      </Animated.View>
      {limitData && (
  <LimitModal
    visible={showLimit}
    onClose={() => setShowLimit(false)}
    onUpgrade={() => { setShowLimit(false); navigation.replace('Pricing'); }}
    scansUsed={limitData.used}
    scansTotal={limitData.total}
    planName={limitData.planName}

  />
)}
      </>
    );
  }

  // ── Camera mode ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>

      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        ref={cameraRef}
        facing="back"
        enableTorch={flash}
      />

      {/* Dark vignette overlay */}
      <View style={styles.vignetteTop} />
      <View style={styles.vignetteBottom} />

      {/* ── Header ── */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <SafeAreaView>
          <View style={styles.camHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.camHeaderBtn} activeOpacity={0.8}>
              <BlurView intensity={40} tint="dark" style={styles.camHeaderBtnBlur}>
                <Ionicons name="close" size={20} color="#fff" />
              </BlurView>
            </TouchableOpacity>

            <View style={styles.camTitleWrap}>
              <BlurView intensity={40} tint="dark" style={styles.camTitleBlur}>
                <View style={styles.camTitleDot} />
                <Text style={styles.camTitleText}>Scan Invoice</Text>
              </BlurView>
            </View>

            <TouchableOpacity onPress={() => setFlash(f => !f)} style={styles.camHeaderBtn} activeOpacity={0.8}>
              <BlurView intensity={40} tint="dark" style={styles.camHeaderBtnBlur}>
                <Ionicons
                  name={flash ? 'flash' : 'flash-outline'}
                  size={20}
                  color={flash ? '#FDE68A' : '#fff'}
                />
              </BlurView>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ── Scan frame ── */}
      <View style={styles.frameWrap}>
        <View style={styles.frame}>
          {/* Corner brackets */}
          <Corner style={{ top: -2, left: -2 }} />
          <Corner style={{ top: -2, right: -2, transform: [{ scaleX: -1 }] }} />
          <Corner style={{ bottom: -2, left: -2, transform: [{ scaleY: -1 }] }} />
          <Corner style={{ bottom: -2, right: -2, transform: [{ scaleX: -1 }, { scaleY: -1 }] }} />
          <ScanLine />
        </View>
        <Text style={styles.frameHint}>Align the invoice within the frame</Text>
      </View>

      {/* ── Bottom controls ── */}
      <Animated.View style={[styles.controls, { opacity: fadeAnim }]}>
        <BlurView intensity={60} tint="dark" style={styles.controlsBlur}>

          {/* Gallery */}
          <TouchableOpacity onPress={pickFromGallery} style={styles.sideControl} activeOpacity={0.8}>
            <View style={styles.sideControlIcon}>
              <Ionicons name="images-outline" size={22} color="#fff" />
            </View>
            <Text style={styles.sideControlLabel}>Gallery</Text>
          </TouchableOpacity>

          {/* Capture button */}
          <View style={styles.captureBtnWrap}>
            <PulseRing />
            <TouchableOpacity onPress={capturePhoto} activeOpacity={0.85} style={styles.captureBtn}>
              <LinearGradient
                colors={['#6C63FF', '#8B5CF6']}
                style={styles.captureBtnGrad}
              >
                <Ionicons name="camera" size={28} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Tips */}
          <TouchableOpacity style={styles.sideControl} activeOpacity={0.8}
            onPress={() => Alert.alert('Tip', 'Use good lighting and keep the invoice flat for best results.')}
          >
            <View style={styles.sideControlIcon}>
              <Ionicons name="bulb-outline" size={22} color="#FDE68A" />
            </View>
            <Text style={styles.sideControlLabel}>Tips</Text>
          </TouchableOpacity>

        </BlurView>
      </Animated.View>

    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const CORNER_SIZE = 22;
const CORNER_THICK = 3;
const CORNER_COLOR = '#6C63FF';

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Corners
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  cornerH: {
    position: 'absolute', top: 0, left: 0,
    width: CORNER_SIZE, height: CORNER_THICK,
    backgroundColor: CORNER_COLOR, borderRadius: 2,
  },
  cornerV: {
    position: 'absolute', top: 0, left: 0,
    width: CORNER_THICK, height: CORNER_SIZE,
    backgroundColor: CORNER_COLOR, borderRadius: 2,
  },

  // Permission screen
  permContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  permIconWrap: { marginBottom: 24 },
  permIconGrad: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  permTitle: {
    fontSize: 24, fontWeight: '800', color: '#fff',
    textAlign: 'center', marginBottom: 10, letterSpacing: -0.5,
  },
  permSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.55)',
    textAlign: 'center', lineHeight: 22, marginBottom: 36,
  },
  permBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  permBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  permOutlineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.4)',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 28,
  },
  permOutlineBtnText: { color: '#A78BFA', fontWeight: '700', fontSize: 15 },

  // Vignette
  vignetteTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 220,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)',
    // RN doesn't support backgroundImage, use overlay opacity:
    opacity: 1,
  },
  vignetteBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 280,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  // Camera header
  camHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8,
  },
  camHeaderBtn: { borderRadius: 22, overflow: 'hidden' },
  camHeaderBtnBlur: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  camTitleWrap: { borderRadius: 20, overflow: 'hidden' },
  camTitleBlur: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 16, paddingVertical: 10, overflow: 'hidden',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  camTitleDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6C63FF' },
  camTitleText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },

  // Frame
  frameWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  frame: {
    width: FRAME_SIZE, height: FRAME_SIZE * 1.3,
    borderRadius: 4, overflow: 'hidden',
  },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2 },
  frameHint: {
    color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500',
    marginTop: 20, letterSpacing: 0.2,
  },

  // Pulse ring
  pulseRing: {
    position: 'absolute',
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 2, borderColor: '#6C63FF',
  },

  // Bottom controls
  controls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  controlsBlur: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 36, paddingVertical: 28, paddingBottom: 44,
    overflow: 'hidden',
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sideControl: { alignItems: 'center', gap: 6, width: 64 },
  sideControlIcon: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  sideControlLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '600' },

  captureBtnWrap: { alignItems: 'center', justifyContent: 'center', width: 88, height: 88 },
  captureBtn: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden' },
  captureBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Preview
  previewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  previewBackBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  previewTitle:    { fontSize: 17, fontWeight: '800', color: '#fff', textAlign: 'center' },
  previewSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 1 },

  previewImageWrap: {
    flex: 1, margin: 16, borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  previewImage: { flex: 1 },

  // Type toggle
  typeSection: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  typeLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' },
  typeToggleRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, padding: 12,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  typeBtnActive: { borderColor: '#6C63FF' },
  typeIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  typeIconWrapActive: { backgroundColor: '#6C63FF' },
  typeBtnLabel:       { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.45)' },
  typeBtnLabelActive: { color: '#fff' },
  typeBtnHint:        { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 },
  typeCheckmark: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center',
  },
  typeInfo: {
    fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 10, lineHeight: 18,
  },

  // Preview actions
  previewActions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  retakeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.4)',
    borderRadius: 14, height: 52, paddingHorizontal: 20,
    backgroundColor: 'rgba(108,99,255,0.08)',
  },
  retakeBtnText: { color: '#A78BFA', fontWeight: '700', fontSize: 15 },
  processBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  processBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 52,
  },
  processBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

export default ScanScreen;
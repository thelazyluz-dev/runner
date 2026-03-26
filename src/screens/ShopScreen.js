import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useGameStore, ACTIONS } from '../store/GameContext';

const { width: W } = Dimensions.get('window');

const COLOR_OPTIONS = [
  { color: null,      label: 'Default', preview: '#333',    free: true  },
  { color: '#4ECDC4', label: 'Teal',    preview: '#4ECDC4', free: false },
  { color: '#9B59B6', label: 'Purple',  preview: '#9B59B6', free: false },
  { color: '#FFD700', label: 'Gold',    preview: '#FFD700', free: false },
];

export default function ShopScreen({ onBack }) {
  const { state, dispatch } = useGameStore();

  const buy = (type, extra) =>
    dispatch({ type, ...extra });

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🛒 SHOP</Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>🪙 {state.coins}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─────────────────────────────── EXTRA LIFE ─── */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardIcon}>❤️</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>Extra Life</Text>
              <Text style={styles.cardDesc}>
                Retry a quiz question once before game over
              </Text>
              {state.extraLives > 0 && (
                <Text style={styles.ownedCount}>
                  ✅ You own: {state.extraLives}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={[styles.buyBtn, state.coins < 50 && styles.buyBtnOff]}
            disabled={state.coins < 50}
            onPress={() => buy(ACTIONS.BUY_EXTRA_LIFE)}
            activeOpacity={0.8}
          >
            <Text style={[styles.buyBtnText, state.coins < 50 && styles.buyBtnTextOff]}>
              BUY  50 🪙
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─────────────────────────────── START SHIELD ─── */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardIcon}>🛡️</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>Start Shield</Text>
              <Text style={styles.cardDesc}>
                Every new run begins with an active shield
              </Text>
              {state.startShieldOwned && (
                <Text style={styles.ownedCount}>✅ Owned – active every run</Text>
              )}
            </View>
          </View>
          {state.startShieldOwned ? (
            <View style={styles.ownedBadge}>
              <Text style={styles.ownedBadgeText}>OWNED</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.buyBtn, state.coins < 30 && styles.buyBtnOff]}
              disabled={state.coins < 30}
              onPress={() => buy(ACTIONS.BUY_START_SHIELD)}
              activeOpacity={0.8}
            >
              <Text style={[styles.buyBtnText, state.coins < 30 && styles.buyBtnTextOff]}>
                BUY  30 🪙
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─────────────────────────────── PLAYER COLOR ─── */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardIcon}>🎨</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>Player Color</Text>
              <Text style={styles.cardDesc}>
                Add a colored ring around your runner  •  20 🪙 each
              </Text>
            </View>
          </View>

          <View style={styles.swatchRow}>
            {COLOR_OPTIONS.map(({ color, label, preview, free }) => {
              const isActive = state.playerColor === color;
              const canBuy   = free || isActive || state.coins >= 20;
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.swatch, isActive && styles.swatchActive]}
                  onPress={() => buy(ACTIONS.SET_PLAYER_COLOR, { color })}
                  disabled={!canBuy}
                  activeOpacity={0.75}
                >
                  <View style={[styles.swatchCircle, { backgroundColor: preview }]}>
                    {!color && <Text style={styles.swatchEmoji}>🏃</Text>}
                  </View>
                  <Text style={[styles.swatchLabel, isActive && styles.swatchLabelActive]}>
                    {label}
                  </Text>
                  {isActive
                    ? <Text style={styles.swatchCheck}>✓</Text>
                    : free
                      ? <Text style={styles.swatchFree}>FREE</Text>
                      : <Text style={[styles.swatchPrice, !canBuy && styles.swatchPriceOff]}>
                          20 🪙
                        </Text>
                  }
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─────────────────────────────── TIPS ─── */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 How to earn coins</Text>
          <Text style={styles.tipLine}>• Collect 🪙 while running</Text>
          <Text style={styles.tipLine}>• Combo ×2 → double coins for 5 s</Text>
          <Text style={styles.tipLine}>• Combo ×3 → Slow motion 🐢</Text>
          <Text style={styles.tipLine}>• Combo ×4 → Free shield 🛡️</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d1a' },

  // Header
  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#12122a',
    borderBottomWidth: 2,
    borderBottomColor: '#2a2a5a',
    justifyContent: 'space-between',
  },
  backBtn: { paddingHorizontal: 4 },
  backText: { color: '#4ECDC4', fontSize: 15, fontWeight: 'bold' },
  title: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  coinBadge: {
    backgroundColor: '#1e1e40',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  coinText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },

  // Card
  card: {
    backgroundColor: '#16163a',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIcon: { fontSize: 34, marginRight: 14 },
  cardInfo: { flex: 1 },
  cardName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  cardDesc: { color: '#7777aa', fontSize: 13, lineHeight: 18 },
  ownedCount: { color: '#4ECDC4', fontSize: 12, marginTop: 4, fontWeight: 'bold' },

  // Buy button
  buyBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buyBtnOff: { backgroundColor: '#22224a' },
  buyBtnText: { color: '#0d0d1a', fontWeight: 'bold', fontSize: 15 },
  buyBtnTextOff: { color: '#4a4a7a' },

  // Owned badge
  ownedBadge: {
    backgroundColor: '#0d3a26',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  ownedBadgeText: {
    color: '#27ae60',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 2,
  },

  // Color swatches
  swatchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  swatch: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: (W - 80) / 4,
  },
  swatchActive: {
    borderColor: '#FFD700',
    backgroundColor: '#1e1e3a',
  },
  swatchCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginBottom: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchEmoji: { fontSize: 20 },
  swatchLabel: { color: '#7777aa', fontSize: 11, fontWeight: 'bold' },
  swatchLabelActive: { color: '#FFD700' },
  swatchCheck: { color: '#FFD700', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  swatchPrice: { color: '#7777aa', fontSize: 11, marginTop: 2 },
  swatchPriceOff: { color: '#333355' },
  swatchFree: { color: '#4ECDC4', fontSize: 11, fontWeight: 'bold', marginTop: 2 },

  // Tips
  tipsCard: {
    backgroundColor: '#0f0f28',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e1e40',
    marginTop: 4,
  },
  tipsTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 10,
  },
  tipLine: { color: '#5555aa', fontSize: 13, marginBottom: 5 },
});

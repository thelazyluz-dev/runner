import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useGameStore } from '../store/GameContext';

const { width: W } = Dimensions.get('window');

export default function GameOverScreen({ score, coins, onRestart, onShop }) {
  const { state } = useGameStore();

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue:  8, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue:  6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue:  0, duration: 60, useNativeDriver: true }),
          Animated.delay(2200),
        ]),
        { iterations: -1 }
      ),
    ]).start();
  }, []);

  const getRank = () => {
    if (score >= 60) return { label: 'LEGEND',   emoji: '👑', color: '#FFD700' };
    if (score >= 40) return { label: 'MASTER',   emoji: '🏆', color: '#C0C0C0' };
    if (score >= 25) return { label: 'PRO',      emoji: '⭐', color: '#CD7F32' };
    if (score >= 10) return { label: 'RUNNER',   emoji: '🏃', color: '#4ECDC4' };
    return              { label: 'BEGINNER', emoji: '🐣', color: '#FF6B6B' };
  };

  const rank = getRank();

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      {/* Ambient particles */}
      {[...Array(12)].map((_, i) => (
        <Text
          key={i}
          style={[
            styles.star,
            {
              left:    (i * 83) % (W - 20) + 10,
              top:     60 + (i * 57) % 200,
              fontSize: 14 + (i % 3) * 8,
              opacity:  0.2 + (i % 4) * 0.1,
            },
          ]}
        >
          {['⭐', '💥', '🌟', '✨'][i % 4]}
        </Text>
      ))}

      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Title */}
        <Animated.Text style={[styles.title, { transform: [{ translateX: shakeAnim }] }]}>
          💀 GAME OVER 💀
        </Animated.Text>

        {/* Rank badge */}
        <View style={[styles.rankBadge, { borderColor: rank.color }]}>
          <Text style={styles.rankEmoji}>{rank.emoji}</Text>
          <Text style={[styles.rankLabel, { color: rank.color }]}>{rank.label}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsBox}>
          <StatRow icon="⭐" label="SCORE"       value={score} />
          <View style={styles.statDiv} />
          <StatRow icon="🪙" label="COINS EARNED" value={coins} />
          <View style={styles.statDiv} />
          <StatRow icon="💰" label="TOTAL COINS"  value={state.coins} highlight />
        </View>

        {/* Play Again */}
        <TouchableOpacity style={styles.restartBtn} onPress={onRestart} activeOpacity={0.8}>
          <Text style={styles.restartText}>🔄  PLAY AGAIN</Text>
        </TouchableOpacity>

        {/* Shop */}
        <TouchableOpacity style={styles.shopBtn} onPress={onShop} activeOpacity={0.8}>
          <Text style={styles.shopText}>🛒  OPEN SHOP</Text>
        </TouchableOpacity>

        <Text style={styles.tipText}>
          Combo ×2 = double coins  •  ×3 = slow mo  •  ×4 = free shield
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

function StatRow({ icon, label, value, highlight }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statKey}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  star: { position: 'absolute' },

  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#16163a',
    borderRadius: 30,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },

  title: {
    color: '#FF6B6B',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 18,
    textAlign: 'center',
  },

  rankBadge: {
    borderWidth: 2.5,
    borderRadius: 60,
    paddingHorizontal: 26,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
    minWidth: 160,
  },
  rankEmoji: { fontSize: 34 },
  rankLabel: { fontSize: 18, fontWeight: 'bold', letterSpacing: 3, marginTop: 3 },

  statsBox: {
    width: '100%',
    backgroundColor: '#0f0f28',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  statIcon:  { fontSize: 20, marginRight: 10 },
  statKey:   { color: '#8888aa', fontSize: 13, fontWeight: 'bold', letterSpacing: 1.5, flex: 1 },
  statValue: { color: '#FFD700', fontSize: 22, fontWeight: 'bold' },
  statValueHighlight: { color: '#4ECDC4' },
  statDiv:   { height: 1, backgroundColor: '#2a2a4a', marginVertical: 3 },

  restartBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  restartText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },

  shopBtn: {
    backgroundColor: '#1e1e40',
    borderRadius: 18,
    paddingVertical: 13,
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  shopText: { color: '#FFD700', fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },

  tipText: { color: '#3a3a6a', fontSize: 11, textAlign: 'center' },
});

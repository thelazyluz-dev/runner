import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: W } = Dimensions.get('window');

export default function GameOverScreen({ score, coins, onRestart }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Shake the GAME OVER title
    Animated.sequence([
      Animated.delay(300),
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
          Animated.delay(2000),
        ]),
        { iterations: -1 }
      ),
    ]).start();
  }, []);

  const getRank = () => {
    if (score >= 60) return { label: 'LEGEND', emoji: '👑', color: '#FFD700' };
    if (score >= 40) return { label: 'MASTER', emoji: '🏆', color: '#C0C0C0' };
    if (score >= 25) return { label: 'PRO', emoji: '⭐', color: '#CD7F32' };
    if (score >= 10) return { label: 'RUNNER', emoji: '🏃', color: '#4ECDC4' };
    return { label: 'BEGINNER', emoji: '🐣', color: '#FF6B6B' };
  };

  const rank = getRank();

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      {/* Stars / particles */}
      {[...Array(12)].map((_, i) => (
        <Text
          key={i}
          style={[
            styles.star,
            {
              left: (i * 83) % (W - 20) + 10,
              top: 60 + (i * 57) % 200,
              fontSize: 14 + (i % 3) * 8,
              opacity: 0.2 + (i % 4) * 0.1,
            },
          ]}
        >
          {['⭐', '💥', '🌟', '✨'][i % 4]}
        </Text>
      ))}

      <Animated.View
        style={[
          styles.card,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Title */}
        <Animated.Text
          style={[
            styles.title,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          💀 GAME OVER 💀
        </Animated.Text>

        {/* Rank badge */}
        <View style={[styles.rankBadge, { borderColor: rank.color }]}>
          <Text style={styles.rankEmoji}>{rank.emoji}</Text>
          <Text style={[styles.rankLabel, { color: rank.color }]}>
            {rank.label}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsBox}>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statKey}>SCORE</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>🪙</Text>
            <Text style={styles.statKey}>COINS</Text>
            <Text style={styles.statValue}>{coins}</Text>
          </View>
        </View>

        {/* Play Again */}
        <TouchableOpacity
          style={styles.restartBtn}
          onPress={onRestart}
          activeOpacity={0.8}
        >
          <Text style={styles.restartText}>🔄  PLAY AGAIN</Text>
        </TouchableOpacity>

        <Text style={styles.tipText}>
          Tip: Answer the quiz correctly to keep going!
        </Text>
      </Animated.View>
    </Animated.View>
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
  star: {
    position: 'absolute',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#16163a',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },

  // Title
  title: {
    color: '#FF6B6B',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 20,
    textAlign: 'center',
  },

  // Rank
  rankBadge: {
    borderWidth: 2.5,
    borderRadius: 60,
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
    minWidth: 160,
  },
  rankEmoji: { fontSize: 36 },
  rankLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginTop: 4,
  },

  // Stats
  statsBox: {
    width: '100%',
    backgroundColor: '#0f0f28',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statIcon: { fontSize: 22, marginRight: 10 },
  statKey: {
    color: '#8888aa',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 2,
    flex: 1,
  },
  statValue: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statDivider: {
    height: 1,
    backgroundColor: '#2a2a4a',
    marginVertical: 4,
  },

  // Button
  restartBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  restartText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },

  // Tip
  tipText: {
    color: '#4a4a7a',
    fontSize: 12,
    textAlign: 'center',
  },
});

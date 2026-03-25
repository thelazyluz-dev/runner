import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

export default function StartScreen({ onStart }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.5)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(titleScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Float player emoji up and down
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -14,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse the button
    Animated.loop(
      Animated.sequence([
        Animated.timing(btnScale, {
          toValue: 1.05,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(btnScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      {/* Background decorations */}
      <View style={styles.decorRow}>
        {['🌵', '🪨', '🌊', '🔥'].map((e, i) => (
          <Text key={i} style={[styles.decorEmoji, { opacity: 0.12 + i * 0.05 }]}>
            {e}
          </Text>
        ))}
      </View>

      {/* Player */}
      <Animated.Text
        style={[styles.playerEmoji, { transform: [{ translateY: floatAnim }] }]}
      >
        🏃
      </Animated.Text>

      {/* Title */}
      <Animated.View style={{ transform: [{ scale: titleScale }] }}>
        <Text style={styles.title}>RUNNER!</Text>
        <Text style={styles.subtitle}>Dodge • Collect • Answer</Text>
      </Animated.View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <InstructionRow icon="◀▶" text="Tap LEFT / RIGHT to switch lanes" />
        <InstructionRow icon="🌵" text="Dodge obstacles coming your way" />
        <InstructionRow icon="🪙" text="Collect coins for a high score" />
        <InstructionRow icon="🤔" text="Answer quiz to survive a collision" />
      </View>

      {/* Start Button */}
      <Animated.View style={{ transform: [{ scale: btnScale }] }}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={onStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startText}>▶  START GAME</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={styles.version}>v1.0 • Math Edition</Text>
    </Animated.View>
  );
}

function InstructionRow({ icon, text }) {
  return (
    <View style={styles.instrRow}>
      <Text style={styles.instrIcon}>{icon}</Text>
      <Text style={styles.instrText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0d1a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  decorRow: {
    flexDirection: 'row',
    position: 'absolute',
    top: 60,
    justifyContent: 'space-around',
    width: '100%',
  },
  decorEmoji: { fontSize: 40 },

  playerEmoji: {
    fontSize: 72,
    marginBottom: 14,
  },

  title: {
    color: '#FF6B6B',
    fontSize: 52,
    fontWeight: 'bold',
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 107, 107, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: '#4ECDC4',
    fontSize: 16,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },

  // Instructions box
  instructions: {
    backgroundColor: '#16163a',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  instrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  instrIcon: {
    fontSize: 18,
    width: 36,
    textAlign: 'center',
  },
  instrText: {
    color: '#c0c0e0',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },

  // Button
  startBtn: {
    backgroundColor: '#4ECDC4',
    borderRadius: 26,
    paddingVertical: 18,
    paddingHorizontal: 56,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  startText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 3,
  },

  version: {
    position: 'absolute',
    bottom: 30,
    color: '#2a2a4a',
    fontSize: 12,
  },
});

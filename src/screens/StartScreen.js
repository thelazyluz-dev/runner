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
import { T } from '../i18n/he';
import { RUBIK, RUBIK_BOLD } from '../utils/fonts';

const { width: W } = Dimensions.get('window');

export default function StartScreen({ onStart, onShop }) {
  const { state } = useGameStore();

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.5)).current;
  const btnScale   = useRef(new Animated.Value(1)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,   { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(titleScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -14, duration: 800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue:   0, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnScale, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        Animated.timing(btnScale, { toValue: 1,    duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      {/* Decorations */}
      <View style={styles.decorRow}>
        {['🌵', '🪨', '🌊', '🔥'].map((e, i) => (
          <Text key={i} style={[styles.decorEmoji, { opacity: 0.12 + i * 0.05 }]}>{e}</Text>
        ))}
      </View>

      {/* Coin balance */}
      <View style={styles.coinBar}>
        <Text style={[styles.coinText, RUBIK_BOLD && { fontFamily: RUBIK_BOLD }]}>🪙 {state.coins}</Text>
        {state.startShieldOwned && <Text style={styles.shieldTag}>🛡️</Text>}
        {state.extraLives > 0   && <Text style={styles.shieldTag}>❤️ ×{state.extraLives}</Text>}
      </View>

      {/* Floating player */}
      <Animated.Text style={[styles.playerEmoji, { transform: [{ translateY: floatAnim }] }]}>
        🏃
      </Animated.Text>

      {/* Title */}
      <Animated.View style={{ transform: [{ scale: titleScale }] }}>
        <Text style={[styles.title, RUBIK_BOLD && { fontFamily: RUBIK_BOLD }]}>{T.appTitle}</Text>
        <Text style={[styles.subtitle, RUBIK && { fontFamily: RUBIK }]}>{T.subtitle}</Text>
      </Animated.View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <InstructionRow icon="◀▶"  text={T.instrLanes} />
        <InstructionRow icon="🌵"  text={T.instrDodge} />
        <InstructionRow icon="🪙"  text={T.instrCoins} />
        <InstructionRow icon="🤔"  text={T.instrQuiz} />
        <InstructionRow icon="🔥"  text={T.instrCombo} />
      </View>

      {/* Buttons row */}
      <View style={styles.btnRow}>
        <Animated.View style={[styles.startWrap, { transform: [{ scale: btnScale }] }]}>
          <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.85}>
            <Text style={[styles.startText, RUBIK_BOLD && { fontFamily: RUBIK_BOLD }]}>{T.startGame}</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.shopBtn} onPress={onShop} activeOpacity={0.8}>
          <Text style={styles.shopText}>{T.openShop}</Text>
          <Text style={[styles.shopLabel, RUBIK_BOLD && { fontFamily: RUBIK_BOLD }]}>{T.shopLabel}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, RUBIK && { fontFamily: RUBIK }]}>{T.version}</Text>
    </Animated.View>
  );
}

function InstructionRow({ icon, text }) {
  return (
    <View style={styles.instrRow}>
      <Text style={styles.instrIcon}>{icon}</Text>
      <Text style={[styles.instrText, RUBIK && { fontFamily: RUBIK }]}>{text}</Text>
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

  // Coin bar
  coinBar: {
    position: 'absolute',
    top: 52,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
  shieldTag: {
    color: '#4ECDC4',
    fontSize: 13,
    marginLeft: 8,
    fontWeight: 'bold',
  },

  playerEmoji: { fontSize: 72, marginBottom: 14 },

  title: {
    color: '#FF6B6B',
    fontSize: 52,
    fontWeight: 'bold',
    letterSpacing: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(255,107,107,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    color: '#4ECDC4',
    fontSize: 15,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },

  instructions: {
    backgroundColor: '#16163a',
    borderRadius: 20,
    padding: 18,
    width: '100%',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#2a2a5a',
  },
  instrRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  instrIcon: { fontSize: 17, width: 32, textAlign: 'center' },
  instrText: { color: '#c0c0e0', fontSize: 13, marginLeft: 10, flex: 1 },

  // Buttons
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  startWrap: { flex: 1 },
  startBtn: {
    backgroundColor: '#4ECDC4',
    borderRadius: 22,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
    marginRight: 10,
  },
  startText: { color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 3 },

  shopBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    minWidth: 64,
  },
  shopText:  { fontSize: 22 },
  shopLabel: { color: '#0d0d1a', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },

  version: {
    position: 'absolute',
    bottom: 28,
    color: '#2a2a4a',
    fontSize: 12,
  },
});

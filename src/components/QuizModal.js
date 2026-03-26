import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
} from 'react-native';
import { T } from '../i18n/he';
import { RUBIK, RUBIK_BOLD } from '../utils/fonts';

const RESULT_DELAY_MS      = 650;  // how long to show correct/wrong highlight
const SECOND_CHANCE_DELAY  = 800;  // delay before showing "try again?" screen

export default function QuizModal({
  question,
  onAnswer,
  hasExtraLife   = false,
  onUseExtraLife = () => {},
}) {
  // ── phase: 'answering' | 'second_chance' ──────────────────────────────
  const [phase,          setPhase]         = useState('answering');
  const [selected,       setSelected]      = useState(null);
  const [answered,       setAnswered]      = useState(false);
  const [extraLifeUsed,  setExtraLifeUsed] = useState(false);
  const [flashColor,     setFlashColor]    = useState('#27ae60');

  // ── Animated values ───────────────────────────────────────────────────
  const slideAnim   = useRef(new Animated.Value(80)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const flashAnim   = useRef(new Animated.Value(0)).current;
  const shakeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnims  = useRef(question.answers.map(() => new Animated.Value(1))).current;
  // Second-chance card entrance
  const sc2Slide    = useRef(new Animated.Value(40)).current;
  const sc2Fade     = useRef(new Animated.Value(0)).current;

  // ── Entrance animation ────────────────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────
  const showGreenFlash = () => {
    setFlashColor('#27ae60');
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.45, duration: 80,  useNativeDriver: false }),
      Animated.timing(flashAnim, { toValue: 0,    duration: 350, useNativeDriver: false }),
    ]).start();
  };

  const showRedFlash = () => {
    setFlashColor('#c0392b');
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.5,  duration: 80,  useNativeDriver: false }),
      Animated.timing(flashAnim, { toValue: 0,    duration: 400, useNativeDriver: false }),
    ]).start();
    // Card shake
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   4, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const animateSecondChanceIn = () => {
    sc2Slide.setValue(40);
    sc2Fade.setValue(0);
    Animated.parallel([
      Animated.timing(sc2Fade,  { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(sc2Slide, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  };

  // ── Answer selection ──────────────────────────────────────────────────
  const handleSelect = (index) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);

    // Bounce the tapped answer
    Animated.sequence([
      Animated.timing(scaleAnims[index], { toValue: 1.1, duration: 70, useNativeDriver: true }),
      Animated.timing(scaleAnims[index], { toValue: 1,   duration: 70, useNativeDriver: true }),
    ]).start();

    const isCorrect = index === question.correctIndex;

    if (isCorrect) {
      showGreenFlash();
      setTimeout(() => onAnswer(true), RESULT_DELAY_MS);
    } else {
      showRedFlash();
      const canRetry = hasExtraLife && !extraLifeUsed;
      if (canRetry) {
        setTimeout(() => {
          setPhase('second_chance');
          animateSecondChanceIn();
        }, SECOND_CHANCE_DELAY);
      } else {
        setTimeout(() => onAnswer(false), RESULT_DELAY_MS);
      }
    }
  };

  // ── Try Again (consume extra life, reset question) ────────────────────
  const handleTryAgain = () => {
    setExtraLifeUsed(true);
    onUseExtraLife();
    setPhase('answering');
    setSelected(null);
    setAnswered(false);
    // Reset all answer scales
    scaleAnims.forEach((a) => a.setValue(1));
  };

  // ── Helpers for answer styling ────────────────────────────────────────
  const answerBg = (i) => {
    if (selected === null) return styles.ansDefault;
    if (i === question.correctIndex) return styles.ansCorrect;
    if (i === selected) return styles.ansWrong;
    return styles.ansDim;
  };
  const ansIcon = (i) => {
    if (selected === null) return null;
    if (i === question.correctIndex) return '✅ ';
    if (i === selected) return '❌ ';
    return null;
  };

  // ─────────────────────────────────────────────────────────────────────
  // SECOND CHANCE SCREEN
  // ─────────────────────────────────────────────────────────────────────
  if (phase === 'second_chance') {
    return (
      <Modal visible transparent animationType="none">
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              styles.scCard,
              { opacity: sc2Fade, transform: [{ translateY: sc2Slide }] },
            ]}
          >
            <Text style={styles.scEmoji}>❤️</Text>
            <Text style={[styles.scTitle, RUBIK_BOLD && { fontFamily: RUBIK_BOLD }]}>{T.extraLifeTitle}</Text>
            <Text style={[styles.scSub, RUBIK && { fontFamily: RUBIK }]}>{T.extraLifeSub}</Text>
            <Text style={[styles.scQuestion, RUBIK_BOLD && { fontFamily: RUBIK_BOLD }]}>{question.question}</Text>

            <TouchableOpacity
              style={styles.tryAgainBtn}
              onPress={handleTryAgain}
              activeOpacity={0.8}
            >
              <Text style={[styles.tryAgainText, RUBIK_BOLD && { fontFamily: RUBIK_BOLD }]}>{T.tryAgain}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.giveUpBtn}
              onPress={() => onAnswer(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.giveUpText, RUBIK && { fontFamily: RUBIK }]}>{T.giveUp}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // MAIN QUIZ SCREEN
  // ─────────────────────────────────────────────────────────────────────
  return (
    <Modal visible transparent animationType="none">
      {/* Full-screen flash overlay */}
      <Animated.View
        style={[styles.flashOverlay, { backgroundColor: flashColor, opacity: flashAnim }]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] },
          ]}
        >
          {/* Header */}
          <Text style={styles.headerEmoji}>🤔</Text>
          <Text style={[styles.headerTitle, RUBIK_BOLD && { fontFamily: RUBIK_BOLD }]}>
            {extraLifeUsed ? T.quizLastChance : T.quizHeader}
          </Text>
          <View style={styles.divider} />

          {/* Question */}
          <Text style={styles.question}>{question.question}</Text>

          {/* 2×2 answer grid */}
          <View style={styles.answersGrid}>
            {question.answers.map((ans, i) => (
              <Animated.View
                key={i}
                style={[styles.answerWrapper, { transform: [{ scale: scaleAnims[i] }] }]}
              >
                <TouchableOpacity
                  style={[styles.answerBtn, answerBg(i)]}
                  onPress={() => handleSelect(i)}
                  disabled={answered}
                  activeOpacity={0.8}
                >
                  <Text style={styles.answerText}>
                    {ansIcon(i)}{ans}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Status hint */}
          {!answered && (
            <Text style={[styles.hint, RUBIK && { fontFamily: RUBIK }]}>{T.tapAnswer}</Text>
          )}
          {answered && selected === question.correctIndex && (
            <Text style={[styles.hint, styles.hintCorrect, RUBIK_BOLD && { fontFamily: RUBIK_BOLD }]}>{T.correct}</Text>
          )}
          {answered && selected !== question.correctIndex && (
            <Text style={[styles.hint, styles.hintWrong, RUBIK_BOLD && { fontFamily: RUBIK_BOLD }]}>
              {hasExtraLife && !extraLifeUsed ? T.waitRetry : T.wrong}
            </Text>
          )}

          {/* Extra-life indicator */}
          {hasExtraLife && !extraLifeUsed && (
            <View style={styles.extraLifeBar}>
              <Text style={[styles.extraLifeText, RUBIK && { fontFamily: RUBIK }]}>{T.extraLifeAvail}</Text>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },

  // ── Main quiz card ──
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#16163a',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 14,
  },
  headerEmoji: { fontSize: 48, marginBottom: 6 },
  headerTitle: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  divider: {
    width: '80%',
    height: 1.5,
    backgroundColor: '#2a2a5a',
    marginVertical: 14,
  },
  question: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Answers 2×2
  answersGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  answerWrapper: { width: '48%', marginBottom: 10 },
  answerBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  ansDefault:  { backgroundColor: '#22224a', borderColor: '#4ECDC4' },
  ansCorrect:  { backgroundColor: '#0d5c2f', borderColor: '#27ae60' },
  ansWrong:    { backgroundColor: '#5c1313', borderColor: '#c0392b' },
  ansDim:      { backgroundColor: '#1a1a30', borderColor: '#2a2a4a', opacity: 0.4 },
  answerText:  { color: '#ffffff', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },

  // Hints
  hint:         { marginTop: 10, color: '#8888aa', fontSize: 13 },
  hintCorrect:  { color: '#27ae60', fontWeight: 'bold', fontSize: 15 },
  hintWrong:    { color: '#e74c3c', fontWeight: 'bold', fontSize: 15 },

  // Extra-life bar
  extraLifeBar: {
    marginTop: 10,
    backgroundColor: '#2a0a0a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  extraLifeText: { color: '#e74c3c', fontSize: 12, fontWeight: 'bold' },

  // ── Second-chance card ──
  scCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#16163a',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e74c3c',
    shadowColor: '#e74c3c',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 14,
  },
  scEmoji:    { fontSize: 52, marginBottom: 8 },
  scTitle:    { color: '#e74c3c', fontSize: 26, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  scSub:      { color: '#8888aa', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  scQuestion: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    backgroundColor: '#0f0f28',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
  },
  tryAgainBtn: {
    backgroundColor: '#27ae60',
    borderRadius: 18,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#27ae60',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  tryAgainText: { color: 'white', fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  giveUpBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  giveUpText: { color: '#555577', fontSize: 14, fontWeight: 'bold' },
});

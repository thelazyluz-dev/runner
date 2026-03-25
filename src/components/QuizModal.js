import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: W } = Dimensions.get('window');

const RESULT_DELAY_MS = 700;

export default function QuizModal({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  // Slide-up + fade-in entrance
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Per-answer scale animations (bounce on tap)
  const scaleAnims = useRef(
    question.answers.map(() => new Animated.Value(1))
  ).current;

  const handleSelect = (index) => {
    if (answered) return;
    setSelected(index);
    setAnswered(true);

    // Bounce the tapped answer
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 1.08,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const isCorrect = index === question.correctIndex;
    setTimeout(() => onAnswer(isCorrect), RESULT_DELAY_MS);
  };

  const answerBg = (index) => {
    if (selected === null) return styles.answerDefault;
    if (index === question.correctIndex) return styles.answerCorrect;
    if (index === selected) return styles.answerWrong;
    return styles.answerDim;
  };

  const answerIcon = (index) => {
    if (selected === null) return null;
    if (index === question.correctIndex) return '✅ ';
    if (index === selected) return '❌ ';
    return null;
  };

  return (
    <Modal visible transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <Text style={styles.headerEmoji}>🤔</Text>
          <Text style={styles.headerTitle}>QUICK! Answer to survive!</Text>
          <View style={styles.divider} />

          {/* Question */}
          <Text style={styles.question}>{question.question}</Text>

          {/* Answers */}
          <View style={styles.answersGrid}>
            {question.answers.map((ans, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.answerWrapper,
                  { transform: [{ scale: scaleAnims[i] }] },
                ]}
              >
                <TouchableOpacity
                  style={[styles.answerBtn, answerBg(i)]}
                  onPress={() => handleSelect(i)}
                  disabled={answered}
                  activeOpacity={0.8}
                >
                  <Text style={styles.answerText}>
                    {answerIcon(i)}
                    {ans}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Hint */}
          {!answered && (
            <Text style={styles.hint}>Tap an answer above!</Text>
          )}
          {answered && selected === question.correctIndex && (
            <Text style={[styles.hint, styles.hintCorrect]}>
              🎉 Correct! Keep running!
            </Text>
          )}
          {answered && selected !== question.correctIndex && (
            <Text style={[styles.hint, styles.hintWrong]}>
              💀 Wrong! Game over...
            </Text>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#16163a',
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },

  // Header
  headerEmoji: { fontSize: 50, marginBottom: 6 },
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

  // Question
  question: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 22,
  },

  // Answers grid (2 columns)
  answersGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  answerWrapper: {
    width: '48%',
    marginBottom: 10,
  },
  answerBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  answerDefault: {
    backgroundColor: '#22224a',
    borderColor: '#4ECDC4',
  },
  answerCorrect: {
    backgroundColor: '#0d5c2f',
    borderColor: '#27ae60',
  },
  answerWrong: {
    backgroundColor: '#5c1313',
    borderColor: '#c0392b',
  },
  answerDim: {
    backgroundColor: '#1a1a30',
    borderColor: '#2a2a4a',
    opacity: 0.45,
  },
  answerText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Hint
  hint: {
    marginTop: 10,
    color: '#8888aa',
    fontSize: 13,
  },
  hintCorrect: { color: '#27ae60', fontWeight: 'bold', fontSize: 15 },
  hintWrong: { color: '#e74c3c', fontWeight: 'bold', fontSize: 15 },
});

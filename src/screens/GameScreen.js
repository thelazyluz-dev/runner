import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  StyleSheet,
} from 'react-native';
import QuizModal from '../components/QuizModal';
import { QUESTIONS } from '../data/questions';
import { useGameStore, ACTIONS } from '../store/GameContext';

const { width: W, height: H } = Dimensions.get('window');

// ─── Layout ──────────────────────────────────────────────────────────────────
const HUD_HEIGHT    = 90;
const BUTTON_HEIGHT = 130;
const ROAD_HEIGHT   = H - HUD_HEIGHT - BUTTON_HEIGHT;

// ─── Lanes ───────────────────────────────────────────────────────────────────
const LANE_W       = W / 3;
const LANE_CENTERS = [LANE_W * 0.5, LANE_W * 1.5, LANE_W * 2.5];

// ─── Object sizes ─────────────────────────────────────────────────────────────
const PLAYER_W  = 50;
const PLAYER_H  = 60;
const OBS_W     = 52;
const OBS_H     = 52;
const COIN_SIZE = 32;

// Player's top-edge Y on the road (fixed)
const PLAYER_Y = ROAD_HEIGHT - PLAYER_H - 40;

// ─── Physics ──────────────────────────────────────────────────────────────────
const INITIAL_SPEED   = 5;
const MAX_SPEED       = 16;
const SPEED_UP_EVERY  = 8;   // score points between speed bumps

// ─── Timings (ms) ─────────────────────────────────────────────────────────────
const LOOP_MS        = 20;
const SPAWN_MS       = 1600;
const COIN_SPAWN_MS  = 2800;
const SCORE_MS       = 1000;
const LANE_ANIM_MS   = 160;

// ─── Combo thresholds ─────────────────────────────────────────────────────────
const COMBO_DOUBLE_COINS = 2;   // → double coins 5 s
const COMBO_SLOW_MO      = 3;   // → slow motion 2 s
const COMBO_SHIELD       = 4;   // → free shield

const DOUBLE_COINS_DURATION = 5000;
const SLOW_MO_DURATION      = 2000;
const SLOW_MO_FACTOR        = 0.55;

let _uid = 0;
const uid = () => ++_uid;

const OBS_EMOJIS  = ['🌵', '🪨', '🌊', '🔥', '❄️'];
const PLAYER_EMOJI = '🏃';
const COIN_EMOJI   = '🪙';

// ─── Component ────────────────────────────────────────────────────────────────
export default function GameScreen({ onGameOver }) {
  const { state: store, dispatch } = useGameStore();

  // ── Render state ────────────────────────────────────────────────────────
  const [obstacles,       setObstacles]       = useState([]);
  const [coins,           setCoins]           = useState([]);
  const [score,           setScore]           = useState(0);
  const [coinCount,       setCoinCount]       = useState(0);
  const [showQuiz,        setShowQuiz]        = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [roadFlash,       setRoadFlash]       = useState(false);
  const [playerBlinking,  setPlayerBlinking]  = useState(false);
  // Combo
  const [comboCount,    setComboCount]    = useState(0);
  // Power-ups
  const [hasShield,     setHasShield]     = useState(false);
  const [doubleCoins,   setDoubleCoins]   = useState(false);
  const [slowMo,        setSlowMo]        = useState(false);
  const [shieldBlocked, setShieldBlocked] = useState(false); // "SHIELD BLOCKED!" flash

  // ── Refs (no stale-closure problems in intervals) ────────────────────────
  const laneRef            = useRef(1);
  const pausedRef          = useRef(false);
  const obstaclesRef       = useRef([]);
  const coinsRef           = useRef([]);
  const scoreRef           = useRef(0);
  const coinCountRef       = useRef(0);
  const speedRef           = useRef(INITIAL_SPEED);
  const baseSpeedRef       = useRef(INITIAL_SPEED); // speed outside slow-mo
  const comboRef           = useRef(0);
  const shieldRef          = useRef(false);
  const doubleCoinsRef     = useRef(false);
  const slowMoRef          = useRef(false);
  const currentQuestionRef = useRef(null);
  const reviewQueueRef     = useRef([]);
  const doubleCoinsTimer   = useRef(null);
  const slowMoTimer        = useRef(null);
  const shieldGlowLoop     = useRef(null);

  // ── Animated values ──────────────────────────────────────────────────────
  // Player translate (left-edge X) & lane-switch scale pulse
  const playerTX         = useRef(new Animated.Value(LANE_CENTERS[1] - PLAYER_W / 2)).current;
  const playerScale      = useRef(new Animated.Value(1)).current;
  // Correct-answer bounce (multiplied with playerScale)
  const playerBounce     = useRef(new Animated.Value(1)).current;
  // Shield glow pulse (opacity of the ring)
  const shieldPulseAnim  = useRef(new Animated.Value(0)).current;
  // Road scrolling stripes
  const stripeY          = useRef(new Animated.Value(0)).current;

  // ── Keep reviewQueue ref in sync with the store ──────────────────────────
  useEffect(() => {
    reviewQueueRef.current = store.reviewQueue;
  }, [store.reviewQueue]);

  // ── Road stripe animation ─────────────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(stripeY, { toValue: 80, duration: 400, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Shield glow helpers ───────────────────────────────────────────────────
  const startShieldGlow = () => {
    shieldPulseAnim.setValue(0.3);
    shieldGlowLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shieldPulseAnim, { toValue: 1,   duration: 600, useNativeDriver: true }),
        Animated.timing(shieldPulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    );
    shieldGlowLoop.current.start();
  };

  const stopShieldGlow = () => {
    if (shieldGlowLoop.current) shieldGlowLoop.current.stop();
    shieldPulseAnim.setValue(0);
  };

  // ── Activate start-shield on mount (from purchased upgrade) ──────────────
  useEffect(() => {
    if (store.startShieldOwned) {
      shieldRef.current = true;
      setHasShield(true);
      startShieldGlow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Lane switch ──────────────────────────────────────────────────────────
  const switchLane = useCallback(
    (dir) => {
      if (pausedRef.current) return;
      const next = Math.max(0, Math.min(2, laneRef.current + dir));
      if (next === laneRef.current) return;
      laneRef.current = next;

      Animated.parallel([
        Animated.timing(playerTX, {
          toValue: LANE_CENTERS[next] - PLAYER_W / 2,
          duration: LANE_ANIM_MS,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(playerScale, { toValue: 1.2, duration: 80, useNativeDriver: true }),
          Animated.timing(playerScale, { toValue: 1,   duration: 80, useNativeDriver: true }),
        ]),
      ]).start();
    },
    [playerTX, playerScale]
  );

  // ── Collision handler ────────────────────────────────────────────────────
  const handleCollision = useCallback(
    (hitId) => {
      // Shield absorbs the hit
      if (shieldRef.current) {
        shieldRef.current = false;
        setHasShield(false);
        stopShieldGlow();

        // Remove the obstacle silently
        obstaclesRef.current = obstaclesRef.current.filter((o) => o.id !== hitId);
        setObstacles([...obstaclesRef.current]);

        // "SHIELD BLOCKED!" banner
        setShieldBlocked(true);
        setTimeout(() => setShieldBlocked(false), 900);
        return;
      }

      // Normal collision: pause + vibrate + flash
      pausedRef.current = true;
      Vibration.vibrate([0, 120, 80, 120]);
      setRoadFlash(true);
      setPlayerBlinking(true);
      setTimeout(() => setRoadFlash(false),    400);
      setTimeout(() => setPlayerBlinking(false), 400);

      obstaclesRef.current = obstaclesRef.current.filter((o) => o.id !== hitId);
      setObstacles([...obstaclesRef.current]);

      // Short dramatic pause, then quiz
      setTimeout(() => {
        const rq = reviewQueueRef.current;
        const q =
          rq.length > 0 && Math.random() < 0.3
            ? rq[Math.floor(Math.random() * rq.length)]
            : QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

        currentQuestionRef.current = q;
        setCurrentQuestion(q);
        setShowQuiz(true);
      }, 500);
    },
    [] // all deps are stable refs / stable setters
  );

  // ── Main game loop ────────────────────────────────────────────────────────
  useEffect(() => {
    // ── Frame loop ──
    const loop = setInterval(() => {
      if (pausedRef.current) return;

      const spd  = speedRef.current;
      const lane = laneRef.current;

      // Move obstacles
      const movedObs = obstaclesRef.current
        .map((o) => ({ ...o, y: o.y + spd }))
        .filter((o) => o.y < ROAD_HEIGHT + 100);

      // AABB collision check
      const hit = movedObs.find(
        (o) =>
          o.lane === lane &&
          o.y + OBS_H > PLAYER_Y &&
          o.y < PLAYER_Y + PLAYER_H
      );
      if (hit) {
        obstaclesRef.current = movedObs;
        handleCollision(hit.id);
        return;
      }
      obstaclesRef.current = movedObs;

      // Move coins
      const movedCoins = coinsRef.current
        .map((c) => ({ ...c, y: c.y + spd }))
        .filter((c) => c.y < ROAD_HEIGHT + 100);

      // Coin collection (respects double-coins power-up)
      let collected = 0;
      const remaining = movedCoins.filter((c) => {
        if (
          c.lane === lane &&
          c.y + COIN_SIZE > PLAYER_Y &&
          c.y < PLAYER_Y + PLAYER_H
        ) {
          collected++;
          return false;
        }
        return true;
      });
      if (collected > 0) {
        const earned = doubleCoinsRef.current ? collected * 2 : collected;
        coinCountRef.current += earned;
        setCoinCount(coinCountRef.current);
      }
      coinsRef.current = remaining;

      setObstacles([...obstaclesRef.current]);
      setCoins([...coinsRef.current]);
    }, LOOP_MS);

    // ── Obstacle spawner ──
    const spawnObs = setInterval(() => {
      if (pausedRef.current) return;
      const count  = Math.random() < 0.25 ? 2 : 1;
      const lanes  = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, count);
      lanes.forEach((l) => {
        obstaclesRef.current = [
          ...obstaclesRef.current,
          {
            id:    uid(),
            lane:  l,
            y:     -OBS_H - Math.random() * 60,
            emoji: OBS_EMOJIS[Math.floor(Math.random() * OBS_EMOJIS.length)],
          },
        ];
      });
    }, SPAWN_MS);

    // ── Coin spawner ──
    const spawnCoin = setInterval(() => {
      if (pausedRef.current) return;
      coinsRef.current = [
        ...coinsRef.current,
        { id: uid(), lane: Math.floor(Math.random() * 3), y: -COIN_SIZE },
      ];
    }, COIN_SPAWN_MS);

    // ── Score ticker + speed ramp ──
    const scoreTick = setInterval(() => {
      if (pausedRef.current) return;
      scoreRef.current += 1;
      setScore(scoreRef.current);

      // Only ramp base speed when not in slow-mo
      if (scoreRef.current % SPEED_UP_EVERY === 0 && !slowMoRef.current) {
        const next = Math.min(baseSpeedRef.current + 0.5, MAX_SPEED);
        baseSpeedRef.current = next;
        speedRef.current     = next;
      }
    }, SCORE_MS);

    return () => {
      clearInterval(loop);
      clearInterval(spawnObs);
      clearInterval(spawnCoin);
      clearInterval(scoreTick);
      clearTimeout(doubleCoinsTimer.current);
      clearTimeout(slowMoTimer.current);
    };
  }, [handleCollision]);

  // ── Quiz answer handler ───────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (isCorrect) => {
      setShowQuiz(false);

      if (isCorrect) {
        const newCombo = comboRef.current + 1;
        comboRef.current = newCombo;
        setComboCount(newCombo);

        // ── Combo rewards (trigger once at each threshold) ──
        if (newCombo === COMBO_DOUBLE_COINS) {
          doubleCoinsRef.current = true;
          setDoubleCoins(true);
          clearTimeout(doubleCoinsTimer.current);
          doubleCoinsTimer.current = setTimeout(() => {
            doubleCoinsRef.current = false;
            setDoubleCoins(false);
          }, DOUBLE_COINS_DURATION);
        }

        if (newCombo === COMBO_SLOW_MO) {
          baseSpeedRef.current = speedRef.current;
          speedRef.current     = speedRef.current * SLOW_MO_FACTOR;
          slowMoRef.current    = true;
          setSlowMo(true);
          clearTimeout(slowMoTimer.current);
          slowMoTimer.current = setTimeout(() => {
            speedRef.current  = baseSpeedRef.current;
            slowMoRef.current = false;
            setSlowMo(false);
          }, SLOW_MO_DURATION);
        }

        if (newCombo === COMBO_SHIELD && !shieldRef.current) {
          shieldRef.current = true;
          setHasShield(true);
          startShieldGlow();
        }

        // Player bounce on correct answer
        Animated.sequence([
          Animated.timing(playerBounce, { toValue: 1.35, duration: 100, useNativeDriver: true }),
          Animated.timing(playerBounce, { toValue: 1,    duration: 120, useNativeDriver: true }),
        ]).start();

        setCurrentQuestion(null);
        currentQuestionRef.current = null;
        pausedRef.current = false;

      } else {
        // Wrong – reset combo
        comboRef.current = 0;
        setComboCount(0);

        // Push to review queue for future re-appearance
        if (currentQuestionRef.current) {
          dispatch({
            type:     ACTIONS.ADD_TO_REVIEW,
            question: currentQuestionRef.current,
          });
        }
        setCurrentQuestion(null);
        currentQuestionRef.current = null;

        onGameOver(scoreRef.current, coinCountRef.current);
      }
    },
    [onGameOver, dispatch, playerBounce]
  );

  // ── Render helpers ────────────────────────────────────────────────────────
  const speedLevel = Math.floor(
    ((speedRef.current - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED)) * 5
  );

  const playerColorStyle = store.playerColor
    ? { backgroundColor: store.playerColor + '44', borderColor: store.playerColor, borderWidth: 2 }
    : null;

  return (
    <View style={styles.root}>
      {/* ── HUD ── */}
      <View style={styles.hud}>
        <View style={styles.hudBadge}>
          <Text style={styles.hudIcon}>⭐</Text>
          <Text style={styles.hudValue}>{score}</Text>
        </View>
        <View style={styles.hudCenter}>
          <Text style={styles.hudTitle}>RUNNER!</Text>
          <Text style={styles.speedLabel}>
            {'🔥'.repeat(Math.min(speedLevel, 5)) || '🏁'}
          </Text>
        </View>
        <View style={styles.hudBadge}>
          <Text style={styles.hudIcon}>🪙</Text>
          <Text style={styles.hudValue}>{coinCount}</Text>
        </View>
      </View>

      {/* ── Road ── */}
      <View style={[styles.road, roadFlash && styles.roadFlash]}>
        {/* Scrolling stripes */}
        <Animated.View
          style={[styles.stripesContainer, { transform: [{ translateY: stripeY }] }]}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <View key={`sl-${i}`} style={[styles.stripe, { left: LANE_W - 1.5,     top: i * 80 - 80 }]} />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <View key={`sr-${i}`} style={[styles.stripe, { left: LANE_W * 2 - 1.5, top: i * 80 - 40 }]} />
          ))}
        </Animated.View>

        {/* Lane borders */}
        <View style={[styles.laneBorder, { left: LANE_W     }]} />
        <View style={[styles.laneBorder, { left: LANE_W * 2 }]} />

        {/* Coins */}
        {coins.map((coin) => (
          <View
            key={coin.id}
            style={[styles.coin, { left: LANE_CENTERS[coin.lane] - COIN_SIZE / 2, top: coin.y }]}
          >
            <Text style={styles.coinText}>{COIN_EMOJI}</Text>
          </View>
        ))}

        {/* Obstacles */}
        {obstacles.map((obs) => (
          <View
            key={obs.id}
            style={[styles.obstacle, { left: LANE_CENTERS[obs.lane] - OBS_W / 2, top: obs.y }]}
          >
            <Text style={styles.obsText}>{obs.emoji}</Text>
          </View>
        ))}

        {/* ── Player ── */}
        <Animated.View
          style={[
            styles.player,
            {
              top:     PLAYER_Y,
              opacity: playerBlinking ? 0.15 : 1,
              transform: [
                { translateX: playerTX },
                { scale: Animated.multiply(playerScale, playerBounce) },
              ],
            },
          ]}
        >
          {/* Shield glow ring */}
          {hasShield && (
            <Animated.View style={[styles.shieldRing, { opacity: shieldPulseAnim }]} pointerEvents="none" />
          )}
          {/* Colour background */}
          <View style={[styles.playerBg, playerColorStyle]}>
            <Text style={styles.playerText}>{PLAYER_EMOJI}</Text>
          </View>
        </Animated.View>

        {/* ── Status overlay (combo + power-ups) ── */}
        <View style={styles.statusOverlay} pointerEvents="none">
          {comboCount >= 2 && (
            <View style={styles.comboBadge}>
              <Text style={styles.comboText}>
                {'🔥'.repeat(Math.min(comboCount, 4))}  COMBO ×{comboCount}
              </Text>
            </View>
          )}
          <View style={styles.powerupRow}>
            {doubleCoins && (
              <View style={[styles.powerupChip, { borderColor: '#FFD700' }]}>
                <Text style={styles.powerupChipText}>🪙×2</Text>
              </View>
            )}
            {slowMo && (
              <View style={[styles.powerupChip, { borderColor: '#4ECDC4' }]}>
                <Text style={styles.powerupChipText}>🐢 SLOW</Text>
              </View>
            )}
            {hasShield && (
              <Animated.View style={[styles.powerupChip, { borderColor: '#FFD700', opacity: shieldPulseAnim }]}>
                <Text style={styles.powerupChipText}>🛡️</Text>
              </Animated.View>
            )}
          </View>
          {shieldBlocked && (
            <View style={styles.shieldBlockBanner}>
              <Text style={styles.shieldBlockText}>🛡️ SHIELD BLOCKED!</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Controls ── */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.btn, styles.btnLeft]}
          onPress={() => switchLane(-1)}
          activeOpacity={0.75}
        >
          <Text style={styles.btnArrow}>◀</Text>
          <Text style={styles.btnLabel}>LEFT</Text>
        </TouchableOpacity>

        <View style={styles.btnDivider} />

        <TouchableOpacity
          style={[styles.btn, styles.btnRight]}
          onPress={() => switchLane(1)}
          activeOpacity={0.75}
        >
          <Text style={styles.btnLabel}>RIGHT</Text>
          <Text style={styles.btnArrow}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* ── Quiz Modal ── */}
      {showQuiz && currentQuestion && (
        <QuizModal
          question={currentQuestion}
          onAnswer={handleAnswer}
          hasExtraLife={store.extraLives > 0}
          onUseExtraLife={() => dispatch({ type: ACTIONS.USE_EXTRA_LIFE })}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d0d1a' },

  // HUD
  hud: {
    height: HUD_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#12122a',
    borderBottomWidth: 2,
    borderBottomColor: '#2a2a5a',
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e40',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 70,
  },
  hudIcon:  { fontSize: 18 },
  hudValue: { color: '#FFD700', fontWeight: 'bold', fontSize: 18, marginLeft: 4 },
  hudCenter: { alignItems: 'center' },
  hudTitle:  { color: '#FF6B6B', fontSize: 20, fontWeight: 'bold', letterSpacing: 3 },
  speedLabel: { fontSize: 14, marginTop: 2 },

  // Road
  road: {
    width: W,
    height: ROAD_HEIGHT,
    backgroundColor: '#1e1e2e',
    overflow: 'hidden',
    position: 'relative',
  },
  roadFlash: { backgroundColor: '#4a0808' },
  stripesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: W,
    height: ROAD_HEIGHT + 80,
  },
  stripe: {
    position: 'absolute',
    width: 3,
    height: 36,
    backgroundColor: '#FFD700',
    opacity: 0.35,
    borderRadius: 2,
  },
  laneBorder: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#2a2a5a',
  },

  // Player
  player: {
    position: 'absolute',
    left: 0,
    width: PLAYER_W,
    height: PLAYER_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerBg: {
    width: PLAYER_W,
    height: PLAYER_H,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  playerText: { fontSize: 44 },
  shieldRing: {
    position: 'absolute',
    width: PLAYER_W + 20,
    height: PLAYER_H + 20,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
    top: -10,
    left: -10,
  },

  // Obstacle / Coin
  obstacle: { position: 'absolute', width: OBS_W,     height: OBS_H,     justifyContent: 'center', alignItems: 'center' },
  obsText:  { fontSize: 40 },
  coin:     { position: 'absolute', width: COIN_SIZE, height: COIN_SIZE, justifyContent: 'center', alignItems: 'center' },
  coinText: { fontSize: 26 },

  // Status overlay
  statusOverlay: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  comboBadge: {
    backgroundColor: 'rgba(255,107,107,0.88)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 5,
  },
  comboText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  powerupRow: { flexDirection: 'row' },
  powerupChip: {
    backgroundColor: 'rgba(20,20,50,0.85)',
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginHorizontal: 3,
  },
  powerupChipText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  shieldBlockBanner: {
    marginTop: 8,
    backgroundColor: 'rgba(78,205,196,0.92)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  shieldBlockText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Controls
  controls: {
    height: BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12122a',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#2a2a5a',
  },
  btn: {
    flex: 1,
    height: 72,
    borderRadius: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnLeft:   { backgroundColor: '#4ECDC4' },
  btnRight:  { backgroundColor: '#FF6B6B' },
  btnDivider:{ width: 16 },
  btnArrow:  { color: 'white', fontSize: 20, marginHorizontal: 4 },
  btnLabel:  { color: 'white', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
});

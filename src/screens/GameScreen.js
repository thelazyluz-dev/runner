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

const { width: W, height: H } = Dimensions.get('window');

// ─── Layout ──────────────────────────────────────────────────────────────────
const HUD_HEIGHT = 90;
const BUTTON_HEIGHT = 130;
const ROAD_HEIGHT = H - HUD_HEIGHT - BUTTON_HEIGHT;

// ─── Lanes ───────────────────────────────────────────────────────────────────
const LANE_W = W / 3;
const LANE_CENTERS = [LANE_W * 0.5, LANE_W * 1.5, LANE_W * 2.5];

// ─── Object sizes ─────────────────────────────────────────────────────────────
const PLAYER_W = 50;
const PLAYER_H = 60;
const OBS_W = 52;
const OBS_H = 52;
const COIN_SIZE = 32;

// Player's top-edge Y on the road (fixed)
const PLAYER_Y = ROAD_HEIGHT - PLAYER_H - 40;

// ─── Physics ─────────────────────────────────────────────────────────────────
const INITIAL_SPEED = 5;
const MAX_SPEED = 16;
const SPEED_UP_EVERY = 8; // points

// ─── Timings (ms) ─────────────────────────────────────────────────────────────
const LOOP_MS = 20;
const SPAWN_MS = 1600;
const COIN_SPAWN_MS = 2800;
const SCORE_MS = 1000;
const LANE_ANIM_MS = 160;

let _uid = 0;
const uid = () => ++_uid;

const OBS_EMOJIS = ['🌵', '🪨', '🌊', '🔥', '❄️'];
const COIN_EMOJI = '🪙';
const PLAYER_EMOJI = '🏃';

export default function GameScreen({ onGameOver }) {
  // ─── Render state ────────────────────────────────────────────────────────
  const [obstacles, setObstacles] = useState([]);
  const [coins, setCoins] = useState([]);
  const [score, setScore] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [roadFlash, setRoadFlash] = useState(false);
  const [playerBlinking, setPlayerBlinking] = useState(false);

  // ─── Refs (avoid stale closures in intervals) ─────────────────────────────
  const laneRef = useRef(1);
  const pausedRef = useRef(false);
  const obstaclesRef = useRef([]);
  const coinsRef = useRef([]);
  const scoreRef = useRef(0);
  const coinCountRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);

  // ─── Player animation ─────────────────────────────────────────────────────
  // Animated value = translateX for the player's left edge
  const playerTX = useRef(
    new Animated.Value(LANE_CENTERS[1] - PLAYER_W / 2)
  ).current;
  // Scale pulse on lane switch
  const playerScale = useRef(new Animated.Value(1)).current;

  // ─── Road scroll stripes ──────────────────────────────────────────────────
  const stripeY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(stripeY, {
        toValue: 80,
        duration: 400,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ─── Lane switch ──────────────────────────────────────────────────────────
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
          Animated.timing(playerScale, {
            toValue: 1.2,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(playerScale, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    },
    [playerTX, playerScale]
  );

  // ─── Collision handler ────────────────────────────────────────────────────
  const handleCollision = useCallback(
    (hitId) => {
      pausedRef.current = true;
      Vibration.vibrate([0, 120, 80, 120]);

      // Flash road red
      setRoadFlash(true);
      setPlayerBlinking(true);
      setTimeout(() => setRoadFlash(false), 400);
      setTimeout(() => setPlayerBlinking(false), 400);

      // Remove the obstacle that hit
      obstaclesRef.current = obstaclesRef.current.filter((o) => o.id !== hitId);
      setObstacles([...obstaclesRef.current]);

      // Short pause before showing quiz
      setTimeout(() => {
        const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
        setCurrentQuestion(q);
        setShowQuiz(true);
      }, 500);
    },
    []
  );

  // ─── Main game loop ───────────────────────────────────────────────────────
  useEffect(() => {
    // Game loop
    const loop = setInterval(() => {
      if (pausedRef.current) return;
      const spd = speedRef.current;
      const lane = laneRef.current;

      // ── Move obstacles ──
      const movedObs = obstaclesRef.current
        .map((o) => ({ ...o, y: o.y + spd }))
        .filter((o) => o.y < ROAD_HEIGHT + 100);

      // ── AABB collision with player ──
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

      // ── Move coins ──
      const movedCoins = coinsRef.current
        .map((c) => ({ ...c, y: c.y + spd }))
        .filter((c) => c.y < ROAD_HEIGHT + 100);

      // ── Coin collection ──
      let collectedCount = 0;
      const remainingCoins = movedCoins.filter((c) => {
        if (
          c.lane === lane &&
          c.y + COIN_SIZE > PLAYER_Y &&
          c.y < PLAYER_Y + PLAYER_H
        ) {
          collectedCount++;
          return false;
        }
        return true;
      });
      if (collectedCount > 0) {
        coinCountRef.current += collectedCount;
        setCoinCount(coinCountRef.current);
      }
      coinsRef.current = remainingCoins;

      // ── Sync render state ──
      setObstacles([...obstaclesRef.current]);
      setCoins([...coinsRef.current]);
    }, LOOP_MS);

    // Obstacle spawner
    const spawnObs = setInterval(() => {
      if (pausedRef.current) return;
      // Occasionally spawn 2 obstacles in different lanes for challenge
      const numObs = Math.random() < 0.25 ? 2 : 1;
      const lanes = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, numObs);
      lanes.forEach((l) => {
        obstaclesRef.current = [
          ...obstaclesRef.current,
          {
            id: uid(),
            lane: l,
            y: -OBS_H - Math.random() * 60,
            emoji: OBS_EMOJIS[Math.floor(Math.random() * OBS_EMOJIS.length)],
          },
        ];
      });
    }, SPAWN_MS);

    // Coin spawner
    const spawnCoin = setInterval(() => {
      if (pausedRef.current) return;
      const l = Math.floor(Math.random() * 3);
      coinsRef.current = [
        ...coinsRef.current,
        { id: uid(), lane: l, y: -COIN_SIZE },
      ];
    }, COIN_SPAWN_MS);

    // Score ticker + speed ramp
    const scoreTick = setInterval(() => {
      if (pausedRef.current) return;
      scoreRef.current += 1;
      setScore(scoreRef.current);
      if (scoreRef.current % SPEED_UP_EVERY === 0) {
        speedRef.current = Math.min(speedRef.current + 0.5, MAX_SPEED);
      }
    }, SCORE_MS);

    return () => {
      clearInterval(loop);
      clearInterval(spawnObs);
      clearInterval(spawnCoin);
      clearInterval(scoreTick);
    };
  }, [handleCollision]);

  // ─── Quiz answer ──────────────────────────────────────────────────────────
  const handleAnswer = useCallback(
    (isCorrect) => {
      setShowQuiz(false);
      setCurrentQuestion(null);
      if (isCorrect) {
        pausedRef.current = false;
      } else {
        onGameOver(scoreRef.current, coinCountRef.current);
      }
    },
    [onGameOver]
  );

  // ─── Speed label ──────────────────────────────────────────────────────────
  const speedLevel = Math.floor(
    ((speedRef.current - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED)) * 10
  );

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
          style={[
            styles.stripesContainer,
            { transform: [{ translateY: stripeY }] },
          ]}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <View
              key={`sl-${i}`}
              style={[
                styles.stripe,
                { left: LANE_W - 1.5, top: i * 80 - 80 },
              ]}
            />
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <View
              key={`sr-${i}`}
              style={[
                styles.stripe,
                { left: LANE_W * 2 - 1.5, top: i * 80 - 40 },
              ]}
            />
          ))}
        </Animated.View>

        {/* Lane borders */}
        <View style={[styles.laneBorder, { left: LANE_W }]} />
        <View style={[styles.laneBorder, { left: LANE_W * 2 }]} />

        {/* Coins */}
        {coins.map((coin) => (
          <View
            key={coin.id}
            style={[
              styles.coin,
              {
                left: LANE_CENTERS[coin.lane] - COIN_SIZE / 2,
                top: coin.y,
              },
            ]}
          >
            <Text style={styles.coinText}>{COIN_EMOJI}</Text>
          </View>
        ))}

        {/* Obstacles */}
        {obstacles.map((obs) => (
          <View
            key={obs.id}
            style={[
              styles.obstacle,
              {
                left: LANE_CENTERS[obs.lane] - OBS_W / 2,
                top: obs.y,
              },
            ]}
          >
            <Text style={styles.obsText}>{obs.emoji}</Text>
          </View>
        ))}

        {/* Player */}
        <Animated.View
          style={[
            styles.player,
            {
              top: PLAYER_Y,
              opacity: playerBlinking ? 0.2 : 1,
              transform: [
                { translateX: playerTX },
                { scale: playerScale },
              ],
            },
          ]}
        >
          <Text style={styles.playerText}>{PLAYER_EMOJI}</Text>
        </Animated.View>
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
        <QuizModal question={currentQuestion} onAnswer={handleAnswer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d0d1a',
  },

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
  hudIcon: { fontSize: 18 },
  hudValue: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 4,
  },
  hudCenter: { alignItems: 'center' },
  hudTitle: {
    color: '#FF6B6B',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  speedLabel: { fontSize: 14, marginTop: 2 },

  // Road
  road: {
    width: W,
    height: ROAD_HEIGHT,
    backgroundColor: '#1e1e2e',
    overflow: 'hidden',
    position: 'relative',
  },
  roadFlash: {
    backgroundColor: '#4a0808',
  },
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
    width: PLAYER_W,
    height: PLAYER_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerText: { fontSize: 44 },

  // Obstacle
  obstacle: {
    position: 'absolute',
    width: OBS_W,
    height: OBS_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  obsText: { fontSize: 40 },

  // Coin
  coin: {
    position: 'absolute',
    width: COIN_SIZE,
    height: COIN_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinText: { fontSize: 26 },

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
  btnLeft: { backgroundColor: '#4ECDC4' },
  btnRight: { backgroundColor: '#FF6B6B' },
  btnDivider: { width: 16 },
  btnArrow: { color: 'white', fontSize: 20, marginHorizontal: 4 },
  btnLabel: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
});

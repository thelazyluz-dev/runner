import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GameProvider, useGameStore, ACTIONS } from './src/store/GameContext';
import StartScreen    from './src/screens/StartScreen';
import GameScreen     from './src/screens/GameScreen';
import GameOverScreen from './src/screens/GameOverScreen';
import ShopScreen     from './src/screens/ShopScreen';

// ─── Inner component (needs access to GameContext) ────────────────────────────
function AppContent() {
  const { dispatch } = useGameStore();

  const [screen,     setScreen]     = useState('start'); // start|game|gameover|shop
  const [gameKey,    setGameKey]    = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCoins, setFinalCoins] = useState(0);
  const [shopFrom,   setShopFrom]   = useState('start'); // which screen opened shop

  const goGame = useCallback(() => {
    setGameKey((k) => k + 1);
    setScreen('game');
  }, []);

  const handleGameOver = useCallback(
    (score, coins) => {
      // Persist the coins the player collected in this run
      dispatch({ type: ACTIONS.ADD_COINS, amount: coins });
      setFinalScore(score);
      setFinalCoins(coins);
      setScreen('gameover');
    },
    [dispatch]
  );

  const handleRestart = useCallback(() => {
    setFinalScore(0);
    setFinalCoins(0);
    setGameKey((k) => k + 1);
    setScreen('game');
  }, []);

  const openShop = useCallback((from) => {
    setShopFrom(from);
    setScreen('shop');
  }, []);

  const closeShop = useCallback(() => {
    setScreen(shopFrom);
  }, [shopFrom]);

  return (
    <>
      <StatusBar hidden />

      {screen === 'start' && (
        <StartScreen
          onStart={goGame}
          onShop={() => openShop('start')}
        />
      )}

      {screen === 'game' && (
        <GameScreen key={gameKey} onGameOver={handleGameOver} />
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          score={finalScore}
          coins={finalCoins}
          onRestart={handleRestart}
          onShop={() => openShop('gameover')}
        />
      )}

      {screen === 'shop' && <ShopScreen onBack={closeShop} />}
    </>
  );
}

// ─── Root: wrap everything with the global store ──────────────────────────────
export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

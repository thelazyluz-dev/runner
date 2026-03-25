import React, { useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import StartScreen from './src/screens/StartScreen';
import GameScreen from './src/screens/GameScreen';
import GameOverScreen from './src/screens/GameOverScreen';

export default function App() {
  const [screen, setScreen] = useState('start'); // 'start' | 'game' | 'gameover'
  const [gameKey, setGameKey] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [finalCoins, setFinalCoins] = useState(0);

  const handleStart = useCallback(() => {
    setGameKey((k) => k + 1);
    setScreen('game');
  }, []);

  const handleGameOver = useCallback((score, coins) => {
    setFinalScore(score);
    setFinalCoins(coins);
    setScreen('gameover');
  }, []);

  const handleRestart = useCallback(() => {
    setFinalScore(0);
    setFinalCoins(0);
    setGameKey((k) => k + 1);
    setScreen('game');
  }, []);

  return (
    <>
      <StatusBar hidden />
      {screen === 'start' && <StartScreen onStart={handleStart} />}
      {screen === 'game' && (
        <GameScreen key={gameKey} onGameOver={handleGameOver} />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          score={finalScore}
          coins={finalCoins}
          onRestart={handleRestart}
        />
      )}
    </>
  );
}

// LinearGradient wrapper with solid-color fallback.
// If expo-linear-gradient is not available, renders a plain View
// using the first color in the `colors` array.

import React from 'react';
import { View } from 'react-native';

let LinearGradient = null;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (_) {}

/**
 * <GradBox colors={['#4ECDC4','#2980b9']} start={{x:0,y:0}} end={{x:1,y:0}} style={...}>
 *   ...children
 * </GradBox>
 */
export default function GradBox({ colors = [], style, start, end, children }) {
  if (LinearGradient) {
    return (
      <LinearGradient colors={colors} start={start} end={end} style={style}>
        {children}
      </LinearGradient>
    );
  }
  return (
    <View style={[style, { backgroundColor: colors[0] ?? 'transparent' }]}>
      {children}
    </View>
  );
}

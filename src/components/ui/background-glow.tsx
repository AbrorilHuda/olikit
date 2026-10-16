import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useAppTheme } from '@/constants/theme';

export function BackgroundGlow() {
  const { tokens, isDark } = useAppTheme();

  // Solid hex base for SVG stops: rgba(120, 140, 175) -> #788caf
  const glowHex = '#788caf';

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { backgroundColor: tokens.bg }]}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Top-Left Ambient Glow (300px, 90px soft diffusion) */}
          <RadialGradient
            id="glowTopLeft"
            cx="20%"
            cy="12%"
            r="45%">
            <Stop
              offset="0%"
              stopColor={glowHex}
              stopOpacity={isDark ? 0.28 : 0.32}
            />
            <Stop
              offset="45%"
              stopColor={glowHex}
              stopOpacity={isDark ? 0.12 : 0.15}
            />
            <Stop
              offset="80%"
              stopColor={glowHex}
              stopOpacity={isDark ? 0.03 : 0.04}
            />
            <Stop offset="100%" stopColor={glowHex} stopOpacity={0} />
          </RadialGradient>

          {/* Bottom-Right Ambient Glow (320px, 100px soft diffusion) */}
          <RadialGradient
            id="glowBottomRight"
            cx="80%"
            cy="78%"
            r="48%">
            <Stop
              offset="0%"
              stopColor={glowHex}
              stopOpacity={isDark ? 0.20 : 0.24}
            />
            <Stop
              offset="50%"
              stopColor={glowHex}
              stopOpacity={isDark ? 0.08 : 0.10}
            />
            <Stop
              offset="80%"
              stopColor={glowHex}
              stopOpacity={isDark ? 0.02 : 0.03}
            />
            <Stop offset="100%" stopColor={glowHex} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Ambient Lighting Layers */}
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glowTopLeft)" />
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#glowBottomRight)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
});

import { BlurView } from 'expo-blur';
import React from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { Radius, useAppTheme } from '@/constants/theme';

export interface GlassViewProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  intensity?: number;
  noHighlight?: boolean;
  variant?: 'card' | 'modal' | 'subtle';
}

export function GlassView({
  children,
  style,
  contentStyle,
  borderRadius = Radius.card,
  intensity = 50,
  noHighlight = false,
  variant = 'card',
}: GlassViewProps) {
  const { tokens, isDark } = useAppTheme();

  const flattenedStyle = StyleSheet.flatten(style) || {};
  const isFlexOrHeight =
    flattenedStyle.flex !== undefined || flattenedStyle.height !== undefined;

  const isModal = variant === 'modal';

  // Surface background color calculation
  let surfaceBackground: string;
  if (isModal) {
    // Rich frosted glass sheet for modals so content is crystal clear, not transparent
    surfaceBackground = isDark
      ? 'rgba(22, 26, 35, 0.94)'
      : 'rgba(255, 255, 255, 0.95)';
  } else if (variant === 'subtle') {
    surfaceBackground = tokens.glassFillSubtle;
  } else if (Platform.OS === 'android') {
    // On Android, use authentic translucent liquid glass fill.
    // Native BlurView without BlurTargetView renders an opaque white fallback box.
    surfaceBackground = isDark
      ? 'rgba(22, 26, 35, 0.72)'
      : 'rgba(255, 255, 255, 0.82)';
  } else {
    surfaceBackground = tokens.glassFill;
  }

  // Shadow styling:
  // IMPORTANT FOR ANDROID: Never apply 'elevation' to transparent/translucent views!
  // Android's native ViewOutlineProvider creates an opaque white/gray backing box on elevated transparent views.
  const shadowStyle: ViewStyle = Platform.select({
    ios: {
      shadowColor: isDark ? '#000000' : '#141e32',
      shadowOffset: { width: 0, height: isModal ? 12 : 8 },
      shadowOpacity: isDark ? (isModal ? 0.45 : 0.32) : isModal ? 0.15 : 0.08,
      shadowRadius: isModal ? 26 : 18,
    },
    android: {
      // 0 elevation on Android prevents the white box outline bug!
      elevation: 0,
    },
    web: {
      boxShadow: isDark
        ? isModal
          ? '0 16px 40px rgba(0,0,0,0.50)'
          : '0 8px 28px rgba(0,0,0,0.35)'
        : isModal
          ? '0 16px 40px rgba(20,30,50,0.18)'
          : '0 8px 28px rgba(20,30,50,0.10)',
    } as any,
    default: {},
  });

  // BlurView is enabled for iOS and Web; on Android it causes white box fallback
  const enableNativeBlur = Platform.OS !== 'android';

  return (
    <View
      style={[
        styles.shadowContainer,
        { borderRadius },
        shadowStyle,
        style,
      ]}>
      {/* Clipped Glass Surface with concentric borders */}
      <View
        style={[
          styles.glassSurface,
          {
            borderRadius,
            borderColor: tokens.glassBorder,
            backgroundColor: surfaceBackground,
          },
          isFlexOrHeight && styles.fillSurface,
        ]}>
        {/* Native backdrop blur for iOS & Web */}
        {enableNativeBlur && (
          <BlurView
            intensity={intensity}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Crisp Top Specular Highlight (Rim lighting matching iOS Liquid Glass) */}
        {!noHighlight && (
          <View
            pointerEvents="none"
            style={[
              styles.specularHighlight,
              {
                borderTopColor: isModal
                  ? isDark
                    ? 'rgba(255, 255, 255, 0.35)'
                    : 'rgba(255, 255, 255, 0.90)'
                  : tokens.glassHighlight,
                borderTopLeftRadius: Math.max(0, borderRadius - 1),
                borderTopRightRadius: Math.max(0, borderRadius - 1),
              },
            ]}
          />
        )}

        {/* Content Layer */}
        <View
          style={[
            styles.content,
            isFlexOrHeight && styles.fillContent,
            contentStyle,
          ]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  glassSurface: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  fillSurface: {
    flex: 1,
    height: '100%',
  },
  specularHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    borderTopWidth: 1,
    zIndex: 2,
  },
  content: {
    zIndex: 3,
  },
  fillContent: {
    flex: 1,
  },
});

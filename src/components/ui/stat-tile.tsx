import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { GlassView } from './glass-view';
import { Radius, useAppTheme } from '@/constants/theme';

interface StatTileProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function StatTile({
  label,
  value,
  subValue,
  icon,
  onPress,
  style,
}: StatTileProps) {
  const { tokens } = useAppTheme();

  const handlePress = () => {
    if (onPress) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // ignore on web
      }
      onPress();
    }
  };

  const content = (
    <GlassView
      borderRadius={Radius.statTile}
      style={[styles.tile, style]}
      contentStyle={styles.content}>
      <View style={styles.topRow}>
        <Text
          style={[styles.label, { color: tokens.textMuted }]}
          numberOfLines={1}>
          {label.toUpperCase()}
        </Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>

      <Text
        style={[styles.value, { color: tokens.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {value}
      </Text>

      {subValue && (
        <Text
          style={[styles.subValue, { color: tokens.textSubtle }]}
          numberOfLines={1}>
          {subValue}
        </Text>
      )}
    </GlassView>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && { opacity: 0.82, transform: [{ scale: 0.985 }] },
        ]}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.wrapper}>{content}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  pressable: {
    flex: 1,
  },
  tile: {
    width: '100%',
    minHeight: 96,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  iconContainer: {
    opacity: 0.75,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subValue: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
});

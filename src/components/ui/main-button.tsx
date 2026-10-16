import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { Radius, useAppTheme } from '@/constants/theme';

interface MainButtonProps {
  title: string;
  onPress: () => void;
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: StyleProp<ViewStyle>;
}

export function MainButton({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: MainButtonProps) {
  const { tokens, isDark } = useAppTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // web ignore
    }
    onPress();
  };

  let bgColor: string = tokens.buttonFill;
  let textColor: string = tokens.onButton;
  let borderColor: string = 'transparent';

  if (variant === 'secondary') {
    bgColor = tokens.glassFill;
    textColor = tokens.text;
    borderColor = tokens.glassBorder;
  } else if (variant === 'danger') {
    bgColor = tokens.statusSegeraGantiFill;
    textColor = tokens.statusSegeraGanti;
    borderColor = tokens.statusSegeraGantiBorder;
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: borderColor === 'transparent' ? 0 : 1,
          opacity: disabled ? 0.45 : pressed ? 0.88 : 1,
          transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
          shadowColor: isDark ? '#000000' : '#141e32',
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    width: '100%',
    borderRadius: Radius.button,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
});

import * as Haptics from 'expo-haptics';
import { Clock, Home, PlusCircle } from 'lucide-react-native';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView } from './glass-view';
import { Radius, Spacing, useAppTheme } from '@/constants/theme';

export interface FloatingTabBarProps {
  state: {
    index: number;
    routes: { key: string; name: string; params?: Record<string, unknown> }[];
  };
  descriptors: Record<string, { options: Record<string, unknown> }>;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string, params?: Record<string, unknown>) => void;
  };
}

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: FloatingTabBarProps) {
  const { tokens, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  const bottomMargin = Math.max(Spacing.tabBarBottom, insets.bottom + 8);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.floatingContainer, { bottom: bottomMargin }]}>
      <GlassView
        borderRadius={Radius.tabBar}
        intensity={60}
        style={styles.glassBar}
        contentStyle={styles.barContent}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const options = descriptor ? descriptor.options : {};
          const isFocused = state.index === index;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options.title === 'string'
                ? options.title
                : route.name === 'index'
                  ? 'Beranda'
                  : route.name === 'catat'
                    ? 'Catat'
                    : 'Riwayat';

          const onPress = () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
              // ignore on web
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // Render icon based on route name
          const renderIcon = (color: string) => {
            const size = 20;
            const strokeWidth = isFocused ? 2.2 : 1.8;

            if (route.name === 'index') {
              return (
                <Home size={size} color={color} strokeWidth={strokeWidth} />
              );
            }
            if (route.name === 'catat') {
              return (
                <PlusCircle
                  size={size}
                  color={color}
                  strokeWidth={strokeWidth}
                />
              );
            }
            return (
              <Clock size={size} color={color} strokeWidth={strokeWidth} />
            );
          };

          const iconColor = isFocused
            ? tokens.text
            : isDark
              ? 'rgba(255,255,255,0.55)'
              : 'rgba(13,15,20,0.45)';

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              style={[
                styles.tabItem,
                isFocused && [
                  styles.activeTabItem,
                  {
                    backgroundColor: tokens.tabActive,
                    borderColor: isDark
                      ? 'rgba(255, 255, 255, 0.18)'
                      : 'rgba(13, 15, 20, 0.12)',
                  },
                ],
              ]}>
              {isFocused && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.activeTabHighlight,
                    {
                      borderTopColor: isDark
                        ? 'rgba(255, 255, 255, 0.35)'
                        : 'rgba(255, 255, 255, 0.90)',
                    },
                  ]}
                />
              )}
              {renderIcon(iconColor)}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? tokens.text : tokens.textMuted,
                    fontWeight: isFocused ? '600' : '500',
                  },
                ]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: Spacing.horizontal,
    right: Spacing.horizontal,
    alignItems: 'center',
    zIndex: 99,
  },
  glassBar: {
    width: '100%',
    maxWidth: 500,
    height: Spacing.tabBarHeight,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 22,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
      },
    }),
  },
  barContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tabItem: {
    flex: 1,
    height: '100%',
    borderRadius: Radius.tabBarActive,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
  },
  activeTabItem: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  activeTabHighlight: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    height: 1,
    borderTopWidth: 1,
    borderTopLeftRadius: Radius.tabBarActive,
    borderTopRightRadius: Radius.tabBarActive,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.2,
  },
});

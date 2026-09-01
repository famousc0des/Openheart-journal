import { Tabs } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CIRCLE_ICON, JOURNAL_ICON, MORE_ICON, PRAYER_ICON, TODAY_ICON } from '@/lib/tab-icons';
import { TabSvgIcon } from '@/components/ui/tab-svg-icon';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { hexToRgba } from '@/lib/color';

type GlassTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

function GlassTabBar({ state, descriptors, navigation }: GlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarPosition, { paddingBottom: Math.max(insets.bottom - 6, 4) }]}>
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        tintColor={theme.background}
        style={[
          styles.glassRail,
          {
            backgroundColor: hexToRgba(theme.background, 0.82),
            borderColor: hexToRgba(theme.text, 0.14),
            shadowColor: theme.text,
          },
        ]}>
        {state.routes.map((route, index) => {
          const options = descriptors[route.key].options;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [
                styles.tabToggle,
                isFocused
                  ? {
                      backgroundColor: theme.accent,
                      borderColor: hexToRgba(theme.text, 0.16),
                    }
                  : {
                      backgroundColor: hexToRgba(theme.backgroundElement, 0.88),
                      borderColor: hexToRgba(theme.text, 0.1),
                    },
                pressed && styles.tabTogglePressed,
              ]}>
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? '#FFFFFF' : theme.textSecondary,
                size: 29,
              })}
            </Pressable>
          );
        })}
      </GlassView>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <TabSvgIcon xml={TODAY_ICON} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => <TabSvgIcon xml={JOURNAL_ICON} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: 'Prayer',
          tabBarIcon: ({ color, size }) => <TabSvgIcon xml={PRAYER_ICON} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: 'Circle',
          tabBarIcon: ({ color, size }) => <TabSvgIcon xml={CIRCLE_ICON} color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <TabSvgIcon xml={MORE_ICON} color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarPosition: {
    position: 'absolute',
    right: 12,
    bottom: 0,
    left: 12,
    alignItems: 'center',
  },
  glassRail: {
    width: '100%',
    maxWidth: 430,
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    padding: 7,
    overflow: 'hidden',
    borderRadius: 38,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 12,
  },
  tabToggle: {
    flex: 1,
    maxWidth: 64,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tabTogglePressed: {
    transform: [{ scale: 0.94 }],
  },
});

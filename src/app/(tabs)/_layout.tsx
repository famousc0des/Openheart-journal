import { Tabs } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CIRCLE_ICON, JOURNAL_ICON, MORE_ICON, PRAYER_ICON, TODAY_ICON } from '@/lib/tab-icons';
import { TabSvgIcon } from '@/components/ui/tab-svg-icon';
import { useTheme, useThemeScheme } from '@/hooks/use-theme';
import { hexToRgba } from '@/lib/color';

type GlassTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

function GlassTabBar({ state, descriptors, navigation }: GlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scheme = useThemeScheme();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.tabBarPosition, { paddingBottom: Math.max(insets.bottom - 6, 4) }]}>
      <View
        style={[
          styles.glassRim,
          {
            borderColor: scheme === 'dark' ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.78)',
            backgroundColor: scheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.42)',
            shadowColor: scheme === 'dark' ? '#000000' : '#2A221C',
          },
        ]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={scheme}
          tintColor={theme.background}
          style={[
            styles.glassRail,
            {
              backgroundColor: hexToRgba(theme.background, 0.55),
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

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? options.title}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [
                styles.tabToggle,
                isFocused
                  ? { backgroundColor: theme.softFill, borderColor: theme.border }
                  : { backgroundColor: 'transparent', borderColor: 'transparent' },
                pressed ? styles.tabTogglePressed : null,
              ]}>
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? theme.accent : theme.textSecondary,
                size: 29,
              })}
            </Pressable>
          );
        })}
        </GlassView>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const scheme = useThemeScheme();
  const sceneFill = { flex: 1, backgroundColor: 'transparent' as const };
  const screenOptions = {
    headerShown: false,
    tabBarHideOnKeyboard: true,
    sceneStyle: sceneFill,
  };

  return (
    <View style={[styles.fill, sceneFill]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Tabs tabBar={(props) => <GlassTabBar {...props} />} screenOptions={screenOptions}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            sceneStyle: { flex: 1, backgroundColor: '#121212' },
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
            sceneStyle: { flex: 1, backgroundColor: 'transparent' },
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
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  tabBarPosition: {
    position: 'absolute',
    right: 12,
    bottom: 0,
    left: 12,
    alignItems: 'center',
  },
  glassRim: {
    width: '100%',
    maxWidth: 430,
    padding: 1.5,
    borderRadius: 40,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 14,
  },
  glassRail: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    padding: 7,
    overflow: 'hidden',
    borderRadius: 38,
  },
  tabToggle: {
    flex: 1,
    maxWidth: 64,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabTogglePressed: {
    transform: [{ scale: 0.94 }],
  },
});

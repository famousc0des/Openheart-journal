import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Colors, Fonts } from '@/constants/theme';
import { CircleIcon, JournalIcon, PrayerIcon, ProfileIcon, TodayIcon } from '@/lib/icons/navigation';
import { useTheme, useThemeScheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();
  const scheme = useThemeScheme();
  const sceneFill = { flex: 1, backgroundColor: Colors[scheme].background };

  return (
    <View style={[styles.fill, sceneFill]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          sceneStyle: sceneFill,
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarIconStyle: { transform: [{ translateY: 5 }] },
          tabBarLabelStyle: {
            fontFamily: Fonts.medium,
            fontSize: 11,
            lineHeight: 14,
          },
          tabBarStyle: {
            backgroundColor: theme.backgroundElement,
            borderTopColor: theme.border,
            borderTopWidth: StyleSheet.hairlineWidth,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Today',
            tabBarIcon: ({ color, size }) => <Icon icon={TodayIcon} color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: 'Journal',
            tabBarIcon: ({ color, size }) => <Icon icon={JournalIcon} color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="prayer"
          options={{
            title: 'Prayer',
            tabBarIcon: ({ color, size }) => <Icon icon={PrayerIcon} color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="circle"
          options={{
            title: 'Circle',
            tabBarIcon: ({ color, size }) => <Icon icon={CircleIcon} color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Icon icon={ProfileIcon} color={color} size={size} />,
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
});

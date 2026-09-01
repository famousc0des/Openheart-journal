import { DarkTheme, DefaultTheme, Stack, Theme, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

const LightNavTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.accent,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const DarkNavTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.accent,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          headerBackTitle: 'Back',
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sermon/index" options={{ headerShown: true, title: 'Sermon Notes' }} />
        <Stack.Screen name="bible/index" options={{ headerShown: true, title: 'Bible' }} />
        <Stack.Screen name="settings/appearance" options={{ headerShown: true, title: 'Appearance' }} />
        <Stack.Screen name="journal/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="journal/new" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="prayer/[id]" options={{ headerShown: true, title: 'Prayer' }} />
        <Stack.Screen
          name="prayer/new"
          options={{ headerShown: true, title: 'New Prayer', presentation: 'modal' }}
        />
        <Stack.Screen name="sermon/[id]" options={{ headerShown: true, title: 'Sermon Note' }} />
        <Stack.Screen
          name="sermon/new"
          options={{ headerShown: true, title: 'Capture Note', presentation: 'modal' }}
        />
      </Stack>
    </ThemeProvider>
  );
}

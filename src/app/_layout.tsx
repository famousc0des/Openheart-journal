import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, DarkTheme, DefaultTheme, Stack, Theme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Appearance, AppState, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppLockScreen } from '@/components/app-lock-screen';
import { AuthScreen, type AuthResult } from '@/components/auth-screen';
import { ChurchHoursOnboarding } from '@/components/church-hours-onboarding';
import { GrainSurface } from '@/components/grain-overlay';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { Colors, Fonts } from '@/constants/theme';
import { applyInterDefaults } from '@/lib/apply-inter';
import { useThemeScheme } from '@/hooks/use-theme';
import '@/lib/notifications';
import { CHURCH_CHECKIN_ROUTE, scheduleDummySundayNotification } from '@/lib/reminders';
import { useScalar, useScalarHydrated } from '@/lib/scalar-store';
import {
  accountEmailStore,
  accentOverrideStore,
  churchHoursStore,
  displayNameStore,
  hasAccountStore,
  hasOnboardedStore,
  isAuthenticatedStore,
  isLockedStore,
  pinEnabledStore,
  rememberMeStore,
  sessionAuthStore,
  showStartScreenStore,
  themePreferenceStore,
} from '@/lib/stores';

void SplashScreen.preventAutoHideAsync();

function navTheme(scheme: 'light' | 'dark'): Theme {
  const palette = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: scheme === 'dark',
    colors: {
      ...base.colors,
      primary: palette.accent,
      background: palette.background,
      card: palette.background,
      text: palette.text,
      border: palette.border,
    },
  };
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'SpotifyMixUI-Regular': require('../../assets/Spotify Mix UI/spotify_mix_ui_regular.otf'),
    'SpotifyMixUI-Bold': require('../../assets/Spotify Mix UI/spotify_mix_ui_bold.otf'),
    'SpotifyMixUI-TitleBold': require('../../assets/Spotify Mix UI/spotify_mix_ui_title_bold.otf'),
    'SpotifyMixUI-TitleExtraBold': require('../../assets/Spotify Mix UI/spotify_mix_ui_title_extrabold.otf'),
  });
  const scheme = useThemeScheme();
  const themePreference = useScalar(themePreferenceStore);
  const themeReady = useScalarHydrated(themePreferenceStore);
  const accentReady = useScalarHydrated(accentOverrideStore);
  const accountEmail = useScalar(accountEmailStore);
  const persistedAuth = useScalar(isAuthenticatedStore);
  const sessionAuth = useScalar(sessionAuthStore);
  const rememberMe = useScalar(rememberMeStore);
  const pinEnabled = useScalar(pinEnabledStore);
  const locked = useScalar(isLockedStore);
  const showStartScreen = useScalar(showStartScreenStore);
  const churchHours = useScalar(churchHoursStore);
  const churchHoursReady = useScalarHydrated(churchHoursStore);
  const isAuthenticated = sessionAuth || (rememberMe && persistedAuth);
  const hasOnboardedReady = useScalarHydrated(hasOnboardedStore);
  const hasAccountReady = useScalarHydrated(hasAccountStore);
  const accountEmailReady = useScalarHydrated(accountEmailStore);
  const isAuthenticatedReady = useScalarHydrated(isAuthenticatedStore);
  const rememberMeReady = useScalarHydrated(rememberMeStore);
  const pinReady = useScalarHydrated(pinEnabledStore);
  const authStateReady =
    hasOnboardedReady &&
    hasAccountReady &&
    accountEmailReady &&
    isAuthenticatedReady &&
    rememberMeReady &&
    pinReady &&
    churchHoursReady;
  const appReady = authStateReady && fontsLoaded && themeReady && accentReady;

  if (fontsLoaded) applyInterDefaults();

  useEffect(() => {
    if (appReady) void SplashScreen.hideAsync();
  }, [appReady]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(Colors[scheme].background);
    if (Platform.OS === 'web') {
      document.documentElement.dataset.theme = scheme;
      document.documentElement.style.colorScheme = scheme;
    }
  }, [scheme]);

  useEffect(() => {
    if (themeReady && Platform.OS !== 'web') {
      Appearance.setColorScheme(themePreference === 'system' ? 'unspecified' : themePreference);
    }
  }, [themePreference, themeReady]);

  useEffect(() => {
    if (!appReady || !pinEnabled || !isAuthenticated || sessionAuth) return;
    isLockedStore.set(true);
  }, [appReady, pinEnabled, isAuthenticated, sessionAuth]);

  useEffect(() => {
    if (!appReady || !isAuthenticated || !churchHours.asked) return;
    void scheduleDummySundayNotification();
  }, [appReady, isAuthenticated, churchHours.asked]);

  useEffect(() => {
    if (!appReady || !isAuthenticated || locked) return;

    function openFromNotification(notification: Notifications.Notification) {
      const route = notification.request.content.data?.route;
      if (route !== CHURCH_CHECKIN_ROUTE) return;
      router.push('/church/check-in');
      Notifications.clearLastNotificationResponse();
    }

    const last = Notifications.getLastNotificationResponse();
    if (last?.notification) openFromNotification(last.notification);

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromNotification(response.notification);
    });
    return () => sub.remove();
  }, [appReady, isAuthenticated, locked]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const remembered = rememberMeStore.getSnapshot() && isAuthenticatedStore.getSnapshot();
      if (next === 'background' && pinEnabledStore.getSnapshot() && (sessionAuthStore.getSnapshot() || remembered)) {
        isLockedStore.set(true);
      }
    });
    return () => sub.remove();
  }, []);

  function completeAuthentication(result: AuthResult) {
    if (result.mode === 'signUp' && result.name) void displayNameStore.set(result.name);
    void accountEmailStore.set(result.email);
    void hasAccountStore.set(true);
    void hasOnboardedStore.set(true);
    void rememberMeStore.set(result.rememberMe);
    void isAuthenticatedStore.set(result.rememberMe);
    sessionAuthStore.set(true);
    isLockedStore.set(false);
    showStartScreenStore.set(false);
  }

  function continueFromStartScreen() {
    void hasOnboardedStore.set(true);
    showStartScreenStore.set(false);
  }

  if (!appReady) return null;

  return (
    <GestureHandlerRootView style={styles.fill}>
    <ThemeProvider value={navTheme(scheme)}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <GrainSurface style={{ backgroundColor: Colors[scheme].background }}>
        {isAuthenticated && (
          <Stack
            screenOptions={{
              headerShown: false,
              headerBackTitle: '',
              headerBackButtonDisplayMode: 'minimal',
              headerStyle: { backgroundColor: Colors[scheme].background },
              headerShadowVisible: false,
              headerTintColor: Colors[scheme].text,
              headerTitleStyle: {
                fontFamily: Fonts.medium,
              },
              headerBackTitleStyle: {
                fontFamily: Fonts.regular,
              },
              contentStyle: { backgroundColor: Colors[scheme].background },
              animation: 'slide_from_right',
              freezeOnBlur: false,
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="sermon/index" options={{ headerShown: true, title: 'Sermon Notes' }} />
            <Stack.Screen name="bible/index" options={{ headerShown: true, title: 'Bible' }} />
            <Stack.Screen
              name="circle/new"
              options={{ headerShown: true, title: 'New Circle', presentation: 'modal' }}
            />
            <Stack.Screen
              name="circle/invite"
              options={{ headerShown: true, title: 'Circle Invitation', presentation: 'modal' }}
            />
            <Stack.Screen name="circle/[id]" options={{ headerShown: true, title: 'Circle' }} />
            <Stack.Screen name="circle/share/[id]" options={{ headerShown: false, title: 'Comment' }} />
            <Stack.Screen
              name="church/new"
              options={{ headerShown: true, title: 'Start a Church', presentation: 'modal' }}
            />
            <Stack.Screen
              name="church/join"
              options={{ headerShown: true, title: 'Join a Church', presentation: 'modal' }}
            />
            <Stack.Screen name="church/[id]" options={{ headerShown: true, title: 'Church' }} />
            <Stack.Screen
              name="church/check-in"
              options={{ headerShown: true, title: 'How was church?', presentation: 'modal' }}
            />
            <Stack.Screen name="vault/index" options={{ headerShown: true, title: 'Vault' }} />
            <Stack.Screen name="vault/new" options={{ headerShown: true, title: 'Add to vault', presentation: 'modal' }} />
            <Stack.Screen name="vault/[id]" options={{ headerShown: true, title: 'Vault' }} />
            <Stack.Screen name="settings/appearance" options={{ headerShown: true, title: 'Appearance' }} />
            <Stack.Screen name="settings/lock" options={{ headerShown: true, title: 'App lock' }} />
            <Stack.Screen name="settings/notifications" options={{ headerShown: true, title: 'Notifications' }} />
            <Stack.Screen name="profile/edit" options={{ headerShown: true, title: 'Edit Profile' }} />
            <Stack.Screen name="legal/terms" options={{ headerShown: true, title: 'Terms of Service' }} />
            <Stack.Screen name="legal/privacy" options={{ headerShown: true, title: 'Privacy Policy' }} />
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
        )}
        {!isAuthenticated && (
          <View style={styles.onboarding}>
            {showStartScreen ? (
              <OnboardingScreen onGetStarted={continueFromStartScreen} />
            ) : (
              <AuthScreen
                initialMode="signIn"
                savedEmail={accountEmail}
                onComplete={completeAuthentication}
              />
            )}
          </View>
        )}
        {isAuthenticated && churchHoursReady && !churchHours.asked && !(pinEnabled && locked) && (
          <View style={styles.hoursLayer}>
            <ChurchHoursOnboarding onDone={() => {}} />
          </View>
        )}
        {isAuthenticated && pinEnabled && locked && (
          <View style={styles.lockLayer}>
            <AppLockScreen />
          </View>
        )}
      </GrainSurface>
    </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: '100%' },
  onboarding: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  hoursLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
  },
  lockLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
});

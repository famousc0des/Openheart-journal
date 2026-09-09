import { NamedIcon } from '@/components/ui/icon';
import { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LegalDocument } from "@/components/legal-document";
import { ThemedText } from "@/components/themed-text";
import { Fonts, Radius, Spacing, Tracking } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { clearAllAppData } from "@/lib/app-data";
import { PRIVACY_BODY, PRIVACY_TITLE, TERMS_BODY, TERMS_TITLE } from "@/lib/legal";
import { createLocalAccount } from "@/lib/local-account";

type AuthMode = "signUp" | "signIn";
export type AuthResult = {
  mode: AuthMode;
  email: string;
  name: string;
  rememberMe: boolean;
};
type LegalView = "none" | "terms" | "privacy";

export function AuthScreen({
  initialMode,
  savedEmail,
  onComplete,
}: {
  initialMode: AuthMode;
  savedEmail: string;
  onComplete: (result: AuthResult) => void;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState(savedEmail);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [legalView, setLegalView] = useState<LegalView>("none");
  const formOpacity = useRef(new Animated.Value(1)).current;
  const setupOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0.9)).current;

  const isSignUp = mode === "signUp";
  const canSubmit = email.trim().length > 0 && password.length > 0;

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setAcceptedTerms(false);
  }

  async function submit() {
    if (!canSubmit || isSettingUp) return;

    try {
      await createLocalAccount(email, password);
    } catch {
      // Prototype has no backend; continue even if local storage fails.
    }

    setIsSettingUp(true);
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(setupOpacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        damping: 9,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() =>
      onComplete({
        mode,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        rememberMe,
      }),
    );
  }

  function forgotPassword() {
    Alert.alert(
      "Forgot password",
      "This account lives only on this device, so there is no email reset. You can erase everything here and start over.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Erase everything",
          style: "destructive",
          onPress: () => {
            void clearAllAppData().then(() => {
              setEmail("");
              setPassword("");
              setName("");
              setMode("signUp");
            });
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.authBackdrop]}>
      <View style={[styles.authPanel]}>
        <SafeAreaView style={styles.fill}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.fill}
          >
            <Animated.View
              pointerEvents={isSettingUp ? "none" : "auto"}
              style={[styles.fill, { opacity: formOpacity }]}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {(isSignUp || legalView !== "none") && (
                  <Pressable
                    accessibilityLabel={
                      legalView !== "none" ? "Go back" : "Go back to login"
                    }
                    onPress={() =>
                      legalView !== "none"
                        ? setLegalView("none")
                        : switchMode("signIn")
                    }
                    style={({ pressed }) => [
                      styles.backButton,
                      {
                        backgroundColor: theme.backgroundElement,
                        opacity: pressed ? 0.65 : 1,
                      },
                    ]}
                  >
                    <NamedIcon
                      name="chevron-back"
                      size={25}
                      color={theme.text}
                    />
                  </Pressable>
                )}

                {legalView !== "none" ? (
                  <LegalDocument
                    title={legalView === "terms" ? TERMS_TITLE : PRIVACY_TITLE}
                    body={legalView === "terms" ? TERMS_BODY : PRIVACY_BODY}
                  />
                ) : (
                  <>
                <View style={[styles.intro, isSignUp && styles.introAfterBack]}>
                  <ThemedText style={styles.welcomeTitle}>
                    {isSignUp ? "Create Your" : "Welcome To"}
                  </ThemedText>
                  <ThemedText style={styles.welcomeTitle}>
                    {isSignUp ? "Openheart Space" : "Openheart"}
                  </ThemedText>
                  <ThemedText
                    themeColor="textSecondary"
                    style={styles.introCopy}
                  >
                    {isSignUp
                      ? "Create an account to keep your prayers, reflections, and journal private."
                      : "Enter your credentials to access your private Openheart journal."}
                  </ThemedText>
                </View>

                <View style={styles.form}>
                  {isSignUp && (
                    <>
                      <AuthFieldLabel>Your name</AuthFieldLabel>
                      <View
                        style={[
                          styles.inputShell,
                          {
                            backgroundColor: theme.backgroundElement,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <TextInput
                          accessibilityLabel="Your name"
                          autoCapitalize="words"
                          autoComplete="name"
                          placeholder="What should we call you?"
                          placeholderTextColor={theme.textSecondary}
                          value={name}
                          onChangeText={setName}
                          style={[styles.input, { color: theme.text }]}
                        />
                        <NamedIcon
                          name="person-outline"
                          size={23}
                          color={theme.textSecondary}
                        />
                      </View>
                    </>
                  )}

                  <AuthFieldLabel>Email Address</AuthFieldLabel>
                  <View
                    style={[
                      styles.inputShell,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <TextInput
                      accessibilityLabel="Email address"
                      autoCapitalize="none"
                      autoComplete="email"
                      inputMode="email"
                      keyboardType="email-address"
                      placeholder="you@example.com"
                      placeholderTextColor={theme.textSecondary}
                      value={email}
                      onChangeText={setEmail}
                      style={[styles.input, { color: theme.text }]}
                    />
                    <NamedIcon
                      name="mail-outline"
                      size={23}
                      color={theme.textSecondary}
                    />
                  </View>

                  <AuthFieldLabel>Password</AuthFieldLabel>
                  <View
                    style={[
                      styles.inputShell,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <TextInput
                      accessibilityLabel="Password"
                      autoCapitalize="none"
                      autoComplete={
                        isSignUp ? "new-password" : "current-password"
                      }
                      placeholder="Enter your password"
                      placeholderTextColor={theme.textSecondary}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      style={[styles.input, { color: theme.text }]}
                    />
                    <PasswordToggle
                      visible={showPassword}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  </View>

                  {!isSignUp && (
                    <View style={styles.rememberRow}>
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: rememberMe }}
                        onPress={() => setRememberMe(!rememberMe)}
                        style={styles.rememberToggle}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: rememberMe
                                ? theme.text
                                : "transparent",
                              borderColor: theme.text,
                            },
                          ]}
                        >
                          {rememberMe && (
                            <NamedIcon
                              name="checkmark"
                              size={15}
                              color={theme.background}
                            />
                          )}
                        </View>
                        <ThemedText
                          themeColor="textSecondary"
                          style={styles.rememberText}
                        >
                          Remember Me
                        </ThemedText>
                      </Pressable>
                      <Pressable onPress={forgotPassword} hitSlop={8}>
                        <ThemedText
                          type="smallBold"
                          style={{ color: theme.accent }}
                        >
                          Forgot Password
                        </ThemedText>
                      </Pressable>
                    </View>
                  )}

                  {isSignUp && (
                    <>
                      <AuthFieldLabel>Confirm Password</AuthFieldLabel>
                      <View
                        style={[
                          styles.inputShell,
                          {
                            backgroundColor: theme.backgroundElement,
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <TextInput
                          accessibilityLabel="Confirm password"
                          autoCapitalize="none"
                          autoComplete="new-password"
                          placeholder="Re-enter your password"
                          placeholderTextColor={theme.textSecondary}
                          secureTextEntry={!showPassword}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          onSubmitEditing={() => void submit()}
                          style={[styles.input, { color: theme.text }]}
                        />
                        <PasswordToggle
                          visible={showPassword}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      </View>

                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: acceptedTerms }}
                        onPress={() => setAcceptedTerms(!acceptedTerms)}
                        style={styles.termsRow}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: acceptedTerms
                                ? theme.text
                                : "transparent",
                              borderColor: theme.text,
                            },
                          ]}
                        >
                          {acceptedTerms && (
                            <NamedIcon
                              name="checkmark"
                              size={15}
                              color={theme.background}
                            />
                          )}
                        </View>
                        <ThemedText
                          themeColor="textSecondary"
                          style={styles.termsText}
                        >
                          I agree to Openheart’s{" "}
                          <ThemedText
                            type="smallBold"
                            onPress={() => setLegalView("terms")}
                          >
                            Terms of Service
                          </ThemedText>{" "}
                          and{" "}
                          <ThemedText
                            type="smallBold"
                            onPress={() => setLegalView("privacy")}
                          >
                            Privacy Policy
                          </ThemedText>
                          .
                        </ThemedText>
                      </Pressable>
                    </>
                  )}

                  <Pressable
                    accessibilityRole="button"
                    disabled={!canSubmit}
                    onPress={() => void submit()}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      {
                        backgroundColor: theme.primary,
                        opacity: canSubmit ? (pressed ? 0.82 : 1) : 0.35,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.primaryButtonText,
                        { color: theme.onPrimary },
                      ]}
                    >
                      {isSignUp ? "Sign up" : "Log in"}
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => switchMode(isSignUp ? "signIn" : "signUp")}
                    style={styles.switchAction}
                  >
                    <ThemedText style={styles.switchText}>
                      {isSignUp
                        ? "Already have an account? "
                        : "New to Openheart? "}
                      <ThemedText
                        type="smallBold"
                        style={{ color: theme.accent }}
                      >
                        {isSignUp ? "Log In" : "Create Account"}
                      </ThemedText>
                    </ThemedText>
                  </Pressable>
                </View>
                  </>
                )}
              </ScrollView>
            </Animated.View>

            {isSettingUp && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.setupLayer,
                  { backgroundColor: theme.background, opacity: setupOpacity },
                ]}
              >
                <Animated.View
                  style={[
                    styles.setupHeart,
                    { transform: [{ scale: heartScale }] },
                  ]}
                >
                  <NamedIcon name="heart" size={38} color={theme.accent} />
                </Animated.View>
                <ThemedText style={styles.setupTitle}>
                  Setting up your journal…
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.setupSubtitle}>
                  Preparing your private space
                </ThemedText>
                <View style={styles.progressTrack}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                </View>
              </Animated.View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </View>
  );
}

function AuthFieldLabel({ children }: { children: string }) {
  return <ThemedText style={styles.fieldLabel}>{children}</ThemedText>;
}

function PasswordToggle({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityLabel={visible ? "Hide password" : "Show password"}
      hitSlop={12}
      onPress={onPress}
    >
      <NamedIcon
        name="eye-off-outline"
        altName="eye-outline"
        showAlt={visible}
        size={24}
        color={theme.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  authBackdrop: { flex: 1, paddingHorizontal: 4 },
  authPanel: {
    flex: 1,
    overflow: "hidden",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 26,
    paddingTop: 12,
    paddingBottom: 28,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  intro: { marginTop: 16, marginBottom: 24 },
  introAfterBack: { marginTop: 12 },
  welcomeTitle: {
    fontFamily: Fonts.regular,
    fontSize: 30,
    lineHeight: 40,
    letterSpacing: Tracking.heading,
  },
  introCopy: { maxWidth: 410, marginTop: 8, fontSize: 14, lineHeight: 20 },
  form: { gap: 10 },
  fieldLabel: {
    marginTop: 2,
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  inputShell: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.medium,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    height: 52,
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 0,
    paddingRight: 10,
    margin: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  rememberRow: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  rememberToggle: { flexDirection: "row", alignItems: "center" },
  rememberText: { fontSize: 14, lineHeight: 20, marginLeft: 2 },
  termsRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    marginRight: 8,
  },
  termsText: { flex: 1, fontSize: 12, lineHeight: 17 },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
    marginTop: 6,
  },
  primaryButtonText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: Tracking.body,
  },
  switchAction: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  switchText: { textAlign: "center", fontSize: 14, lineHeight: 20 },
  setupLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.five,
  },
  setupHeart: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(59,130,246,0.25)",
    backgroundColor: "rgba(59,130,246,0.1)",
  },
  setupTitle: {
    fontFamily: Fonts.regular,
    fontSize: 25,
    lineHeight: 34,
    letterSpacing: Tracking.heading,
    textAlign: "center",
    marginTop: Spacing.four,
  },
  setupSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: Spacing.one,
  },
  progressTrack: {
    width: "100%",
    maxWidth: 280,
    height: 5,
    overflow: "hidden",
    borderRadius: Radius.pill,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginTop: Spacing.four,
  },
  progressFill: {
    height: "100%",
    borderRadius: Radius.pill,
    backgroundColor: "#3B82F6",
  },
});

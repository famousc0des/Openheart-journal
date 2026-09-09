import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';

import { PressScale } from '@/components/press-scale';
import { ProfileAvatar } from '@/components/profile-avatar';
import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { promptProfilePhoto } from '@/lib/pick-profile-photo';
import { useScalar } from '@/lib/scalar-store';
import { displayNameStore, profileLocationStore, profilePhotoUriStore } from '@/lib/stores';

export default function EditProfileScreen() {
  const theme = useTheme();
  const savedName = useScalar(displayNameStore);
  const savedPhoto = useScalar(profilePhotoUriStore);
  const savedLocation = useScalar(profileLocationStore);
  const [name, setName] = useState(savedName);
  const [location, setLocation] = useState(savedLocation);
  const [photoUri, setPhotoUri] = useState(savedPhoto);

  useEffect(() => {
    setName(savedName);
    setLocation(savedLocation);
    setPhotoUri(savedPhoto);
  }, [savedName, savedLocation, savedPhoto]);

  async function save() {
    await displayNameStore.set(name.trim());
    await profileLocationStore.set(location.trim());
    await profilePhotoUriStore.set(photoUri);
    router.back();
  }

  return (
    <Screen insetTop={false} keyboardShouldPersistTaps="handled">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.avoid}>
        <View style={styles.identity}>
          <ProfileAvatar
            uri={photoUri}
            name={name}
            onPress={() => promptProfilePhoto(setPhotoUri, photoUri ? () => setPhotoUri('') : undefined)}
          />
          <ThemedText type="small" themeColor="textSecondary">
            Tap the photo to choose a new one. Changes save when you confirm.
          </ThemedText>
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Name</ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel="Name"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Location</ThemedText>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Add where you are"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="words"
            returnKeyType="done"
            accessibilityLabel="Location"
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
          />
        </View>

        <PressScale
          accessibilityRole="button"
          accessibilityLabel="Save profile"
          onPress={() => void save()}
          style={[styles.save, { backgroundColor: theme.primary }]}>
          <ThemedText type="smallBold" style={{ color: theme.onPrimary, textAlign: 'center' }}>
            Save
          </ThemedText>
        </PressScale>
        <PressScale accessibilityRole="button" accessibilityLabel="Cancel" onPress={() => router.back()} style={styles.cancel}>
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            Cancel
          </ThemedText>
        </PressScale>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avoid: {
    gap: Spacing.four,
  },
  identity: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    fontFamily: Fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
  },
  save: {
    minHeight: 52,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  cancel: {
    minHeight: 44,
    justifyContent: 'center',
  },
});

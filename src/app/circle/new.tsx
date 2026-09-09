import { NamedIcon } from '@/components/ui/icon';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Fonts, Radius, Spacing, Tracking } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { circleCoverSource } from '@/lib/circle-covers';
import { circleLimitError } from '@/lib/circle-membership';
import { createId } from '@/lib/id';
import { circlesStore } from '@/lib/stores';

const CREAM = '#F6F3EE';

export default function NewCircleScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [limitDraft, setLimitDraft] = useState('');
  const limitError = circleLimitError(limitDraft, 0);
  const [coverUri, setCoverUri] = useState<string | undefined>();
  const canCreate = name.trim().length > 0 && !limitError;

  function createCircle() {
    if (!canCreate) return;
    const circle = {
      id: createId(),
      createdAt: new Date().toISOString(),
      name: name.trim(),
      kind: 'custom' as const,
      memberLimit: limitDraft.trim() ? Number(limitDraft.trim()) : null,
      ...(coverUri ? { coverUri } : {}),
    };
    circlesStore.add(circle);
    router.back();
  }

  async function pickCover(fromCamera: boolean) {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        fromCamera ? 'Camera is closed' : 'Photos are closed',
        'Turn on access in Settings to add a cover to this circle.'
      );
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });

    if (result.canceled) return;
    const uri = result.assets[0]?.uri;
    if (!uri) {
      Alert.alert('Could not add that photo', 'Try another picture.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCoverUri(uri);
  }

  function openCoverPicker() {
    Alert.alert('Circle cover', undefined, [
      { text: 'Take photo', onPress: () => void pickCover(true) },
      { text: 'Choose from library', onPress: () => void pickCover(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <ThemedText type="title">Create a circle</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Name it. The cover is optional — skip it and the card keeps this photo.
        </ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={coverUri ? 'Change circle cover' : 'Choose a circle cover'}
        accessibilityHint="Opens the camera or photo library"
        onPress={openCoverPicker}
        style={({ pressed }) => [
          styles.coverFrame,
          { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
          pressed && styles.coverPressed,
        ]}>
        <Image
          recyclingKey={coverUri ?? 'default'}
          source={circleCoverSource(coverUri)}
          style={styles.coverPhoto}
          contentFit="cover"
          contentPosition="center"
          transition={120}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['transparent', 'rgba(0,0,0,0.52)']}
          locations={[0.45, 1]}
          style={styles.coverScrim}
        />
        <View style={styles.coverBar} pointerEvents="none">
          <View style={styles.coverCopy}>
            <Text style={styles.coverKicker}>Cover</Text>
            <Text style={styles.coverState}>{coverUri ? 'Your photo' : 'Default'}</Text>
          </View>
          <View style={styles.changePill}>
            <NamedIcon name="image-outline" size={14} color="#111111" />
            <Text style={styles.changeLabel}>Change</Text>
          </View>
        </View>
      </Pressable>

      {coverUri ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Use the default cover"
          onPress={() => {
            void Haptics.selectionAsync();
            setCoverUri(undefined);
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.revert, pressed && styles.revertPressed]}>
          <ThemedText type="small" themeColor="textSecondary">
            Use default
          </ThemedText>
        </Pressable>
      ) : null}

      <TextInput
        autoFocus
        value={name}
        onChangeText={setName}
        onSubmitEditing={createCircle}
        placeholder="e.g. Family"
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
      />

      <ThemedText type="smallBold">People limit</ThemedText>
      <TextInput
        value={limitDraft}
        onChangeText={setLimitDraft}
        accessibilityLabel="People limit"
        keyboardType="number-pad"
        placeholder="No limit"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
      />
      <ThemedText type="small" themeColor={limitError ? 'danger' : 'textSecondary'}>
        {limitError || 'You can change this later. Leave blank for no limit.'}
      </ThemedText>

      <Pressable
        disabled={!canCreate}
        onPress={createCircle}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary, opacity: canCreate ? (pressed ? 0.8 : 1) : 0.4 },
        ]}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          Create circle
        </ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: Spacing.one },
  coverFrame: {
    height: 196,
    borderRadius: Radius.large,
    overflow: 'hidden',
    backgroundColor: '#1A2238',
  },
  coverPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  coverPhoto: {
    ...StyleSheet.absoluteFill,
  },
  coverScrim: {
    ...StyleSheet.absoluteFill,
  },
  coverBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  coverCopy: {
    flexShrink: 1,
    gap: 2,
  },
  coverKicker: {
    color: CREAM,
    fontFamily: Fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: Tracking.body,
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  coverState: {
    color: 'rgba(246, 243, 238, 0.88)',
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: Tracking.body,
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  changePill: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: CREAM,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeLabel: {
    color: '#111111',
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    includeFontPadding: false,
  },
  revert: {
    alignSelf: 'flex-start',
    marginTop: -Spacing.one,
  },
  revertPressed: {
    opacity: 0.7,
  },
  input: {
    minHeight: 58,
    fontFamily: Fonts.regular,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 0,
    fontSize: 17,
    borderWidth: 1,
  },
  button: {
    minHeight: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

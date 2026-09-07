import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ensureDummyCircleMembers } from '@/lib/circles';
import { createId } from '@/lib/id';
import { circlesStore } from '@/lib/stores';

export default function NewCircleScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const canCreate = name.trim().length > 0;

  function createCircle() {
    if (!canCreate) return;
    const circle = {
      id: createId(),
      createdAt: new Date().toISOString(),
      name: name.trim(),
      kind: 'custom' as const,
    };
    circlesStore.add(circle);
    ensureDummyCircleMembers(circle);
    router.back();
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <ThemedText type="title">Create a circle</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Give your new circle a name.
        </ThemedText>
      </View>

      <TextInput
        autoFocus
        value={name}
        onChangeText={setName}
        onSubmitEditing={createCircle}
        placeholder="e.g. Family"
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />

      <Pressable
        disabled={!canCreate}
        onPress={createCircle}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary, opacity: canCreate ? (pressed ? 0.8 : 1) : 0.4 },
        ]}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>Create circle</ThemedText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: Spacing.one },
  input: {
    minHeight: 58,
    fontFamily: Fonts.regular,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: 0,
    fontSize: 17,
  },
  button: {
    minHeight: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { NamedIcon } from '@/components/ui/icon';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Share, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  currentUserName,
  DUMMY_CHURCH_MEMBER_COUNT,
  ensureDummyChurchMembers,
  generateJoinCode,
} from '@/lib/church';
import { createId } from '@/lib/id';
import { churchStore } from '@/lib/stores';
import { Church } from '@/lib/types';

export default function NewChurchScreen() {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [created, setCreated] = useState<Church | null>(null);
  const canCreate = name.trim().length > 0;

  function startChurch() {
    if (!canCreate) return;
    const church: Church = {
      id: createId(),
      createdAt: new Date().toISOString(),
      name: name.trim(),
      ownerNames: [currentUserName()],
      ownedByMe: true,
      joinCode: generateJoinCode(),
      joinCodeActive: true,
      memberCount: DUMMY_CHURCH_MEMBER_COUNT,
    };
    churchStore.add(church);
    ensureDummyChurchMembers(church.id);
    setCreated(church);
  }

  function shareCode() {
    if (!created) return;
    const joinUrl = Linking.createURL('church/join', {
      queryParams: {
        code: created.joinCode,
        churchId: created.id,
        churchName: created.name,
        ownerName: created.ownerNames[0],
      },
    });
    Share.share({
      title: `Join ${created.name} on Openheart`,
      message: `You're invited to ${created.name} on Openheart. Join with code ${created.joinCode} or tap the link.\n\n${joinUrl}`,
      url: joinUrl,
    }).catch(() => {});
  }

  if (created) {
    return (
      <Screen>
        <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
          <NamedIcon name="home" size={36} color={theme.accent} />
        </View>
        <View style={styles.copy}>
          <ThemedText type="title" style={styles.title}>
            {created.name} is ready
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.body}>
            You own this church. Anyone with the code below can join. It works for however many
            people show up, and you can rotate it anytime.
          </ThemedText>
        </View>

        <Card style={styles.codeCard}>
          <ThemedText type="small" themeColor="textSecondary">
            Join code
          </ThemedText>
          <ThemedText style={styles.code}>{created.joinCode}</ThemedText>
        </Card>

        <Pressable onPress={shareCode} style={[styles.button, { backgroundColor: theme.primary }]}>
          <NamedIcon name="share-outline" size={16} color={theme.onPrimary} />
          <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
            Share the code
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => {
            router.back();
            router.push({ pathname: '/church/[id]', params: { id: created.id } });
          }}
          style={[styles.button, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold">Open your church</ThemedText>
        </Pressable>

        <ThemedText type="small" themeColor="textSecondary" style={styles.transparencyNote}>
          Members will always see this church as “Owned by {created.ownerNames[0]}”. Ownership is
          never hidden.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <ThemedText type="title">Start a church</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Name it, get a join code, share it. No verification, no waiting. You'll be listed as the
          owner to everyone who joins.
        </ThemedText>
      </View>

      <TextInput
        autoFocus
        value={name}
        onChangeText={setName}
        onSubmitEditing={startChurch}
        placeholder="e.g. Grace Chapel, Tuesday Bible Study"
        placeholderTextColor={theme.textSecondary}
        returnKeyType="done"
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
      />

      <Pressable
        disabled={!canCreate}
        onPress={startChurch}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary, opacity: canCreate ? (pressed ? 0.8 : 1) : 0.4 },
        ]}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          Start church
        </ThemedText>
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
    borderWidth: 1,
  },
  button: {
    minHeight: 56,
    flexDirection: 'row',
    gap: 8,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  copy: { alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 28, lineHeight: 38, textAlign: 'center' },
  body: { maxWidth: 330, textAlign: 'center', lineHeight: 24 },
  codeCard: { alignItems: 'center', gap: 4 },
  code: {
    fontSize: 30,
    lineHeight: 40,
    letterSpacing: 3,
    fontFamily: Fonts.medium,
  },
  transparencyNote: { textAlign: 'center', lineHeight: 19 },
});

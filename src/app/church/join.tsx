import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { normalizeJoinCode } from '@/lib/church';
import { useCollection } from '@/lib/collection-store';
import { createId } from '@/lib/id';
import { churchStore } from '@/lib/stores';

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export default function JoinChurchScreen() {
  const theme = useTheme();
  const churches = useCollection(churchStore);
  const params = useLocalSearchParams<{
    code?: string | string[];
    churchId?: string | string[];
    churchName?: string | string[];
    ownerName?: string | string[];
  }>();

  const linkCode = normalizeJoinCode(first(params.code));
  const linkChurchId = first(params.churchId);
  const linkChurchName = first(params.churchName);
  const linkOwnerName = first(params.ownerName) || 'An Openheart member';
  const cameFromLink = Boolean(linkCode && linkChurchId && linkChurchName);

  const [draftCode, setDraftCode] = useState('');
  const [notFound, setNotFound] = useState(false);

  function acceptLinkInvite() {
    if (!cameFromLink) return;
    const existing = churches.find((church) => church.id === linkChurchId);
    if (!existing) {
      churchStore.add({
        id: linkChurchId,
        createdAt: new Date().toISOString(),
        name: linkChurchName,
        ownerNames: [linkOwnerName],
        ownedByMe: false,
        joinCode: linkCode,
        joinCodeActive: true,
        memberCount: 1,
      });
    }
    router.replace({ pathname: '/church/[id]', params: { id: linkChurchId } });
  }

  function joinWithCode() {
    const code = normalizeJoinCode(draftCode);
    if (code.replace('-', '').length < 8) return;
    const match = churches.find((church) => church.joinCode === code);
    if (!match) {
      setNotFound(true);
      return;
    }
    if (!match.joinCodeActive) {
      setNotFound(true);
      return;
    }
    if (!match.ownedByMe) {
      churchStore.update(match.id, { memberCount: match.memberCount + 1 });
    }
    router.replace({ pathname: '/church/[id]', params: { id: match.id } });
  }

  if (cameFromLink) {
    return (
      <Screen>
        <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="home" size={40} color={theme.accent} />
        </View>
        <View style={styles.copy}>
          <ThemedText type="title" style={styles.title}>
            Join {linkChurchName}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.body}>
            Owned by {linkOwnerName}. Joining is receive-only. You'll get their weekly post, and
            nothing leaves your journal unless you choose to send a note, field by field.
          </ThemedText>
        </View>
        <Pressable
          onPress={acceptLinkInvite}
          style={[styles.button, { backgroundColor: theme.primary }]}>
          <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
            Join church
          </ThemedText>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <ThemedText type="title">Join a church</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Enter the code your church shared. Joining is receive-only. Nothing flows back unless
          you choose to send it.
        </ThemedText>
      </View>

      <TextInput
        autoFocus
        value={draftCode}
        onChangeText={(text) => {
          setDraftCode(text.toUpperCase());
          setNotFound(false);
        }}
        onSubmitEditing={joinWithCode}
        placeholder="e.g. WXYZ-2345"
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="done"
        style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
      />

      {notFound && (
        <ThemedText type="small" themeColor="danger">
          No church matches that code. Check it with whoever shared it. Codes can also be rotated
          by the owner.
        </ThemedText>
      )}

      <Pressable
        onPress={joinWithCode}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
        ]}>
        <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
          Join church
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
    fontSize: 18,
    letterSpacing: 2,
  },
  button: {
    minHeight: 56,
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
    marginTop: Spacing.four,
  },
  copy: { alignItems: 'center', gap: Spacing.two },
  title: { fontSize: 28, lineHeight: 38, textAlign: 'center' },
  body: { maxWidth: 330, textAlign: 'center', lineHeight: 24 },
});

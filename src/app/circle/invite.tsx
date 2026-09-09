import { NamedIcon } from '@/components/ui/icon';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCollection } from '@/lib/collection-store';
import { createId } from '@/lib/id';
import { accountEmailStore, circleInviteStore, circlesStore } from '@/lib/stores';

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function CircleInviteScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    code?: string | string[];
    circleId?: string | string[];
    circleName?: string | string[];
    ownerName?: string | string[];
  }>();
  const circles = useCollection(circlesStore);
  const code = first(params.code).toUpperCase();
  const circleId = first(params.circleId);
  const circleName = first(params.circleName);
  const ownerName = first(params.ownerName) || 'An Openheart member';
  const validInvite = Boolean(code && circleId && circleName);

  function acceptInvite() {
    if (!validInvite) return;
    if (!circleId.startsWith('openheart-') && !circles.some((circle) => circle.id === circleId)) {
      circlesStore.add({
        id: circleId,
        createdAt: new Date().toISOString(),
        name: circleName,
        kind: 'custom',
      });
    }
    circleInviteStore.add({
      id: createId(),
      createdAt: new Date().toISOString(),
      code,
      circleId,
      claimedBy: accountEmailStore.getSnapshot() || 'current-user',
    });
    router.replace('/circle');
  }

  return (
    <Screen>
      <View style={[styles.iconCircle, { backgroundColor: theme.accentSoft }]}> 
        <NamedIcon name="people" size={40} color={theme.accent} />
      </View>
      <View style={styles.copy}>
        <ThemedText type="title" style={styles.title}>
          Circle invitation
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.body}>
          {validInvite
            ? `${ownerName} has invited you to join their circle.`
            : 'This invitation link is incomplete or invalid.'}
        </ThemedText>
      </View>
      {validInvite ? (
        <Pressable onPress={acceptInvite} style={[styles.button, { backgroundColor: theme.primary }]}> 
          <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>Accept invitation</ThemedText>
        </Pressable>
      ) : (
        <ThemedText themeColor="danger">This invitation link is incomplete or invalid.</ThemedText>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  button: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
});

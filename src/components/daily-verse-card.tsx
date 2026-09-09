import { NamedIcon } from '@/components/ui/icon';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hexToRgba } from '@/lib/color';
import { useCollection } from '@/lib/collection-store';
import { createId } from '@/lib/id';
import { vaultStore } from '@/lib/stores';
import type { ScriptureVerse } from '@/lib/types';

export function DailyVerseCard({ verse, onShare }: { verse: ScriptureVerse; onShare: () => void }) {
  const theme = useTheme();
  const savedItems = useCollection(vaultStore);
  const saved = savedItems.find((item) => item.kind === 'verse' && item.verseRef === verse.ref);
  const [width, setWidth] = useState(345);
  const verseSize = Math.max(21, Math.min(34, width * 0.055));

  async function saveVerse() {
    await vaultStore.whenReady();
    const existing = vaultStore.getSnapshot().find((item) => item.kind === 'verse' && item.verseRef === verse.ref);
    if (existing) {
      router.push({ pathname: '/vault/[id]', params: { id: existing.id } });
      return;
    }
    vaultStore.add({
      id: createId(),
      createdAt: new Date().toISOString(),
      kind: 'verse',
      source: 'vault',
      title: verse.ref,
      body: verse.text,
      verseRef: verse.ref,
    });
  }

  function showMore() {
    Alert.alert(verse.ref, 'King James Version', [
      { text: 'Open Bible Library', onPress: () => router.push('/bible') },
      { text: 'Open Vault', onPress: () => router.push('/vault') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const actions = [
    { label: saved ? 'Saved' : 'Save', icon: saved ? 'heart' : 'heart-outline', onPress: () => void saveVerse() },
    { label: 'Reflect', icon: 'chatbubble-outline', onPress: () => router.push({ pathname: '/journal/new', params: { verseRef: verse.ref } }) },
    { label: 'Share', icon: 'share-outline', onPress: onShare },
    { label: 'More', icon: 'ellipsis-horizontal', onPress: showMore },
  ] as const;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={[styles.frame, { backgroundColor: theme.backgroundElement, shadowColor: theme.text }]}>
      <View style={[styles.card, { minHeight: Math.max(330, width * 0.72), backgroundColor: theme.primary }]}>
        <Image
          source={require('../../assets/images/verse-coastal-mountains.png')}
          contentFit="cover"
          contentPosition="center"
          accessible={false}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: hexToRgba(theme.primary, 0.12) }]} />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.42)', 'rgba(0,0,0,0.84)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heading}>
          <Text style={[styles.label, { color: theme.onPrimary }]}>Verse of the day</Text>
          <Text style={[styles.reference, { color: theme.onPrimary }]}>{verse.ref} KJV</Text>
        </View>
        <View style={styles.verseArea}>
          <Text selectable style={[styles.verse, { color: theme.onPrimary, fontSize: verseSize, lineHeight: verseSize * 1.55 }]}>
            {verse.text}
          </Text>
        </View>
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={`${action.label === 'Saved' ? 'Open saved verse' : action.label}, ${verse.ref}`}
              onPress={action.onPress}
              style={({ pressed }) => [styles.action, { opacity: pressed ? 0.65 : 1 }]}>
              <NamedIcon name={action.icon} size={25} color={theme.onPrimary} />
              <Text style={[styles.actionLabel, { color: theme.onPrimary }]}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
        <View
          pointerEvents="none"
          style={[styles.edge, { borderColor: hexToRgba(theme.onPrimary, 0.18), borderTopColor: hexToRgba(theme.onPrimary, 0.5) }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    borderRadius: 24,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 3,
  },
  card: { borderRadius: 24, padding: 20, gap: 28, overflow: 'hidden' },
  heading: { gap: 5 },
  label: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20 },
  reference: { fontFamily: Fonts.bold, fontSize: 19, lineHeight: 26 },
  verseArea: { flexGrow: 1, justifyContent: 'center', paddingVertical: 4 },
  verse: { fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }), fontWeight: '400' },
  actions: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4 },
  action: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionLabel: { fontFamily: Fonts.regular, fontSize: 12, lineHeight: 18 },
  edge: { ...StyleSheet.absoluteFill, borderWidth: 1, borderRadius: 24 },
});

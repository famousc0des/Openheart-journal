import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Tracking } from '@/constants/theme';
import type { DaySource, NarrativeToken, StickerTone } from '@/lib/today-narrative';

const CREAM_INK = '#161513';
const CREAM_MUTED = 'rgba(22, 21, 19, 0.42)';
const CREAM_SOFT = 'rgba(22, 21, 19, 0.72)';

export function Sticker({ sticker, size = 34 }: { sticker: StickerTone; size?: number }) {
  return (
    <View
      style={[
        styles.sticker,
        {
          width: size,
          height: size,
          borderRadius: size * 0.32,
          backgroundColor: sticker.bg,
        },
      ]}>
      <Ionicons name={sticker.name} size={size * 0.52} color={sticker.color} />
    </View>
  );
}

export function NarrativeBlock({ tokens }: { tokens: NarrativeToken[] }) {
  return (
    <View style={styles.narrative}>
      {tokens.map((token, index) => {
        if (token.kind === 'icon') {
          return (
            <View key={`icon-${index}`} style={styles.inlineSticker}>
              <Sticker sticker={token.sticker} size={36} />
            </View>
          );
        }

        return (
          <Text
            key={`text-${index}`}
            style={token.kind === 'strong' ? styles.strong : styles.muted}>
            {token.text}
          </Text>
        );
      })}
    </View>
  );
}

export function SourceAvatars({ sources }: { sources: DaySource[] }) {
  const unique = sources.slice(0, 4);
  return (
    <View style={styles.avatarRow}>
      {unique.map((source, index) => (
        <View
          key={source.id}
          style={[
            styles.avatar,
            {
              marginLeft: index === 0 ? 0 : -8,
              zIndex: unique.length - index,
              backgroundColor: source.avatar.bg,
            },
          ]}>
          <Ionicons name={source.avatar.name} size={12} color={source.avatar.color} />
        </View>
      ))}
    </View>
  );
}

function HighlightedSnippet({ text, highlights }: { text: string; highlights: string[] }) {
  const needles = highlights.filter((item) => item.trim().length > 2);
  if (needles.length === 0) {
    return <Text style={styles.snippet}>{text}</Text>;
  }

  const pattern = new RegExp(`(${needles.map(escapeRegExp).join('|')})`, 'ig');
  const parts = text.split(pattern);

  return (
    <Text style={styles.snippet}>
      {parts.map((part, index) => {
        const isHit = needles.some((needle) => needle.toLowerCase() === part.toLowerCase());
        return (
          <Text key={`${part}-${index}`} style={isHit ? styles.snippetHit : undefined}>
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function DaySourceRow({ source }: { source: DaySource }) {
  return (
    <Pressable
      onPress={() => router.push(source.href as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${source.sender} ${source.snippet}`}
      style={({ pressed }) => [styles.sourceRow, pressed && styles.sourcePressed]}>
      <View style={[styles.sourceAvatar, { backgroundColor: source.avatar.bg }]}>
        <Ionicons name={source.avatar.name} size={18} color={source.avatar.color} />
      </View>
      <View style={styles.sourceCopy}>
        <Text style={styles.sender}>{source.sender}</Text>
        <HighlightedSnippet text={source.snippet} highlights={source.highlights} />
      </View>
      <View style={styles.sourceStickers}>
        {source.stickers.map((sticker) => (
          <Sticker key={`${source.id}-${sticker.name}`} sticker={sticker} size={28} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  narrative: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 4,
    rowGap: 8,
  },
  muted: {
    color: 'rgba(245, 242, 237, 0.42)',
    fontFamily: Fonts.regular,
    fontSize: 28,
    lineHeight: 40,
    letterSpacing: Tracking.heading,
  },
  strong: {
    color: '#F6F3EE',
    fontFamily: Fonts.bold,
    fontSize: 28,
    lineHeight: 40,
    letterSpacing: Tracking.heading,
  },
  inlineSticker: {
    marginHorizontal: 2,
  },
  sticker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingVertical: 10,
  },
  sourcePressed: {
    opacity: 0.72,
  },
  sourceAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceCopy: {
    flex: 1,
    gap: 2,
  },
  sender: {
    color: CREAM_INK,
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: Tracking.body,
  },
  snippet: {
    color: CREAM_MUTED,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: Tracking.body,
  },
  snippetHit: {
    color: CREAM_SOFT,
    fontFamily: Fonts.bold,
  },
  sourceStickers: {
    flexDirection: 'row',
    marginLeft: 4,
  },
});

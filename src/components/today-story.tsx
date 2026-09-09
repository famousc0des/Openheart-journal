import { NamedIcon } from '@/components/ui/icon';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { Fonts, Tracking } from '@/constants/theme';
import type { DaySource, NarrativeToken, StickerTone } from '@/lib/today-narrative';
import { EmojiText, splitEmojiParts } from '@/lib/with-emoji-fallback';


export function Sticker({ sticker, size = 34 }: { sticker: StickerTone; size?: number }) {
  const styles = createStyles(useTheme());
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
      <NamedIcon name={sticker.name} size={size * 0.52} color={sticker.color} />
    </View>
  );
}

export function NarrativeBlock({
  tokens,
  tone = 'paper',
  compact = false,
}: {
  tokens: NarrativeToken[];
  tone?: 'paper' | 'ink';
  compact?: boolean;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const paper = tone === 'paper';
  const size = compact ? 16 : 28;
  const lineHeight = compact ? 24 : 40;
  const stickerSize = compact ? 22 : 36;

  return (
    <View style={styles.narrative}>
      {tokens.map((token, index) => {
        if (token.kind === 'icon') {
          return (
            <View key={`icon-${index}`} style={styles.inlineSticker}>
              <Sticker sticker={token.sticker} size={stickerSize} />
            </View>
          );
        }

        return (
          <EmojiText
            key={`text-${index}`}
            style={[
              {
                fontSize: size,
                lineHeight,
                letterSpacing: compact ? Tracking.body : Tracking.heading,
                fontFamily: token.kind === 'strong' ? Fonts.bold : Fonts.regular,
                color: paper
                  ? token.kind === 'strong'
                    ? theme.text
                    : theme.textSecondary
                  : token.kind === 'strong'
                    ? '#F6F3EE'
                    : 'rgba(245, 242, 237, 0.42)',
              },
            ]}>
            {token.text}
          </EmojiText>
        );
      })}
    </View>
  );
}

export function SourceAvatars({
  sources,
  ringColor,
}: {
  sources: DaySource[];
  ringColor?: string;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
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
              borderColor: ringColor ?? theme.background,
            },
          ]}>
          <NamedIcon name={source.avatar.name} size={12} color={source.avatar.color} />
        </View>
      ))}
    </View>
  );
}

function HighlightedSnippet({ text, highlights }: { text: string; highlights: string[] }) {
  const styles = createStyles(useTheme());
  const needles = highlights.filter((item) => item.trim().length > 2);
  if (needles.length === 0 || splitEmojiParts(text).some((part) => part.kind === 'emoji')) {
    return <EmojiText style={styles.snippet}>{text}</EmojiText>;
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
  const styles = createStyles(useTheme());
  return (
    <Pressable
      onPress={() => router.push(source.href as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${source.sender} ${source.snippet}`}
      style={({ pressed }) => [styles.sourceRow, pressed && styles.sourcePressed]}>
      <View style={[styles.sourceAvatar, { backgroundColor: source.avatar.bg }]}>
        <NamedIcon name={source.avatar.name} size={18} color={source.avatar.color} />
      </View>
      <View style={styles.sourceCopy}>
        <EmojiText style={styles.sender}>{source.sender}</EmojiText>
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

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  narrative: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 4,
    rowGap: 8,
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
    color: theme.text,
    fontFamily: Fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: Tracking.body,
  },
  snippet: {
    color: theme.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: Tracking.body,
  },
  snippetHit: {
    color: theme.text,
    fontFamily: Fonts.bold,
  },
  sourceStickers: {
    flexDirection: 'row',
    marginLeft: 4,
  },
});

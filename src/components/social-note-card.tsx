import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { CircleAvatar } from '@/components/circle-avatar';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function Action({
  icon,
  count,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  count?: number;
  active?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const color = active ? theme.danger : theme.textSecondary;
  const label = count != null && count > 0 ? String(count) : undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.action, pressed && onPress && { opacity: 0.6 }]}>
      <Ionicons name={icon} size={18} color={color} />
      {label ? (
        <ThemedText type="small" style={[styles.actionCount, { color }]}>
          {label}
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

export function SocialNoteCard({
  name,
  time,
  title,
  body,
  likeCount = 0,
  liked = false,
  commentCount,
  nested = false,
  onLike,
  onComment,
  onShare,
  onMore,
  onPress,
}: {
  name: string;
  time: string;
  title?: string;
  body?: string;
  likeCount?: number;
  liked?: boolean;
  commentCount?: number;
  nested?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onMore?: () => void;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        nested && styles.nested,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <Pressable onPress={onPress} disabled={!onPress}>
        <View style={styles.header}>
          <CircleAvatar name={name} size={40} />
          <View style={styles.identity}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
              {name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.time}>
              {time}
            </ThemedText>
          </View>
          {onMore ? (
            <Pressable
              onPress={onMore}
              hitSlop={10}
              accessibilityLabel="More options"
              style={({ pressed }) => [styles.more, pressed && { opacity: 0.6 }]}>
              <Ionicons name="ellipsis-horizontal" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        {title ? (
          <ThemedText type="smallBold" style={styles.title}>
            {title}
          </ThemedText>
        ) : null}
        {body ? <ThemedText style={styles.body}>{body}</ThemedText> : null}
      </Pressable>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Action
            icon={liked ? 'heart' : 'heart-outline'}
            count={likeCount}
            active={liked}
            onPress={onLike}
          />
          <Action icon="chatbubble-outline" count={commentCount} onPress={onComment} />
        </View>
        <Action icon="arrow-redo-outline" onPress={onShare} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: Spacing.three,
    gap: 12,
  },
  nested: {
    marginLeft: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 15,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    lineHeight: 16,
  },
  more: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  body: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    lineHeight: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 28,
  },
  actionCount: {
    fontSize: 13,
    lineHeight: 18,
  },
});

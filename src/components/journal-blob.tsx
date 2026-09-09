import { NamedIcon } from '@/components/ui/icon';
import type { IconName } from '@/lib/icons/app';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Fonts, Tracking } from '@/constants/theme';

const INK = '#1C1917';
const INK_SOFT = 'rgba(28, 25, 23, 0.52)';

export const JOURNAL_BLOB_COLORS = [
  '#E36A5C',
  '#F0C24B',
  '#E0893A',
  '#6B82E8',
  '#9B86C4',
  '#6BAE9A',
] as const;

type IonName = IconName;

const RADII = [
  {
    borderTopLeftRadius: 48,
    borderTopRightRadius: 62,
    borderBottomRightRadius: 32,
    borderBottomLeftRadius: 54,
  },
  {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 52,
    borderBottomRightRadius: 58,
    borderBottomLeftRadius: 36,
  },
  {
    borderTopLeftRadius: 56,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 50,
    borderBottomLeftRadius: 34,
  },
  {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 64,
    borderBottomRightRadius: 26,
    borderBottomLeftRadius: 48,
  },
  {
    borderTopLeftRadius: 34,
    borderTopRightRadius: 44,
    borderBottomRightRadius: 60,
    borderBottomLeftRadius: 28,
  },
] as const;

const TAILS = [
  { bottom: -7, left: 58 },
  { top: -7, left: 78 },
  { bottom: -8, right: 72 },
  { bottom: 18, left: -7 },
  { bottom: -7, left: 132 },
] as const;

export function JournalBlob({
  color,
  variant = 0,
  avatar,
  name,
  time,
  body,
  badge,
  stickers = [],
  onPress,
  onStickerPress,
  overlap = true,
}: {
  color: string;
  variant?: number;
  avatar: ReactNode;
  name: string;
  time?: string;
  body: string;
  badge?: number | string;
  stickers?: { name: IonName; bg: string; color: string }[];
  onPress?: () => void;
  onStickerPress?: () => void;
  overlap?: boolean;
}) {
  const shape = RADII[Math.abs(variant) % RADII.length];
  const tail = TAILS[Math.abs(variant) % TAILS.length];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${body}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrap,
        overlap && styles.overlap,
        { zIndex: variant, transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}>
      <View style={[styles.blob, { backgroundColor: color }, shape]}>
        <View style={[styles.tail, { backgroundColor: color }, tail]} />
        <View style={styles.row}>
          <View style={styles.avatarRing}>{avatar}</View>
          <View style={styles.copy}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              {time ? (
                <Text style={styles.time} numberOfLines={1}>
                  {time}
                </Text>
              ) : null}
            </View>
            <Text style={styles.body} numberOfLines={2}>
              {body}
            </Text>
          </View>
          {badge != null ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {stickers.length > 0 ? (
        <Pressable
          accessibilityLabel="Circle action"
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onStickerPress?.();
          }}
          style={styles.stickerRow}>
          {stickers.map((sticker, index) => (
            <View
              key={`${sticker.name}-${index}`}
              style={[
                styles.sticker,
                {
                  backgroundColor: sticker.bg,
                  marginLeft: index === 0 ? 0 : -6,
                  transform: [{ rotate: `${index % 2 === 0 ? -11 : 13}deg` }],
                  zIndex: stickers.length - index,
                },
              ]}>
              <NamedIcon name={sticker.name} size={16} color={sticker.color} />
            </View>
          ))}
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export function JournalAvatar({
  label,
  color,
  icon,
}: {
  label?: string;
  color: string;
  icon?: IonName;
}) {
  return (
    <View style={[styles.avatar, { backgroundColor: color }]}>
      {icon ? (
        <NamedIcon name={icon} size={18} color={INK} />
      ) : (
        <Text style={styles.avatarLabel}>{label?.trim().charAt(0).toUpperCase() || '?'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'visible',
  },
  overlap: {
    marginTop: -20,
  },
  blob: {
    minHeight: 96,
    justifyContent: 'center',
    paddingVertical: 20,
    paddingLeft: 16,
    paddingRight: 18,
    overflow: 'visible',
  },
  tail: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 3,
    transform: [{ rotate: '46deg' }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLabel: {
    color: INK,
    fontFamily: Fonts.medium,
    fontSize: 18,
    lineHeight: 22,
    includeFontPadding: false,
    textAlign: 'center',
  },
  copy: {
    flex: 1,
    gap: 3,
    paddingRight: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  name: {
    flexShrink: 1,
    color: INK,
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: Tracking.body,
  },
  time: {
    color: INK_SOFT,
    fontFamily: Fonts.regular,
    fontSize: 12,
  },
  body: {
    color: INK,
    fontFamily: Fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: Tracking.body,
  },
  badge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: INK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#F6F3EE',
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  stickerRow: {
    position: 'absolute',
    right: 22,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sticker: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

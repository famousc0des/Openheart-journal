import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isSharedToCircle, SHARE_KIND_META, ShareDraft, shareToCircle } from '@/lib/circle-share';
import { withBuiltInCircles } from '@/lib/circles';
import { useCollection } from '@/lib/collection-store';
import { circleMemberStore, circleShareStore, circlesStore } from '@/lib/stores';

export function CircleShareSheet({
  visible,
  draft,
  onClose,
}: {
  visible: boolean;
  draft: ShareDraft | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const circles = useCollection(circlesStore);
  const members = useCollection(circleMemberStore);
  const shares = useCollection(circleShareStore);
  const available = withBuiltInCircles(circles);
  const kindLabel = draft ? SHARE_KIND_META[draft.kind].label.toLowerCase() : 'this';
  const [picked, setPicked] = useState<string[]>([]);

  const alreadyShared = useMemo(() => {
    if (!draft) return new Set<string>();
    return new Set(
      available
        .filter(
          (circle) =>
            isSharedToCircle(draft.kind, draft.sourceId, circle.id) ||
            shares.some(
              (share) =>
                share.kind === draft.kind &&
                share.sourceId === draft.sourceId &&
                share.circleId === circle.id
            )
        )
        .map((circle) => circle.id)
    );
  }, [available, draft, shares]);

  useEffect(() => {
    if (!visible || !draft) {
      setPicked([]);
      return;
    }
    setPicked([...alreadyShared]);
  }, [visible, draft?.kind, draft?.sourceId]);

  const pendingIds = picked.filter((id) => !alreadyShared.has(id));
  const canShareNow = pendingIds.length > 0;

  function togglePick(circleId: string) {
    if (alreadyShared.has(circleId)) return;
    setPicked((current) =>
      current.includes(circleId) ? current.filter((id) => id !== circleId) : [...current, circleId]
    );
  }

  function shareNow() {
    if (!draft || !canShareNow) return;
    pendingIds.forEach((circleId) => shareToCircle(circleId, draft));
    onClose();
  }

  return (
    <Modal animationType="slide" transparent visible={visible && Boolean(draft)} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.sheet,
            { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, Spacing.three) },
          ]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <ThemedText type="title" style={styles.title}>
                Share with a circle
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                {draft?.title || `This ${kindLabel}`}
              </ThemedText>
            </View>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={8}
              style={styles.close}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {available.map((circle) => {
              const memberCount = members.filter((member) => member.circleId === circle.id).length;
              const posted = alreadyShared.has(circle.id);
              const selected = posted || picked.includes(circle.id);
              return (
                <Pressable
                  key={circle.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected, disabled: posted }}
                  disabled={posted}
                  onPress={() => togglePick(circle.id)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: selected ? theme.accentSoft : theme.backgroundElement,
                      opacity: pressed && !posted ? 0.85 : 1,
                    },
                  ]}>
                  <View style={[styles.check, { borderColor: selected ? theme.accent : theme.border }]}>
                    <Ionicons
                      name={posted ? 'checkmark' : selected ? 'checkmark-circle-outline' : 'people-outline'}
                      size={18}
                      color={theme.accent}
                    />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">{circle.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {memberCount === 0
                        ? 'Just you for now'
                        : `${memberCount} member${memberCount === 1 ? '' : 's'}`}
                    </ThemedText>
                  </View>
                  {posted ? (
                    <ThemedText type="smallBold" themeColor="accent">
                      Shared
                    </ThemedText>
                  ) : selected ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      Selected
                    </ThemedText>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          {canShareNow ? (
            <Pressable
              accessibilityLabel="Share now"
              onPress={shareNow}
              style={({ pressed }) => [
                styles.shareNow,
                { backgroundColor: theme.primary, opacity: pressed ? 0.88 : 1 },
              ]}>
              <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
                Share now
                {pendingIds.length > 1 ? ` · ${pendingIds.length}` : ''}
              </ThemedText>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  sheet: {
    maxHeight: '78%',
    paddingHorizontal: Spacing.four,
    paddingTop: 10,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
  },
  handle: {
    width: 42,
    height: 5,
    alignSelf: 'center',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(127,127,127,0.45)',
    marginBottom: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 25, lineHeight: 34 },
  close: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { marginTop: Spacing.three, flexGrow: 0 },
  listContent: { gap: Spacing.two, paddingBottom: Spacing.two },
  row: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.medium,
  },
  check: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, gap: 1 },
  shareNow: {
    minHeight: 56,
    marginTop: Spacing.two,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

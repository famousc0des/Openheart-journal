import type { ReactNode } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type ScreenProps = ScrollViewProps & {
  /** Kept so existing call sites type-check. Entering animations were dropping screens. */
  stagger?: boolean;
  /** Top safe area. Off by default so stack screens do not double-pad under the nav header. */
  insetTop?: boolean;
  children?: ReactNode;
};

export function Screen({
  children,
  contentContainerStyle,
  stagger: _stagger,
  insetTop = false,
  ...rest
}: ScreenProps) {
  return (
    <ThemedView style={styles.fill}>
      <SafeAreaView style={styles.fill} edges={insetTop ? ['top'] : []}>
        <ScrollView
          contentContainerStyle={[styles.content, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          {...rest}>
          {children}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six * 2,
    gap: Spacing.three,
  },
});

import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatClock } from '@/lib/date';

export function stepHour(hour: number, delta: number) {
  return (hour + delta + 24) % 24;
}

export function stepMinute(minute: number, delta: number) {
  return (minute + delta + 60) % 60;
}

export function TimeField({
  label,
  hour,
  minute,
  onHour,
  onMinute,
}: {
  label: string;
  hour: number;
  minute: number;
  onHour: (delta: number) => void;
  onMinute: (delta: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="subtitle" style={styles.clock}>
        {formatClock(hour, minute)}
      </ThemedText>
      <View style={styles.row}>
        <Step label="Hr −" onPress={() => onHour(-1)} />
        <Step label="Hr +" onPress={() => onHour(1)} />
        <Step label="Min −" onPress={() => onMinute(-15)} />
        <Step label="Min +" onPress={() => onMinute(15)} />
      </View>
    </View>
  );
}

function Step({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.step, { borderColor: theme.border }]}>
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
  },
  clock: {
    fontSize: 28,
    lineHeight: 34,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  step: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});

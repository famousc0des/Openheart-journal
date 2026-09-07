import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TimeField, stepHour, stepMinute } from '@/components/time-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Tracking } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveChurchHours } from '@/lib/church-hours';
import { DEFAULT_CHURCH_HOURS } from '@/lib/types';

export function ChurchHoursOnboarding({ onDone }: { onDone: () => void }) {
  const theme = useTheme();
  const [startHour, setStartHour] = useState(DEFAULT_CHURCH_HOURS.startHour);
  const [startMinute, setStartMinute] = useState(DEFAULT_CHURCH_HOURS.startMinute);
  const [endHour, setEndHour] = useState(DEFAULT_CHURCH_HOURS.endHour);
  const [endMinute, setEndMinute] = useState(DEFAULT_CHURCH_HOURS.endMinute);
  const [saving, setSaving] = useState(false);

  async function finish(enabled: boolean) {
    if (saving) return;
    setSaving(true);
    await saveChurchHours({
      asked: true,
      enabled,
      startHour,
      startMinute,
      endHour,
      endMinute,
    });
    setSaving(false);
    onDone();
  }

  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <ThemedText type="small" themeColor="textSecondary">
            A QUESTION
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            What time do you go to church on Sundays?
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.copy}>
            Set when you leave and when church usually ends. We will ask how it was when the
            service is over.
          </ThemedText>

          <TimeField
            label="I go at"
            hour={startHour}
            minute={startMinute}
            onHour={(delta) => setStartHour(stepHour(startHour, delta))}
            onMinute={(delta) => setStartMinute(stepMinute(startMinute, delta))}
          />
          <TimeField
            label="Church ends around"
            hour={endHour}
            minute={endMinute}
            onHour={(delta) => setEndHour(stepHour(endHour, delta))}
            onMinute={(delta) => setEndMinute(stepMinute(endMinute, delta))}
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => void finish(true)}
            disabled={saving}
            style={[styles.primary, { backgroundColor: theme.primary, opacity: saving ? 0.6 : 1 }]}>
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              Save and remind me
            </ThemedText>
          </Pressable>
          <Pressable onPress={() => void finish(false)} disabled={saving} style={styles.ghost}>
            <ThemedText type="small" themeColor="textSecondary">
              Skip for now
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
  },
  title: {
    fontSize: 32,
    lineHeight: 44,
    letterSpacing: Tracking.heading,
  },
  copy: {
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  primary: {
    minHeight: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

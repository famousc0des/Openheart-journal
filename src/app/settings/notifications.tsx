import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { TimeField, stepHour, stepMinute } from '@/components/time-field';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveChurchHours } from '@/lib/church-hours';
import { formatClock } from '@/lib/date';
import { syncReminderNotifications } from '@/lib/reminders';
import { useScalar } from '@/lib/scalar-store';
import { notificationPrefsStore } from '@/lib/stores';
import { DEFAULT_NOTIFICATION_PREFS, NotificationPrefs } from '@/lib/types';

export default function NotificationSettingsScreen() {
  const theme = useTheme();
  const raw = useScalar(notificationPrefsStore);
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...raw };
  const [saving, setSaving] = useState(false);

  async function update(patch: Partial<NotificationPrefs>) {
    const next = { ...prefs, ...patch };
    const churchChanged =
      patch.churchEnabled !== undefined ||
      patch.churchStartHour !== undefined ||
      patch.churchStartMinute !== undefined ||
      patch.churchEndHour !== undefined ||
      patch.churchEndMinute !== undefined;
    setSaving(true);
    if (churchChanged) {
      await saveChurchHours({
        asked: true,
        enabled: next.churchEnabled,
        startHour: next.churchStartHour,
        startMinute: next.churchStartMinute,
        endHour: next.churchEndHour,
        endMinute: next.churchEndMinute,
      });
      setSaving(false);
      return;
    }
    await notificationPrefsStore.set(next);
    const granted = await syncReminderNotifications(next);
    setSaving(false);
    if ((next.morningEnabled || next.eveningEnabled || next.prayerEnabled || next.churchEnabled) && !granted) {
      Alert.alert(
        'Notifications are off',
        'Allow notifications in system settings if you want reminders to arrive.'
      );
    }
  }

  return (
    <Screen>
      <ThemedText themeColor="textSecondary">
        Reminders stay on this device. Nothing about what you write is included in the
        notification.
      </ThemedText>
      {saving ? (
        <ThemedText type="small" themeColor="textSecondary">
          Updating reminders…
        </ThemedText>
      ) : null}

      <ReminderRow
        title="Morning check-in"
        subtitle="A quiet nudge to write"
        enabled={prefs.morningEnabled}
        hour={prefs.morningHour}
        minute={prefs.morningMinute}
        onToggle={(morningEnabled) => void update({ morningEnabled })}
        onHour={(delta) => void update({ morningHour: stepHour(prefs.morningHour, delta) })}
        onMinute={(delta) => void update({ morningMinute: stepMinute(prefs.morningMinute, delta) })}
      />
      <ReminderRow
        title="Evening check-in"
        subtitle="Before the day closes"
        enabled={prefs.eveningEnabled}
        hour={prefs.eveningHour}
        minute={prefs.eveningMinute}
        onToggle={(eveningEnabled) => void update({ eveningEnabled })}
        onHour={(delta) => void update({ eveningHour: stepHour(prefs.eveningHour, delta) })}
        onMinute={(delta) => void update({ eveningMinute: stepMinute(prefs.eveningMinute, delta) })}
      />
      <ReminderRow
        title="Prayer reminder"
        subtitle="Return to what you’re still carrying"
        enabled={prefs.prayerEnabled}
        hour={prefs.prayerHour}
        minute={prefs.prayerMinute}
        onToggle={(prayerEnabled) => void update({ prayerEnabled })}
        onHour={(delta) => void update({ prayerHour: stepHour(prefs.prayerHour, delta) })}
        onMinute={(delta) => void update({ prayerMinute: stepMinute(prefs.prayerMinute, delta) })}
      />

      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold">Sunday after church</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              “How was church today?” when the service ends
            </ThemedText>
          </View>
          <Switch
            value={prefs.churchEnabled}
            onValueChange={(churchEnabled) => void update({ churchEnabled })}
            trackColor={{ true: theme.accent }}
          />
        </View>
        {prefs.churchEnabled ? (
          <View style={{ gap: Spacing.two }}>
            <TimeField
              label="I go at"
              hour={prefs.churchStartHour}
              minute={prefs.churchStartMinute}
              onHour={(delta) => void update({ churchStartHour: stepHour(prefs.churchStartHour, delta) })}
              onMinute={(delta) => void update({ churchStartMinute: stepMinute(prefs.churchStartMinute, delta) })}
            />
            <TimeField
              label="Church ends around"
              hour={prefs.churchEndHour}
              minute={prefs.churchEndMinute}
              onHour={(delta) => void update({ churchEndHour: stepHour(prefs.churchEndHour, delta) })}
              onMinute={(delta) => void update({ churchEndMinute: stepMinute(prefs.churchEndMinute, delta) })}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function ReminderRow({
  title,
  subtitle,
  enabled,
  hour,
  minute,
  onToggle,
  onHour,
  onMinute,
}: {
  title: string;
  subtitle: string;
  enabled: boolean;
  hour: number;
  minute: number;
  onToggle: (value: boolean) => void;
  onHour: (delta: number) => void;
  onMinute: (delta: number) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <ThemedText type="smallBold">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        </View>
        <Switch value={enabled} onValueChange={onToggle} trackColor={{ true: theme.accent }} />
      </View>
      {enabled && (
        <View style={[styles.timeRow, { borderTopColor: theme.border }]}>
          <ThemedText type="smallBold">{formatClock(hour, minute)}</ThemedText>
          <View style={styles.steppers}>
            <Stepper label="Hr −" onPress={() => onHour(-1)} />
            <Stepper label="Hr +" onPress={() => onHour(1)} />
            <Stepper label="Min −" onPress={() => onMinute(-15)} />
            <Stepper label="Min +" onPress={() => onMinute(15)} />
          </View>
        </View>
      )}
    </View>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.step, { borderColor: theme.border }]}>
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timeRow: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  steppers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  step: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

import { churchHoursStore, notificationPrefsStore } from '@/lib/stores';
import { ChurchHours } from '@/lib/types';
import { syncReminderNotifications } from '@/lib/reminders';

export async function saveChurchHours(hours: ChurchHours) {
  await churchHoursStore.set(hours);
  const prefs = notificationPrefsStore.getSnapshot();
  const next = {
    ...prefs,
    churchEnabled: hours.enabled,
    churchStartHour: hours.startHour,
    churchStartMinute: hours.startMinute,
    churchEndHour: hours.endHour,
    churchEndMinute: hours.endMinute,
  };
  await notificationPrefsStore.set(next);
  if (hours.enabled) {
    await syncReminderNotifications(next);
  } else {
    await syncReminderNotifications({ ...next, churchEnabled: false });
  }
}

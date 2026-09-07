import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { cancelScheduledNotification, scheduleLocalNotification } from '@/lib/notifications';
import { NotificationPrefs } from '@/lib/types';

const IDS = {
  morning: 'openheart.reminder.morning',
  evening: 'openheart.reminder.evening',
  prayer: 'openheart.reminder.prayer',
  church: 'openheart.reminder.churchSunday',
} as const;

const DUMMY_SUNDAY_ID = 'openheart.reminder.churchSunday.dummy';

export const CHURCH_CHECKIN_ROUTE = 'church-checkin';

const SUNDAY_NOTICE = {
  title: 'How was church today?',
  body: 'Write or record a note, then share it with your circle if you want.',
} as const;

let dummySundayQueued = false;

async function cancelKnownReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => Object.values(IDS).includes(item.identifier as (typeof IDS)[keyof typeof IDS]))
      .map((item) => cancelScheduledNotification(item.identifier))
  );
}

export async function scheduleDummySundayNotification() {
  if (Platform.OS === 'web' || dummySundayQueued) return;
  dummySundayQueued = true;
  try {
    await cancelScheduledNotification(DUMMY_SUNDAY_ID);
    const id = await scheduleLocalNotification({
      identifier: DUMMY_SUNDAY_ID,
      title: SUNDAY_NOTICE.title,
      body: SUNDAY_NOTICE.body,
      data: { route: CHURCH_CHECKIN_ROUTE },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
    if (!id) dummySundayQueued = false;
  } catch {
    dummySundayQueued = false;
  }
}

export async function syncReminderNotifications(prefs: NotificationPrefs): Promise<boolean> {
  try {
    await cancelKnownReminders();

    if (prefs.morningEnabled) {
      const id = await scheduleLocalNotification({
        identifier: IDS.morning,
        title: 'Morning check-in',
        body: 'How is your heart this morning?',
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: prefs.morningHour,
          minute: prefs.morningMinute,
        },
      });
      if (!id) return false;
    }
    if (prefs.eveningEnabled) {
      const id = await scheduleLocalNotification({
        identifier: IDS.evening,
        title: 'Evening check-in',
        body: 'What are you carrying into the night?',
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: prefs.eveningHour,
          minute: prefs.eveningMinute,
        },
      });
      if (!id) return false;
    }
    if (prefs.prayerEnabled) {
      const id = await scheduleLocalNotification({
        identifier: IDS.prayer,
        title: 'Time to pray',
        body: 'Open your prayer log and sit with what is still on your heart.',
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: prefs.prayerHour,
          minute: prefs.prayerMinute,
        },
      });
      if (!id) return false;
    }
    if (prefs.churchEnabled) {
      const id = await scheduleLocalNotification({
        identifier: IDS.church,
        title: SUNDAY_NOTICE.title,
        body: SUNDAY_NOTICE.body,
        data: { route: CHURCH_CHECKIN_ROUTE },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 1,
          hour: prefs.churchEndHour ?? 12,
          minute: prefs.churchEndMinute ?? 0,
        },
      });
      if (!id) return false;
    }

    return true;
  } catch {
    return false;
  }
}

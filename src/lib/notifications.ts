import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Must be set in module scope so foreground notifications are not discarded. */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const REMINDER_CHANNEL_ID = 'openheart-reminders';

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  // Android 13+ will not show the permission prompt until a channel exists.
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Reminders',
    description: 'Check-in, prayer, and Sunday church reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3B82F6',
  });
}

export async function notificationsAreAllowed(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await ensureAndroidChannel();
  if (await notificationsAreAllowed()) return true;
  await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return notificationsAreAllowed();
}

function androidChannelTrigger<T extends Notifications.SchedulableNotificationTriggerInput>(
  trigger: T
): T {
  if (Platform.OS !== 'android' || trigger === null || typeof trigger !== 'object') return trigger;
  return { ...trigger, channelId: REMINDER_CHANNEL_ID };
}

export async function scheduleLocalNotification(request: {
  identifier?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  trigger: Notifications.SchedulableNotificationTriggerInput;
}): Promise<string | undefined> {
  if (Platform.OS === 'web') return undefined;
  const allowed = await ensureNotificationPermissions();
  if (!allowed) return undefined;

  return Notifications.scheduleNotificationAsync({
    identifier: request.identifier,
    content: {
      title: request.title,
      body: request.body,
      data: request.data,
      sound: true,
    },
    trigger: androidChannelTrigger(request.trigger),
  });
}

export function midweekResurfaceDate(from: Date = new Date()): Date {
  const target = new Date(from);
  target.setDate(target.getDate() + 3);
  target.setHours(9, 0, 0, 0);
  return target;
}

export async function scheduleSermonResurfacing(
  title: string,
  fireDate: Date
): Promise<string | undefined> {
  if (fireDate.getTime() <= Date.now()) return undefined;
  try {
    return await scheduleLocalNotification({
      title: 'Your sermon note is waiting',
      body: `"${title}". Take a minute to sit with it again.`,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate },
    });
  } catch {
    return undefined;
  }
}

export async function cancelScheduledNotification(id?: string) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // nothing to clean up if it already fired or was never scheduled
  }
}

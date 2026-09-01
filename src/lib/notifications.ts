import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return undefined;

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your sermon note is waiting',
        body: `"${title}" — take a minute to sit with it again.`,
      },
      trigger:
        Platform.OS === 'web'
          ? null
          : ({ type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireDate } as const),
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

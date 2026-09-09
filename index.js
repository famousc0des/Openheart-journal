const { LogBox } = require('react-native');

require('react-native-gesture-handler');
require('react-native-reanimated');

const EXPO_GO_NOTIFICATION_NOISE = [
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
];

LogBox.ignoreLogs(EXPO_GO_NOTIFICATION_NOISE);

const originalWarn = console.warn.bind(console);
console.warn = (...args) => {
  const text = args.map(String).join(' ');
  if (EXPO_GO_NOTIFICATION_NOISE.some((snippet) => text.includes(snippet))) return;
  originalWarn(...args);
};

const Notifications = require('expo-notifications');
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

require('expo-router/entry');

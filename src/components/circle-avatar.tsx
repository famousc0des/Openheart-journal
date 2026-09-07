import { StyleSheet, Text, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { pastelFor } from '@/lib/circles';

export function CircleAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const fontSize = Math.round(size * 0.4);
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pastelFor(name),
        },
      ]}>
      <Text
        allowFontScaling={false}
        style={[
          styles.initial,
          {
            fontSize,
            lineHeight: fontSize + 6,
          },
        ]}>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontFamily: Fonts.medium,
    color: 'rgba(19, 20, 22, 0.75)',
    textAlign: 'center',
    includeFontPadding: false,
  },
});

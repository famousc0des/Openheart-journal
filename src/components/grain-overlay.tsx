import { type ReactNode, useMemo } from 'react';
import { Image, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';

import { useThemeScheme } from '@/hooks/use-theme';

const GRAIN = require('../../assets/images/grain.png');
const TILE = 128;

export function GrainSurface({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const dark = useThemeScheme() === 'dark';
  const { width, height } = useWindowDimensions();
  const cols = Math.ceil(width / TILE);
  const rows = Math.ceil(height / TILE);
  const tiles = useMemo(
    () => Array.from({ length: cols * rows }, (_, index) => index),
    [cols, rows]
  );

  return (
    <View style={[styles.fill, style]}>
      <View style={styles.fill}>{children}</View>
      <View
        pointerEvents="none"
        style={[styles.cover, { opacity: dark ? 0.12 : 0.05 }]}>
        <View style={{ width: cols * TILE, height: rows * TILE, flexDirection: 'row', flexWrap: 'wrap' }}>
          {tiles.map((index) => (
            <Image key={index} source={GRAIN} style={styles.tile} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  cover: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  tile: {
    width: TILE,
    height: TILE,
  },
});

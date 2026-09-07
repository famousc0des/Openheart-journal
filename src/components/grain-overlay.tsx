import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Line, Pattern, Rect } from 'react-native-svg';

import { useThemeScheme } from '@/hooks/use-theme';

const GRAIN = require('../../assets/images/grain.png');
const RULE_GAP = 30;

export function GrainOverlay() {
  const dark = useThemeScheme() === 'dark';
  const { width, height } = useWindowDimensions();
  const rule = dark ? 'rgba(246, 243, 238, 0.045)' : 'rgba(42, 34, 28, 0.055)';

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern id="notebook-rules" x="0" y="0" width={width} height={RULE_GAP} patternUnits="userSpaceOnUse">
            <Line
              x1="0"
              y1={RULE_GAP - 0.5}
              x2={width}
              y2={RULE_GAP - 0.5}
              stroke={rule}
              strokeWidth={1}
            />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#notebook-rules)" />
      </Svg>
      <Image
        source={GRAIN}
        resizeMode="repeat"
        style={[styles.grain, { opacity: dark ? 0.055 : 0.045 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  grain: {
    ...StyleSheet.absoluteFill,
  },
});

import { type ReactNode, useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressScaleProps = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  style?: PressableProps['style'];
  scaleTo?: number;
};

export function PressScale({ children, style, scaleTo = 0.97, onPressIn, onPressOut, ...rest }: PressScaleProps) {
  const scale = useSharedValue(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        scale.value = withTiming(reduceMotion ? 1 : scaleTo, { duration: 90 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, { duration: 140 });
        onPressOut?.(event);
      }}
      {...rest}>
      {children}
    </AnimatedPressable>
  );
}

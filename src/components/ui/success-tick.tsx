import LottieView from 'lottie-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { NamedIcon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';

export function SuccessTick() {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [failed, setFailed] = useState(false);

  return (
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 108, height: 108, alignItems: 'center', justifyContent: 'center' }}>
      {reduceMotion || failed ? (
        <NamedIcon name="checkmark-circle" size={60} color={theme.accent} />
      ) : (
        <LottieView
          source={require('../../../assets/animations/circle-shared.json')}
          autoPlay
          loop={false}
          resizeMode="contain"
          onAnimationFailure={() => setFailed(true)}
          style={{ width: 108, height: 108 }}
        />
      )}
    </View>
  );
}

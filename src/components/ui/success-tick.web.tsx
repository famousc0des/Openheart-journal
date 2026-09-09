import { DotLottieReact, setWasmUrl, type DotLottie } from '@lottiefiles/dotlottie-react';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { NamedIcon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';

// Serve the matching runtime with the app; no CDN request is needed to confirm a share.
setWasmUrl('/vendor/dotlottie-player.wasm');

export function SuccessTick() {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [player, setPlayer] = useState<DotLottie | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!player) return;
    const onError = () => setFailed(true);
    player.addEventListener('loadError', onError);
    return () => player.removeEventListener('loadError', onError);
  }, [player]);

  return (
    <View aria-hidden style={{ width: 108, height: 108, alignItems: 'center', justifyContent: 'center' }}>
      {reduceMotion || failed ? (
        <NamedIcon name="checkmark-circle" size={60} color={theme.accent} />
      ) : (
        <DotLottieReact
          src="/animations/circle-shared.lottie"
          autoplay
          loop={false}
          dotLottieRefCallback={setPlayer}
          style={{ width: 108, height: 108 }}
        />
      )}
    </View>
  );
}

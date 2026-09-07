import { FadeInDown, FadeInUp, LinearTransition } from 'react-native-reanimated';

const SPRING = { damping: 20, stiffness: 240 } as const;

/**
 * Entering that is visible on frame one.
 * Opacity stays at 1 so stack/tab transitions never show a blank screen.
 * Only a short travel runs, with no delay.
 */
export const enterDown = FadeInDown.duration(240)
  .springify()
  .damping(SPRING.damping)
  .stiffness(SPRING.stiffness)
  .withInitialValues({ opacity: 1, translateY: 14 });

export const enterUp = FadeInUp.duration(240)
  .springify()
  .damping(SPRING.damping)
  .stiffness(SPRING.stiffness)
  .withInitialValues({ opacity: 1, translateY: -10 });

export const listLayout = LinearTransition.duration(220)
  .springify()
  .damping(SPRING.damping)
  .stiffness(SPRING.stiffness);

export function staggerEnter(index: number) {
  return enterDown.delay(Math.min(index, 6) * 28);
}

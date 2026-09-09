import { NamedIcon } from '@/components/ui/icon';
import type { IconName } from '@/lib/icons/app';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CircleAvatar } from '@/components/circle-avatar';
import { Fonts, Tracking } from '@/constants/theme';
import { DEFAULT_CIRCLE_COVER, deckCoverSource } from '@/lib/circle-covers';
import { EmojiText } from '@/lib/with-emoji-fallback';

const INK = '#111111';
const CREAM = '#F6F3EE';
const MUTED_ON_DARK = 'rgba(255, 255, 255, 0.92)';
const WHITE_RING = '#FFFFFF';
const WARM_FALLBACK = '#C4A07A';
const GOLD = '#E8C34A';
const CARD_RADIUS = 32;

const REST_SPRING = { damping: 20, stiffness: 260, mass: 0.8 } as const;
const REVEAL_SPRING = { damping: 22, stiffness: 280, mass: 0.7 } as const;
const THROW_MS = 220;
const HOLD_MS = 90;
const TUCK_MS = 300;
const THROW_EASING = Easing.bezier(0.2, 0.0, 0.0, 1);
const TUCK_EASING = Easing.out(Easing.cubic);

export type CircleDeckItem = {
  id: string;
  name: string;
  kindLabel: string;
  body: string;
  footerLine: string;
  badge: string | number;
  members: { name: string }[];
  canInvite: boolean;
  variant: 'circle' | 'church';
  coverUri?: string;
};

export type CircleDeckHandle = {
  select: (id: string) => void;
};

function wrapIndex(value: number, count: number) {
  'worklet';
  if (count <= 0) return 0;
  return ((Math.round(value) % count) + count) % count;
}

function posMod(n: number, m: number) {
  'worklet';
  if (m <= 0) return 0;
  return ((n % m) + m) % m;
}

function mix(a: number, b: number, t: number) {
  'worklet';
  return a + (b - a) * t;
}

function poseAt(depth: number) {
  'worklet';
  if (depth <= 0) return { y: 0, scale: 1, rot: 0, op: 1, z: 50 };
  if (depth === 1) return { y: 16, scale: 0.94, rot: -4.5, op: 1, z: 32 };
  if (depth === 2) return { y: 30, scale: 0.88, rot: 4.5, op: 1, z: 16 };
  return { y: 30, scale: 0.88, rot: 4.5, op: 0, z: 2 };
}

function shortestDelta(from: number, to: number, count: number) {
  if (count <= 0) return 0;
  let delta = to - from;
  if (delta > count / 2) delta -= count;
  if (delta < -count / 2) delta += count;
  return delta;
}

function kindIcon(variant: CircleDeckItem['variant'], kindLabel: string): IconName {
  if (variant === 'church') return 'business-outline';
  const key = kindLabel.toLowerCase();
  if (key.includes('cord')) return 'git-network-outline';
  if (key.includes('fellow')) return 'people-outline';
  return 'sparkles-outline';
}

export const CircleDeck = forwardRef<
  CircleDeckHandle,
  {
    items: CircleDeckItem[];
    frontId: string | null;
    onFrontChange: (id: string) => void;
    onOpen: (item: CircleDeckItem) => void;
    onInvite: (item: CircleDeckItem) => void;
  }
>(function CircleDeck({ items, frontId, onFrontChange, onOpen, onInvite }, ref) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const cardWidth = Math.min(windowWidth - 40, 400);
  const cardHeight = Math.min(420, Math.max(360, Math.round(Math.min(cardWidth * 1.22, windowHeight * 0.48))));
  const stageWidth = windowWidth - 32;
  const cardLeft = Math.max(0, (stageWidth - cardWidth) / 2);

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const frontIdRef = useRef(frontId);
  frontIdRef.current = frontId;
  const onFrontChangeRef = useRef(onFrontChange);
  onFrontChangeRef.current = onFrontChange;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  const lastOpenAt = useRef(0);
  const stepQueue = useRef<number[]>([]);
  const stepping = useRef(false);

  const countSV = useSharedValue(Math.max(items.length, 1));
  const indexSV = useSharedValue(0);
  const frontX = useSharedValue(0);
  const flySV = useSharedValue(1);
  const flyIndexSV = useSharedValue(-1);
  const flyDirSV = useSharedValue(-1);
  const settleSV = useSharedValue(1);
  const reduceMotion = useSharedValue(0);
  const widthSV = useSharedValue(cardWidth);
  const throwDistSV = useSharedValue(Math.max(windowWidth * 0.72, cardWidth + 88));
  const busySV = useSharedValue(0);

  useEffect(() => {
    countSV.value = Math.max(items.length, 1);
    widthSV.value = cardWidth;
    throwDistSV.value = Math.max(windowWidth * 0.72, cardWidth + 88);
  }, [cardWidth, countSV, items.length, throwDistSV, widthSV, windowWidth]);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) reduceMotion.value = enabled ? 1 : 0;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      reduceMotion.value = enabled ? 1 : 0;
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [reduceMotion]);

  const emitFront = useCallback((unbounded: number) => {
    const list = itemsRef.current;
    if (!list.length) return;
    const next = list[wrapIndex(unbounded, list.length)];
    if (next && next.id !== frontIdRef.current) onFrontChangeRef.current(next.id);
  }, []);

  const hapticSnap = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const openFront = useCallback(() => {
    if (busySV.value) return;
    const now = Date.now();
    if (now - lastOpenAt.current < 420) return;
    lastOpenAt.current = now;
    const list = itemsRef.current;
    if (!list.length) return;
    const item = list[wrapIndex(indexSV.value, list.length)];
    if (item) onOpenRef.current(item);
  }, [busySV, indexSV]);

  const runStepRef = useRef<() => void>(() => {});

  const afterTuck = useCallback(() => {
    hapticSnap();
    runStepRef.current();
  }, [hapticSnap]);

  const throwCard = useCallback(
    (step: number) => {
      const dir = step > 0 ? -1 : 1;
      stepping.current = true;
      busySV.value = 1;

      if (reduceMotion.value) {
        const count = itemsRef.current.length;
        if (count <= 1) {
          frontX.value = 0;
          busySV.value = 0;
          stepping.current = false;
          return;
        }
        indexSV.value = indexSV.value + step;
        frontX.value = 0;
        flyIndexSV.value = -1;
        flySV.value = 1;
        settleSV.value = 1;
        emitFront(indexSV.value);
        afterTuck();
        return;
      }

      const exit = dir * throwDistSV.value;
      frontX.value = withTiming(exit, { duration: THROW_MS, easing: THROW_EASING }, (finished) => {
        if (!finished) return;

        const count = countSV.value;
        if (count <= 1) {
          frontX.value = 0;
          busySV.value = 0;
          return;
        }

        const leaving = wrapIndex(indexSV.value, count);
        const dest = indexSV.value + step;
        flyIndexSV.value = leaving;
        flyDirSV.value = dir;
        flySV.value = 0;
        frontX.value = 0;
        indexSV.value = dest;
        settleSV.value = 0;
        settleSV.value = withSpring(1, REVEAL_SPRING);
        runOnJS(emitFront)(dest);

        flySV.value = withDelay(
          HOLD_MS,
          withTiming(1, { duration: TUCK_MS, easing: TUCK_EASING }, (tucked) => {
            if (!tucked) return;
            flyIndexSV.value = -1;
            busySV.value = 0;
            runOnJS(afterTuck)();
          })
        );
      });
    },
    [
      afterTuck,
      busySV,
      countSV,
      emitFront,
      flyDirSV,
      flyIndexSV,
      flySV,
      frontX,
      indexSV,
      reduceMotion,
      settleSV,
      throwDistSV,
    ]
  );

  const runStep = useCallback(() => {
    const step = stepQueue.current.shift();
    if (step == null) {
      stepping.current = false;
      busySV.value = 0;
      return;
    }

    stepping.current = true;
    throwCard(step);
  }, [busySV, throwCard]);

  runStepRef.current = runStep;

  useImperativeHandle(ref, () => ({
    select: (id: string) => {
      const list = itemsRef.current;
      const target = list.findIndex((item) => item.id === id);
      if (target < 0 || list.length <= 1) return;
      const current = wrapIndex(indexSV.value, list.length);
      const delta = shortestDelta(current, target, list.length);
      if (delta === 0) return;

      const dir = delta > 0 ? 1 : -1;
      stepQueue.current = Array.from({ length: Math.abs(delta) }, () => dir);
      if (!stepping.current && busySV.value === 0) runStep();
    },
  }));

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(items.length > 1)
        .activeOffsetX([-12, 12])
        .failOffsetY([-28, 28])
        .onChange((event) => {
          if (busySV.value) return;
          frontX.value += event.changeX;
        })
        .onFinalize((event) => {
          if (busySV.value) return;
          const count = countSV.value;
          if (count <= 1) {
            frontX.value = withSpring(0, REST_SPRING);
            return;
          }

          const shouldThrow =
            Math.abs(frontX.value) > widthSV.value * 0.22 || Math.abs(event.velocityX) > 800;
          if (!shouldThrow) {
            frontX.value = withSpring(0, REST_SPRING);
            return;
          }

          busySV.value = 1;
          const step = frontX.value < 0 ? 1 : -1;
          runOnJS(throwCard)(step);
        }),
    [busySV, countSV, frontX, items.length, throwCard, widthSV]
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(8)
        .onEnd(() => {
          if (busySV.value) return;
          runOnJS(openFront)();
        }),
    [busySV, openFront]
  );

  const gesture = useMemo(() => Gesture.Exclusive(pan, tap), [pan, tap]);

  const frontItem = items.find((item) => item.id === frontId) ?? items[0] ?? null;

  if (items.length === 0) return null;

  return (
    <View style={[styles.stage, { height: cardHeight + 44, width: '100%' }]}>
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Circle cards"
          accessibilityHint="Swipe left or right to shuffle circles"
          style={[styles.stageInner, { width: '100%', height: cardHeight + 36 }]}>
          {items.map((item, index) => (
            <DeckCard
              key={item.id}
              item={item}
              index={index}
              indexSV={indexSV}
              countSV={countSV}
              frontX={frontX}
              flySV={flySV}
              flyIndexSV={flyIndexSV}
              flyDirSV={flyDirSV}
              settleSV={settleSV}
              widthSV={widthSV}
              throwDistSV={throwDistSV}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              cardLeft={cardLeft}
              onOpen={openFront}
            />
          ))}
        </Animated.View>
      </GestureDetector>

      {frontItem?.variant === 'circle' && frontItem.canInvite ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Invite someone to ${frontItem.name}`}
          onPress={() => onInvite(frontItem)}
          style={({ pressed }) => [
            styles.inviteFab,
            {
              opacity: pressed ? 0.88 : 1,
              right: cardLeft + 16,
              top: 86,
            },
          ]}>
          <NamedIcon name="share-outline" size={18} color={WHITE_RING} />
        </Pressable>
      ) : null}
    </View>
  );
});

CircleDeck.displayName = 'CircleDeck';

function DeckCard({
  item,
  index,
  indexSV,
  countSV,
  frontX,
  flySV,
  flyIndexSV,
  flyDirSV,
  settleSV,
  widthSV,
  throwDistSV,
  cardWidth,
  cardHeight,
  cardLeft,
  onOpen,
}: {
  item: CircleDeckItem;
  index: number;
  indexSV: SharedValue<number>;
  countSV: SharedValue<number>;
  frontX: SharedValue<number>;
  flySV: SharedValue<number>;
  flyIndexSV: SharedValue<number>;
  flyDirSV: SharedValue<number>;
  settleSV: SharedValue<number>;
  widthSV: SharedValue<number>;
  throwDistSV: SharedValue<number>;
  cardWidth: number;
  cardHeight: number;
  cardLeft: number;
  onOpen: () => void;
}) {
  const faces = item.members.slice(0, 3);
  const [coverFailed, setCoverFailed] = useState(false);
  const [defaultFailed, setDefaultFailed] = useState(false);
  const usingBundledFallback = coverFailed && item.variant === 'circle' && Boolean(item.coverUri);
  const coverSource = usingBundledFallback
    ? DEFAULT_CIRCLE_COVER
    : deckCoverSource(item.variant, item.id, item.coverUri);
  const showPhoto = !defaultFailed && !(coverFailed && item.variant === 'church');
  const icon = kindIcon(item.variant, item.kindLabel);

  useEffect(() => {
    setCoverFailed(false);
    setDefaultFailed(false);
  }, [item.coverUri, item.id]);

  const animatedStyle = useAnimatedStyle(() => {
    const count = countSV.value;
    const front = wrapIndex(indexSV.value, count);
    const depth = posMod(index - front, count);

    if (count <= 1) {
      return {
        opacity: 1,
        zIndex: 50,
        elevation: 10,
        transform: [{ translateX: 0 }, { translateY: 0 }, { rotateZ: '0deg' }, { scale: 1 }],
      };
    }

    if (flyIndexSV.value === index && flySV.value < 0.999) {
      const destDepth = posMod(index - front, count);
      const dest = poseAt(Math.min(2, Math.max(destDepth, 1)));
      const destOp = destDepth > 2 ? 0 : 1;
      const exit = flyDirSV.value * throwDistSV.value;
      const t = flySV.value;
      return {
        opacity: mix(1, destOp, t),
        zIndex: 8,
        elevation: 3,
        transform: [
          { translateX: mix(exit, 0, t) },
          { translateY: dest.y },
          { rotateZ: `${dest.rot}deg` },
          { scale: dest.scale },
        ],
      };
    }

    if (depth === 0) {
      const x = frontX.value;
      const tilt = (x / Math.max(widthSV.value, 1)) * 9;
      const peek = poseAt(1);
      const s = settleSV.value;
      return {
        opacity: 1,
        zIndex: 70,
        elevation: 14,
        transform: [
          { translateX: x },
          { translateY: mix(peek.y, 0, s) },
          { rotateZ: `${mix(peek.rot, 0, s) + tilt}deg` },
          { scale: mix(peek.scale, 1, s) },
        ],
      };
    }

    const pose = poseAt(depth);
    return {
      opacity: pose.op,
      zIndex: Math.round(pose.z),
      elevation: Math.max(1, Math.round(pose.z / 4)),
      transform: [{ translateX: 0 }, { translateY: pose.y }, { rotateZ: `${pose.rot}deg` }, { scale: pose.scale }],
    };
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.cardShadow,
        {
          width: cardWidth,
          height: cardHeight,
          left: cardLeft,
        },
        animatedStyle,
      ]}>
      <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
        {showPhoto ? (
          <Image
            recyclingKey={`${item.id}-${usingBundledFallback ? 'bundled' : item.coverUri ?? 'default'}`}
            source={coverSource}
            style={[styles.photo, { width: cardWidth, height: cardHeight }]}
            contentFit="cover"
            contentPosition="center"
            cachePolicy="memory-disk"
            transition={0}
            pointerEvents="none"
            onError={() => {
              if (usingBundledFallback || (item.variant === 'circle' && !item.coverUri)) {
                setDefaultFailed(true);
                return;
              }
              setCoverFailed(true);
            }}
          />
        ) : (
          <View pointerEvents="none" style={[styles.photo, { width: cardWidth, height: cardHeight, backgroundColor: WARM_FALLBACK }]} />
        )}

        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.38)', 'transparent']}
          style={styles.topScrim}
        />

        <View pointerEvents="none" style={styles.topRow}>
          <View style={styles.faces}>
            {faces.length > 0 ? (
              faces.map((member, faceIndex) => (
                <View
                  key={`${item.id}-${member.name}-${faceIndex}`}
                  style={[styles.face, { marginLeft: faceIndex === 0 ? 0 : -10, zIndex: 8 - faceIndex }]}>
                  <CircleAvatar name={member.name} size={36} />
                </View>
              ))
            ) : (
              <View style={styles.emptyFace}>
                <NamedIcon
                  name={item.variant === 'church' ? 'home-outline' : 'person-add-outline'}
                  size={16}
                  color={INK}
                />
              </View>
            )}
          </View>
          <View style={styles.meta}>
            <Text style={styles.kind} numberOfLines={1}>
              {item.kindLabel}
            </Text>
            <EmojiText style={styles.metaLine} numberOfLines={1}>
              {item.body}
            </EmojiText>
          </View>
        </View>

        <View pointerEvents="box-none" style={styles.footer}>
          <View style={styles.footerCopy} pointerEvents="none">
            <View style={styles.titleRow}>
              <NamedIcon name={icon} size={16} color={GOLD} />
              <EmojiText style={styles.name} numberOfLines={1}>
                {item.name}
              </EmojiText>
            </View>
            <EmojiText style={styles.footerLine} numberOfLines={1}>
              {item.footerLine}
            </EmojiText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${item.name}`}
            onPress={onOpen}
            hitSlop={4}
            style={({ pressed }) => [styles.viewPill, pressed && styles.viewPressed]}>
            <Text style={styles.viewLabel}>View</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
  },
  stageInner: {
    overflow: 'visible',
  },
  cardShadow: {
    position: 'absolute',
    top: 0,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  card: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: WARM_FALLBACK,
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 96,
  },
  topRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  faces: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  face: {
    borderRadius: 20,
    borderWidth: 2,
    borderColor: WHITE_RING,
  },
  emptyFace: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: WHITE_RING,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flexShrink: 1,
    alignItems: 'flex-end',
    maxWidth: '58%',
    paddingTop: 2,
  },
  kind: {
    color: WHITE_RING,
    fontFamily: Fonts.medium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: Tracking.subheading,
    textAlign: 'right',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  metaLine: {
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.88)',
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: Tracking.body,
    textAlign: 'right',
    includeFontPadding: false,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 88,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
    name: {
    flexShrink: 1,
    color: WHITE_RING,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    fontFamily: Fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: Tracking.subheading,
    includeFontPadding: false,
  },
  footerLine: {
    color: MUTED_ON_DARK,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: Tracking.body,
    includeFontPadding: false,
    paddingLeft: 24,
  },
  viewPill: {
    minHeight: 44,
    minWidth: 88,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: WHITE_RING,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.97 }],
  },
  viewLabel: {
    color: INK,
    fontFamily: Fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    includeFontPadding: false,
  },
  inviteFab: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(14, 14, 14, 0.42)',
    zIndex: 120,
  },
});

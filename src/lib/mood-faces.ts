import type { ImageSource } from 'expo-image';

import { Mood } from '@/lib/types';

export const MOOD_FACES: Record<Mood, ImageSource> = {
  sorrowful: require('../../assets/images/moods/sorrowful.gif'),
  grateful: require('../../assets/images/moods/grateful.gif'),
  hopeful: require('../../assets/images/moods/hopeful.jpg'),
  anxious: require('../../assets/images/moods/anxious.jpg'),
  joyful: require('../../assets/images/moods/joyful.jpg'),
  peaceful: require('../../assets/images/moods/peaceful.jpg'),
  weary: require('../../assets/images/moods/weary.jpg'),
  restless: require('../../assets/images/moods/restless.jpg'),
};

export function moodFace(mood: Mood): ImageSource {
  return MOOD_FACES[mood];
}

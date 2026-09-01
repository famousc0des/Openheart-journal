import { Ionicons } from '@expo/vector-icons';

import { Mood } from '@/lib/types';

export interface MoodOption {
  value: Mood;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'peaceful', label: 'Peaceful', icon: 'leaf-outline' },
  { value: 'joyful', label: 'Joyful', icon: 'happy-outline' },
  { value: 'grateful', label: 'Grateful', icon: 'heart-outline' },
  { value: 'hopeful', label: 'Hopeful', icon: 'sunny-outline' },
  { value: 'anxious', label: 'Anxious', icon: 'alert-circle-outline' },
  { value: 'weary', label: 'Weary', icon: 'moon-outline' },
  { value: 'sorrowful', label: 'Sorrowful', icon: 'rainy-outline' },
  { value: 'restless', label: 'Restless', icon: 'pulse-outline' },
];

export const MORNING_PROMPTS = [
  'What are you carrying into today that you want to hand over first?',
  'Where do you most need God’s presence today?',
  'What would it look like to walk through today unhurried?',
  'What are you hoping for this morning?',
  'Who do you want to love well today?',
  'What’s one thing you’re anxious about — and one thing you’re trusting God with instead?',
  'What verse or truth do you want to carry with you today?',
  'What does today ask of you, and what do you need to face it?',
];

export const EVENING_PROMPTS = [
  'Where did you notice God today, even faintly?',
  'What moment from today are you most grateful for?',
  'Where did you fall short today — and where do you need grace?',
  'What weighed on you today that you want to release before sleep?',
  'Who or what moved you today?',
  'What did today teach you about yourself or about God?',
  'What are you still holding onto that you want to lay down tonight?',
  'If you could relive one moment from today, which would it be, and why?',
];

export function promptForPeriod(period: 'morning' | 'evening'): string {
  const pool = period === 'morning' ? MORNING_PROMPTS : EVENING_PROMPTS;
  const dayIndex = Math.floor(Date.now() / 86400000);
  return pool[dayIndex % pool.length];
}

export function moodOption(mood?: Mood): MoodOption | undefined {
  return MOOD_OPTIONS.find((option) => option.value === mood);
}

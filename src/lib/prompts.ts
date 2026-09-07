import { Ionicons } from '@expo/vector-icons';

import { CheckInPeriod, Mood } from '@/lib/types';

export interface MoodOption {
  value: Mood;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'peaceful', label: 'Peaceful', icon: 'leaf-outline', color: '#D8F0E0' },
  { value: 'joyful', label: 'Joyful', icon: 'happy-outline', color: '#FDF0C8' },
  { value: 'grateful', label: 'Grateful', icon: 'heart-outline', color: '#F9DCE4' },
  { value: 'hopeful', label: 'Hopeful', icon: 'sunny-outline', color: '#FDE6D2' },
  { value: 'anxious', label: 'Anxious', icon: 'alert-circle-outline', color: '#E6DCF5' },
  { value: 'weary', label: 'Weary', icon: 'moon-outline', color: '#D9E4F5' },
  { value: 'sorrowful', label: 'Sorrowful', icon: 'rainy-outline', color: '#DCE8F0' },
  { value: 'restless', label: 'Restless', icon: 'pulse-outline', color: '#F5DED6' },
];

export const MORNING_PROMPTS = [
  'What are you carrying into today that you want to hand over first?',
  'Where do you most need God’s presence today?',
  'What would it look like to walk through today unhurried?',
  'What are you hoping for this morning?',
  'Who do you want to love well today?',
  'What’s one thing you’re anxious about, and one thing you’re trusting God with instead?',
  'What verse or truth do you want to carry with you today?',
  'What does today ask of you, and what do you need to face it?',
];

export const EVENING_PROMPTS = [
  'Where did you notice God today, even faintly?',
  'What moment from today are you most grateful for?',
  'Where did you fall short today, and where do you need grace?',
  'What weighed on you today that you want to release before sleep?',
  'Who or what moved you today?',
  'What did today teach you about yourself or about God?',
  'What are you still holding onto that you want to lay down tonight?',
  'If you could relive one moment from today, which would it be, and why?',
];

const MOOD_PROMPTS: Record<Mood, Record<CheckInPeriod, string>> = {
  peaceful: {
    morning: 'What is giving you peace this morning, and how can you carry it into today?',
    evening: 'Where did you feel most at peace today?',
  },
  joyful: {
    morning: 'What is bringing you joy this morning, and who could you share it with?',
    evening: 'What brought you joy today, even in a small way?',
  },
  grateful: {
    morning: 'What are you grateful for as you begin today?',
    evening: 'What moment from today are you most grateful for?',
  },
  hopeful: {
    morning: 'What are you hopeful for today, and what would one faithful step look like?',
    evening: 'What happened today that gave you hope for tomorrow?',
  },
  anxious: {
    morning: 'What feels uncertain right now, and what would help you feel supported today?',
    evening: 'What is still weighing on your mind, and what can you release tonight?',
  },
  weary: {
    morning: 'What feels heavy this morning, and where could you make room for rest?',
    evening: 'What drained you today, and what kind of rest do you need now?',
  },
  sorrowful: {
    morning: 'What is hurting today, and what do you need as you carry it?',
    evening: 'What sadness are you carrying tonight, and how can you be gentle with yourself?',
  },
  restless: {
    morning: 'What is making it hard to feel settled, and what might ground you today?',
    evening: 'What is keeping your heart unsettled, and what would help you slow down?',
  },
};

export function promptForPeriod(period: 'morning' | 'evening'): string {
  const pool = period === 'morning' ? MORNING_PROMPTS : EVENING_PROMPTS;
  const dayIndex = Math.floor(Date.now() / 86400000);
  return pool[dayIndex % pool.length];
}

export function promptForMood(mood: Mood | undefined, period: CheckInPeriod): string {
  return mood ? MOOD_PROMPTS[mood][period] : promptForPeriod(period);
}

export function moodOption(mood?: Mood): MoodOption | undefined {
  return MOOD_OPTIONS.find((option) => option.value === mood);
}

import { Mood, ScriptureVerse } from '@/lib/types';

// A small curated, public-domain (KJV) starter set for offline lookup.
// A full licensed translation is a pre-launch blocker noted separately.
export const VERSES: ScriptureVerse[] = [
  {
    ref: 'Psalm 23:1-3',
    text: 'The Lord is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul.',
    tags: ['peace', 'peaceful', 'rest', 'weary'],
  },
  {
    ref: 'Philippians 4:6-7',
    text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
    tags: ['anxious', 'anxiety', 'peace', 'worry'],
  },
  {
    ref: 'Matthew 11:28-29',
    text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls.',
    tags: ['weary', 'rest', 'tired'],
  },
  {
    ref: 'Lamentations 3:22-23',
    text: 'It is of the Lord’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.',
    tags: ['hopeful', 'morning', 'faithfulness'],
  },
  {
    ref: '1 Thessalonians 5:16-18',
    text: 'Rejoice evermore. Pray without ceasing. In every thing give thanks: for this is the will of God in Christ Jesus concerning you.',
    tags: ['grateful', 'joyful', 'gratitude'],
  },
  {
    ref: 'Psalm 34:18',
    text: 'The Lord is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
    tags: ['sorrowful', 'grief', 'brokenhearted'],
  },
  {
    ref: 'Joshua 1:9',
    text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the Lord thy God is with thee whithersoever thou goest.',
    tags: ['anxious', 'fear', 'courage', 'restless'],
  },
  {
    ref: 'Romans 8:28',
    text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
    tags: ['hopeful', 'trust'],
  },
  {
    ref: 'John 16:33',
    text: 'These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world.',
    tags: ['peaceful', 'peace', 'trouble'],
  },
  {
    ref: 'Psalm 46:1',
    text: 'God is our refuge and strength, a very present help in trouble.',
    tags: ['anxious', 'restless', 'trouble'],
  },
  {
    ref: 'Isaiah 40:31',
    text: 'But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
    tags: ['weary', 'hopeful', 'strength'],
  },
  {
    ref: 'Psalm 30:5',
    text: 'Weeping may endure for a night, but joy cometh in the morning.',
    tags: ['sorrowful', 'hopeful', 'morning'],
  },
  {
    ref: 'Proverbs 3:5-6',
    text: 'Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
    tags: ['restless', 'trust', 'guidance'],
  },
  {
    ref: 'Psalm 143:8',
    text: 'Cause me to hear thy lovingkindness in the morning; for in thee do I trust: cause me to know the way wherein I should walk; for I lift up my soul unto thee.',
    tags: ['morning', 'peaceful'],
  },
  {
    ref: 'James 1:2-3',
    text: 'My brethren, count it all joy when ye fall into divers temptations; knowing this, that the trying of your faith worketh patience.',
    tags: ['weary', 'joyful', 'trials'],
  },
  {
    ref: 'Psalm 4:8',
    text: 'I will both lay me down in peace, and sleep: for thou, Lord, only makest me dwell in safety.',
    tags: ['evening', 'peaceful', 'rest'],
  },
  {
    ref: 'Nehemiah 8:10',
    text: 'The joy of the Lord is your strength.',
    tags: ['joyful', 'weary', 'strength'],
  },
  {
    ref: '2 Corinthians 12:9',
    text: 'And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness.',
    tags: ['weary', 'grace', 'weakness'],
  },
  {
    ref: 'Psalm 139:23-24',
    text: 'Search me, O God, and know my heart: try me, and know my thoughts: and see if there be any wicked way in me, and lead me in the way everlasting.',
    tags: ['evening', 'reflection'],
  },
  {
    ref: 'Habakkuk 3:17-18',
    text: 'Although the fig tree shall not blossom... yet I will rejoice in the Lord, I will joy in the God of my salvation.',
    tags: ['sorrowful', 'joyful', 'trust'],
  },
];

export function searchVerses(query: string): ScriptureVerse[] {
  const q = query.trim().toLowerCase();
  if (!q) return VERSES;
  return VERSES.filter(
    (verse) =>
      verse.ref.toLowerCase().includes(q) ||
      verse.text.toLowerCase().includes(q) ||
      verse.tags.some((tag) => tag.includes(q))
  );
}

export function versesForMood(mood: Mood): ScriptureVerse[] {
  return VERSES.filter((verse) => verse.tags.includes(mood));
}

export function verseByRef(ref: string): ScriptureVerse | undefined {
  return VERSES.find((verse) => verse.ref === ref);
}

export function verseOfTheDay(): ScriptureVerse {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return VERSES[dayIndex % VERSES.length];
}

// Mechanical, on-device tidy-up for sermon notes: spelling/punctuation/structure only.
// It never invents new content, a whitelist of shorthand expansions is the only
// vocabulary it can add, and a guardrail diffs output against input to catch anything else.

import { postAppJson } from '@/lib/app-api';

const EXPANSIONS: Record<string, string> = {
  'w/': 'with',
  'w/o': 'without',
  'b/c': 'because',
  '&': 'and',
  '+': 'and',
  thru: 'through',
  esp: 'especially',
  yrs: 'years',
  vs: 'versus',
  btwn: 'between',
  gov: 'government',
  govt: 'government',
};

const SPELLING_CORRECTIONS: Record<string, string> = {
  acheive: 'achieve',
  beleive: 'believe',
  recieve: 'receive',
  seperate: 'separate',
  definately: 'definitely',
  occured: 'occurred',
  untill: 'until',
  wich: 'which',
  becuase: 'because',
  mispelling: 'misspelling',
  didnt: "didn't",
  doesnt: "doesn't",
  isnt: "isn't",
  wasnt: "wasn't",
  couldnt: "couldn't",
  wouldnt: "wouldn't",
  shouldnt: "shouldn't",
  dont: "don't",
  cant: "can't",
};

export interface Expansion {
  from: string;
  to: string;
}

export interface TidyResult {
  text: string;
  changed: boolean;
  fellBack: boolean;
  expansions: Expansion[];
}

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function capitalizeSentences(text: string): string {
  return text.replace(/(^\s*[a-z]|[.!?]\s+[a-z])/g, (match) => match.toUpperCase());
}

function ensureTerminalPunctuation(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return trimmed;
  if (/[.!?:;,)"'”]$/.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

export function tidySermonNotesLocal(raw: string): TidyResult {
  const expansionsApplied: Expansion[] = [];

  const tidiedLines = raw.split('\n').map((line) => {
    const collapsed = line
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .trim();
    if (!collapsed) return '';

    const expanded = collapsed.replace(/\b[\w/+'’-]+\b|[&+]/g, (word) => {
      const key = word.toLowerCase().replace('’', "'");
      const replacement = EXPANSIONS[key] ?? SPELLING_CORRECTIONS[key];
      if (replacement) {
        expansionsApplied.push({ from: word, to: replacement });
        return replacement;
      }
      return word;
    });

    return ensureTerminalPunctuation(capitalizeSentences(expanded));
  });

  const tidied = tidiedLines.join('\n');

  const inputWords = new Set(tokenizeWords(raw));
  const allowedExtra = new Set(
    [...Object.values(EXPANSIONS), ...Object.values(SPELLING_CORRECTIONS)].flatMap((value) =>
      tokenizeWords(value)
    )
  );
  const introducedWords = tokenizeWords(tidied).filter(
    (word) => !inputWords.has(word) && !allowedExtra.has(word)
  );

  if (introducedWords.length > 0) {
    return { text: raw, changed: false, fellBack: true, expansions: [] };
  }

  return {
    text: tidied,
    changed: tidied !== raw.trim(),
    fellBack: false,
    expansions: expansionsApplied,
  };
}

export async function tidySermonNotes(raw: string): Promise<TidyResult> {
  try {
    const result = await postAppJson<{ text?: unknown }>('/api/sermon/tidy', { notes: raw });
    if (typeof result.text !== 'string' || !result.text.trim()) {
      throw new Error('empty');
    }
    const text = result.text.trim();
    return {
      text,
      changed: text !== raw.trim(),
      fellBack: false,
      expansions: [],
    };
  } catch {
    return tidySermonNotesLocal(raw);
  }
}

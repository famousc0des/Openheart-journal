// Mechanical, on-device tidy-up for sermon notes: spelling/punctuation/structure only.
// It never invents new content — a whitelist of shorthand expansions is the only
// vocabulary it can add, and a guardrail diffs output against input to catch anything else.

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

export function tidySermonNotes(raw: string): TidyResult {
  const expansionsApplied: Expansion[] = [];

  const tidiedLines = raw.split('\n').map((line) => {
    const collapsed = line
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1')
      .trim();
    if (!collapsed) return '';

    const expanded = collapsed.replace(/\S+/g, (word) => {
      const key = word.toLowerCase();
      const replacement = EXPANSIONS[key];
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
  const allowedExtra = new Set(Object.values(EXPANSIONS).flatMap((value) => tokenizeWords(value)));
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

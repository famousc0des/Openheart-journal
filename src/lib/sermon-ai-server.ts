const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

function anthropicKey() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    throw new Error('Add ANTHROPIC_API_KEY to your .env file and restart Expo.');
  }
  return key;
}

function anthropicModel() {
  return process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5';
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders() });
}

export async function readRequestJson<T>(request: Request): Promise<T> {
  const raw = await request.text();
  if (!raw.trim()) {
    throw new Error('The request body was empty.');
  }
  return parseJson<T>(raw, 'The request body was not valid JSON.');
}

function parseJson<T>(raw: string, fallbackMessage: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}

async function complete(prompt: string, maxTokens: number) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicKey(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: anthropicModel(),
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const raw = await response.text();
  const payload = raw.trim()
    ? parseJson<{ error?: { message?: string }; content?: { type: string; text?: string }[] }>(
        raw,
        'Anthropic returned an incomplete response. Try again.'
      )
    : {};

  if (!response.ok) {
    throw new Error(payload.error?.message || 'Anthropic could not complete this request.');
  }

  const text = payload.content?.find((block) => block.type === 'text')?.text?.trim();
  if (!text) throw new Error('Anthropic returned an empty response.');
  return text;
}

export async function tidyNotesWithAnthropic(raw: string) {
  return complete(
    `You are cleaning up a person's private notes or Sunday reflection. They typed quickly, so the draft may be fragments, missing verbs, run-ons, mixed-up word order, or unclear grammar.

Rewrite the text so every sentence is grammatical and easy to read.

Rules:
- Keep their meaning, voice, first person, emotion, and the order of their ideas.
- Fix spelling, punctuation, capitalization, and line breaks.
- Expand common shorthand (w/, w/o, b/c, thru, dont, doesnt, etc).
- Turn fragments into complete sentences when the intended meaning is obvious from context.
- Join related fragments that clearly belong to one thought.
- Split run-on sentences.
- Do not invent theology, scripture, people, events, headings, or points they did not write.
- Do not make it more eloquent or more spiritual than they were.
- Do not add a title, preamble, or commentary.
- Return only the rewritten text.

Draft:
${raw}`,
    4096
  );
}

import { corsHeaders, jsonResponse, readRequestJson, tidyNotesWithAnthropic } from '@/lib/sermon-ai-server';

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const body = await readRequestJson<{ notes?: unknown }>(request);
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    if (!notes) return jsonResponse({ error: 'Notes are required.' }, 400);

    const text = await tidyNotesWithAnthropic(notes);
    return jsonResponse({ text });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Notes could not be tidied.';
    return jsonResponse({ error: message }, 500);
  }
}

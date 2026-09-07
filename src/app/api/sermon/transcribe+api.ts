import { corsHeaders, jsonResponse, readRequestJson } from '@/lib/sermon-ai-server';
import { readTranscribeJob, startYoutubeTranscribeJob } from '@/lib/transcribe-jobs';

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  const jobId = new URL(request.url).searchParams.get('job');
  if (!jobId) return jsonResponse({ error: 'A job id is required.' }, 400);
  const job = readTranscribeJob(jobId);
  if (!job) return jsonResponse({ error: 'That transcription job was not found.' }, 404);
  return jsonResponse(job);
}

export async function POST(request: Request) {
  try {
    const body = await readRequestJson<{ url?: unknown }>(request);
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (!url) return jsonResponse({ error: 'A YouTube link is required.' }, 400);

    const job = startYoutubeTranscribeJob(url);
    return jsonResponse(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The sermon could not be transcribed.';
    return jsonResponse({ error: message }, 500);
  }
}

import { getAppJson, postAppJson } from '@/lib/app-api';

export function isYouTubeUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname);
  } catch {
    return false;
  }
}

type TranscribeJob = {
  id?: string;
  status?: string;
  message?: string;
  transcript?: string;
  error?: string;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function transcribeSermonVideo(
  youtubeUrl: string,
  onStatus?: (message: string) => void
): Promise<string> {
  const started = await postAppJson<TranscribeJob>('/api/sermon/transcribe', { url: youtubeUrl });
  if (!started.id) throw new Error('Transcription did not start.');

  onStatus?.(started.message || 'Downloading sermon audio…');

  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    await wait(2000);
    const job = await getAppJson<TranscribeJob>(`/api/sermon/transcribe?job=${encodeURIComponent(started.id)}`);
    if (job.message) onStatus?.(job.message);
    if (job.status === 'done') {
      if (!job.transcript?.trim()) throw new Error('The transcription service returned an empty transcript.');
      return job.transcript.trim();
    }
    if (job.status === 'error') {
      throw new Error(job.error || 'The sermon could not be transcribed.');
    }
  }

  throw new Error('Transcription timed out. Try a shorter video, or add a GROQ_API_KEY for faster speech-to-text.');
}

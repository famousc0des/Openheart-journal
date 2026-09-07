// Server-only helper for Expo API routes. Node builtins are valid here, not in the app bundle.
// @ts-nocheck
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type TranscribeJob = {
  id: string;
  status: 'queued' | 'downloading' | 'transcribing' | 'writing' | 'done' | 'error';
  message?: string;
  transcript?: string;
  error?: string;
};

function jobsDir() {
  return path.join(os.tmpdir(), 'openheart-transcribe');
}

function jobPath(id: string) {
  return path.join(jobsDir(), `${id}.json`);
}

export function readTranscribeJob(id: string): TranscribeJob | null {
  try {
    return JSON.parse(fs.readFileSync(jobPath(id), 'utf8')) as TranscribeJob;
  } catch {
    return null;
  }
}

export function startYoutubeTranscribeJob(youtubeUrl: string): TranscribeJob {
  const id = randomUUID();
  fs.mkdirSync(jobsDir(), { recursive: true });
  const job: TranscribeJob = {
    id,
    status: 'queued',
    message: 'Starting…',
  };
  fs.writeFileSync(jobPath(id), JSON.stringify(job, null, 2));

  const script = path.join(process.cwd(), 'scripts', 'youtube-transcribe.cjs');
  const child = spawn(process.execPath, [script, id, youtubeUrl], {
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  return job;
}

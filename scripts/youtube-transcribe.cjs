const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const jobId = process.argv[2];
const youtubeUrl = process.argv[3];

if (!jobId || !youtubeUrl) {
  console.error('Usage: node scripts/youtube-transcribe.cjs <jobId> <youtubeUrl>');
  process.exit(1);
}

loadDotEnv();

const jobsDir = path.join(os.tmpdir(), 'openheart-transcribe');
const jobPath = path.join(jobsDir, `${jobId}.json`);
const workDir = path.join(jobsDir, jobId);

function loadDotEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equals = trimmed.indexOf('=');
    if (equals < 1) continue;
    const key = trimmed.slice(0, equals).trim();
    const value = trimmed.slice(equals + 1).trim();
    if (key && process.env[key] == null) process.env[key] = value;
  }
}

function writeJob(patch) {
  fs.mkdirSync(jobsDir, { recursive: true });
  let current = {};
  try {
    current = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
  } catch {
    current = { id: jobId, status: 'queued' };
  }
  fs.writeFileSync(jobPath, JSON.stringify({ ...current, ...patch, id: jobId }, null, 2));
}

function fail(message) {
  writeJob({ status: 'error', error: message });
  cleanup();
  process.exit(1);
}

function cleanup() {
  fs.rmSync(workDir, { recursive: true, force: true });
}

function anthropicKey() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) fail('Add ANTHROPIC_API_KEY to your .env file and restart Expo.');
  return key;
}

async function complete(prompt, maxTokens) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': anthropicKey(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const raw = await response.text();
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    fail('Anthropic returned an incomplete response.');
  }
  if (!response.ok) {
    fail(payload.error?.message || 'Anthropic could not complete this request.');
  }
  const text = payload.content?.find((block) => block.type === 'text')?.text?.trim();
  if (!text) fail('Anthropic returned an empty response.');
  return text;
}

function downloadAudio(url, mp3Path) {
  const youtubedl = require('youtube-dl-exec');
  const ffmpegPath = require('ffmpeg-static');
  if (!ffmpegPath) fail('ffmpeg-static is missing. Run bun install and try again.');

  return youtubedl(url, {
    output: mp3Path.replace(/\.mp3$/, '.%(ext)s'),
    extractAudio: true,
    audioFormat: 'mp3',
    audioQuality: 7,
    noPlaylist: true,
    ffmpegLocation: ffmpegPath,
    format: 'bestaudio/best',
  });
}

function toWav(mp3Path, wavPath) {
  const ffmpegPath = require('ffmpeg-static');
  const result = spawnSync(
    ffmpegPath,
    ['-y', '-i', mp3Path, '-ar', '16000', '-ac', '1', wavPath],
    { encoding: 'utf8' }
  );
  if (result.status !== 0) {
    fail(result.stderr || 'Could not convert the sermon audio.');
  }
}

async function transcribeCloud(mp3Path, endpoint, apiKey, model) {
  const bytes = fs.readFileSync(mp3Path);
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'audio/mpeg' }), 'sermon.mp3');
  form.append('model', model);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const raw = await response.text();
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return null;
  }
  if (!response.ok || typeof payload.text !== 'string' || !payload.text.trim()) {
    return null;
  }
  return payload.text.trim();
}

async function transcribeSpeech(mp3Path, wavPath) {
  const groqKey = process.env.GROQ_API_KEY?.trim();
  if (groqKey) {
    const text = await transcribeCloud(
      mp3Path,
      'https://api.groq.com/openai/v1/audio/transcriptions',
      groqKey,
      'whisper-large-v3'
    );
    if (text) return text;
  }

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    const text = await transcribeCloud(
      mp3Path,
      'https://api.openai.com/v1/audio/transcriptions',
      openaiKey,
      'whisper-1'
    );
    if (text) return text;
  }

  toWav(mp3Path, wavPath);
  writeJob({ status: 'transcribing', message: 'Transcribing speech on this computer…' });
  const { pipeline, env } = await import('@xenova/transformers');
  env.cacheDir = path.join(__dirname, '..', '.cache', 'whisper');
  const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en');
  const result = await transcriber(wavPath, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true,
  });
  const text = typeof result === 'string' ? result : result?.text;
  if (typeof text !== 'string' || !text.trim()) {
    fail('Speech-to-text returned an empty transcript.');
  }
  return text.trim();
}

async function run() {
  writeJob({ status: 'downloading', message: 'Downloading sermon audio from YouTube…' });
  fs.mkdirSync(workDir, { recursive: true });
  const mp3Path = path.join(workDir, 'sermon.mp3');
  const wavPath = path.join(workDir, 'sermon.wav');

  try {
    await downloadAudio(youtubeUrl, mp3Path);
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Could not download this YouTube audio.');
  }

  if (!fs.existsSync(mp3Path)) {
    const found = fs.readdirSync(workDir).find((name) => name.endsWith('.mp3'));
    if (!found) fail('The sermon audio did not download.');
    fs.renameSync(path.join(workDir, found), mp3Path);
  }

  writeJob({ status: 'transcribing', message: 'Listening to the sermon and transcribing speech…' });
  const speech = await transcribeSpeech(mp3Path, wavPath);

  writeJob({ status: 'writing', message: 'Claude is writing notes from the transcript…' });
  const notes = await complete(
    `This is an automatic speech transcript of a sermon or Christian talk. The listener did not watch the video. Write notes they can keep.

Structure:
1. A short summary (3-6 sentences)
2. Key points as bullets
3. Scripture mentioned, if any (only if it appears in the transcript)
4. A cleaned full transcript with paragraphs

Do not invent quotes, points, or verses. If a stretch is garbled, say so briefly.

Transcript:
${speech}`,
    16384
  );

  writeJob({ status: 'done', transcript: notes, message: 'Done' });
  cleanup();
}

run().catch((error) => {
  fail(error instanceof Error ? error.message : 'The sermon could not be transcribed.');
});

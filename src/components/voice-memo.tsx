import { NamedIcon } from '@/components/ui/icon';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const RECORD_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  directory: 'document' as const,
  isMeteringEnabled: true,
};

const WAVE_BARS = 36;

function meterToUnit(db?: number) {
  if (db == null || Number.isNaN(db)) return 0.18;
  return Math.max(0.08, Math.min(1, (db + 55) / 50));
}

function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function levelsFromUri(uri: string) {
  const bars: number[] = [];
  for (let i = 0; i < WAVE_BARS; i += 1) {
    let hash = 0;
    const slice = `${uri}:${i}`;
    for (let n = 0; n < slice.length; n += 1) hash = (hash * 33 + slice.charCodeAt(n)) % 997;
    bars.push(0.18 + (hash % 82) / 100);
  }
  return bars;
}

function Waveform({
  levels,
  progress,
  activeColor,
  restColor,
}: {
  levels: number[];
  progress?: number;
  activeColor: string;
  restColor: string;
}) {
  const bars = levels.length > 0 ? levels : Array.from({ length: WAVE_BARS }, () => 0.16);
  return (
    <View style={styles.wave} accessibilityLabel="Voice waveform">
      {bars.map((level, index) => {
        const t = (index + 0.5) / bars.length;
        const lit = progress == null || t <= progress;
        return (
          <View
            key={`${index}-${level.toFixed(2)}`}
            style={[
              styles.bar,
              {
                height: 6 + level * 34,
                backgroundColor: lit ? activeColor : restColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export function VoiceMemo({
  uri,
  onChange,
}: {
  uri?: string;
  onChange: (next?: string) => void;
}) {
  const theme = useTheme();
  const recorder = useAudioRecorder(RECORD_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 80);
  const [busy, setBusy] = useState(false);
  const [levels, setLevels] = useState<number[]>([]);

  useEffect(() => {
    if (!recorderState.isRecording) return;
    setLevels((prev) => {
      const next = [...prev, meterToUnit(recorderState.metering)];
      return next.length > WAVE_BARS ? next.slice(next.length - WAVE_BARS) : next;
    });
  }, [recorderState.isRecording, recorderState.metering, recorderState.durationMillis]);

  async function start() {
    if (Platform.OS === 'web') {
      Alert.alert('Voice notes', 'Recording is available on iPhone and Android.');
      return;
    }
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert('Microphone is off', 'Allow microphone access to leave a voice note.');
      return;
    }
    setBusy(true);
    setLevels([]);
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      Alert.alert('Could not start recording', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setBusy(true);
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      onChange(recorder.uri ?? undefined);
    } catch {
      Alert.alert('Could not save the recording');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold">Voice</ThemedText>
      {uri ? (
        <>
          <VoicePlayer uri={uri} levels={levels} />
          <Pressable
            onPress={() => {
              setLevels([]);
              onChange(undefined);
            }}
            hitSlop={8}>
            <ThemedText type="small" themeColor="accent">
              Remove recording
            </ThemedText>
          </Pressable>
        </>
      ) : (
        <>
          {recorderState.isRecording ? (
            <View style={styles.liveBlock}>
              <Waveform
                levels={levels}
                activeColor={theme.accent}
                restColor={theme.border}
              />
              <ThemedText type="small" themeColor="textSecondary">
                {formatClock(recorderState.durationMillis / 1000)}
              </ThemedText>
            </View>
          ) : null}
          <Pressable
            disabled={busy}
            onPress={recorderState.isRecording ? stop : start}
            style={[styles.record, { backgroundColor: theme.primary, opacity: busy ? 0.5 : 1 }]}>
            <NamedIcon
              name="mic-outline"
              altName="stop"
              showAlt={recorderState.isRecording}
              size={18}
              color={theme.onPrimary}
            />
            <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
              {recorderState.isRecording ? 'Stop' : 'Record a voice note'}
            </ThemedText>
          </Pressable>
        </>
      )}
    </View>
  );
}

export function VoicePlayer({ uri, levels }: { uri: string; levels?: number[] }) {
  const theme = useTheme();
  const player = useAudioPlayer(uri, { updateInterval: 80 });
  const status = useAudioPlayerStatus(player);
  const shape = useMemo(() => (levels && levels.length > 4 ? levels : levelsFromUri(uri)), [levels, uri]);
  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  useEffect(() => {
    if (!status.didJustFinish) return;
    player.pause();
    player.seekTo(0);
  }, [status.didJustFinish, player]);

  async function toggle() {
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || status.currentTime >= status.duration - 0.05) {
      await player.seekTo(0);
    }
    player.play();
  }

  return (
    <View style={styles.player}>
      <Waveform
        levels={shape}
        progress={status.playing || status.currentTime > 0 ? progress : 1}
        activeColor={theme.accent}
        restColor={theme.border}
      />
      <View style={styles.playerRow}>
        <Pressable
          onPress={() => void toggle()}
          style={[styles.play, { borderColor: theme.border }]}>
          <NamedIcon name="play" altName="pause" showAlt={status.playing} size={16} color={theme.accent} />
          <ThemedText type="smallBold" themeColor="accent">
            {status.playing ? 'Pause' : 'Play'}
          </ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          {formatClock(status.currentTime)} / {formatClock(status.duration)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.large,
  },
  liveBlock: {
    gap: Spacing.two,
    alignItems: 'center',
  },
  wave: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
  },
  bar: {
    flex: 1,
    maxWidth: 4,
    borderRadius: 2,
  },
  record: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.pill,
  },
  player: {
    gap: Spacing.two,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  play: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

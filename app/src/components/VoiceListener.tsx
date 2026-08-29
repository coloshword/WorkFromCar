import React, { useState, useEffect, useRef } from "react";
import { Text, StyleSheet, View, AppState, type AppStateStatus } from "react-native";
import { startVadStreaming, stopVadStreaming } from "../services/audio/voiceProcessor";
import NativeWhisper from 'whisper/src/NativeWhisper';

export type VoiceListenerState = 'listening' | 'speaking' | 'transcribing' | 'disabled';

const SILENCE_THRESHOLD = 100;
const MAX_SPEECH_SAMPLES = 480_000;
const RING_BUFFER_SIZE = 10;
interface Props {
  state: VoiceListenerState;
  onStateChange: (state: VoiceListenerState) => void;
  onTranscript?: (text: string) => void;
}

export default function VoiceListener({ state, onStateChange, onTranscript }: Props) {
  const stateRef = useRef<VoiceListenerState>(state);
  const onStateChangeRef = useRef(onStateChange);
  const onTranscriptRef = useRef(onTranscript);
  const [prob, setProb] = useState<string>('');

  const isActive = state !== 'disabled';
  const [foregroundEpoch, setForegroundEpoch] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const onAppStateChange = (next: AppStateStatus) => {
      if (next === "active") {
        setForegroundEpoch((n) => n + 1);
      }
    };
    const sub = AppState.addEventListener("change", onAppStateChange);
    return () => sub.remove();
  }, [isActive]);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  useEffect(() => {
    if (!isActive) return;

    let isMounted = true;
    let vadBusy = false;
    let lastVadIsSpeech = false;
    let silenceFrameCount = 0;
    const speechBuffer: number[] = [];
    const ringBuffer: number[][] = [];
    let ringBufferIndex = 0;

    const getRingBufferContents = (): number[] => {
      const result: number[] = [];
      const count = Math.min(ringBufferIndex, RING_BUFFER_SIZE);
      const start = ringBufferIndex - count;
      for (let i = start; i < ringBufferIndex; i++) {
        result.push(...ringBuffer[i % RING_BUFFER_SIZE]);
      }
      return result;
    };

    const triggerTranscription = () => {
      if (speechBuffer.length === 0) {
        silenceFrameCount = 0;
        stateRef.current = 'listening';
        onStateChangeRef.current('listening');
        return;
      }

      stateRef.current = 'transcribing';
      onStateChangeRef.current('transcribing');
      const buffer = [...speechBuffer];
      speechBuffer.length = 0;
      silenceFrameCount = 0;
      lastVadIsSpeech = false;

      NativeWhisper.pcmBufferToText(buffer)
        .then((text) => {
          if (!isMounted) return;
          onTranscriptRef.current?.(text);
        })
        .catch((err) => {
          console.log('[VAD] transcription error:', err);
          if (!isMounted) return;
          stateRef.current = 'listening';
          onStateChangeRef.current('listening');
        });
    };

    const onFrame = (frame: number[]) => {
      ringBuffer[ringBufferIndex % RING_BUFFER_SIZE] = frame;
      ringBufferIndex++;

      const currentState = stateRef.current;
      if (currentState === 'disabled' || currentState === 'transcribing') return;

      if (currentState === 'speaking') {
        speechBuffer.push(...frame);
      }

      if (lastVadIsSpeech) {
        silenceFrameCount = 0;
        if (currentState === 'listening') {
          speechBuffer.push(...getRingBufferContents(), ...frame);
          stateRef.current = 'speaking';
          onStateChangeRef.current('speaking');
        }
      } else if (currentState === 'speaking') {
        silenceFrameCount++;
        if (silenceFrameCount >= SILENCE_THRESHOLD || speechBuffer.length >= MAX_SPEECH_SAMPLES) {
          triggerTranscription();
          return;
        }
      }

      if (!vadBusy) {
        vadBusy = true;
        NativeWhisper.vadProcessBuffer(frame)
          .then(({ prob: p }) => {
            lastVadIsSpeech = p > 0.4;
            if (isMounted) setProb(` ${p.toFixed(2)}`);
            vadBusy = false;
          })
          .catch(() => { vadBusy = false; });
      }
    };

    startVadStreaming(onFrame);

    return () => {
      isMounted = false;
      stopVadStreaming();
    };
  }, [isActive, foregroundEpoch]);
  return (
    <View style={styles.content}>
      <Text style={styles.text}>
        {state}{prob}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  idle: {
    backgroundColor: '#2196F3',
  },
  recording: {
    backgroundColor: '#F44336',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginRight: 10,
  },
  indicatorActive: {
    backgroundColor: '#FFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  text: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

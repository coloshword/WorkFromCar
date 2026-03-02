import React, { useState, useEffect, useRef } from "react";
import { Text, StyleSheet, View } from "react-native";
import { startVadStreaming, stopVadStreaming } from "../services/audio/voiceProcessor";
import NativeWhisper from 'whisper/src/NativeWhisper';

export type VoiceListenerState = 'listening' | 'speaking' | 'transcribing' | 'disabled';

interface Props {
  state: VoiceListenerState;
  onStateChange: (state: VoiceListenerState) => void;
  onTranscript?: (text: string) => void;
}


export default function VoiceListener({ state, onStateChange, onTranscript }: Props) {
  const stateRef = useRef<VoiceListenerState>(state);
  const [prob, setProb] = useState<string>('');
  const isVadActive = state !== 'disabled' && state !== 'transcribing';
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => {

    let isProcessing: boolean = false;
    let silenceCount = 0;
    const speechBuffer: number[] = [];
    let isMounted = true;

    const onFrame = async (frame: number[]) => {
      if (stateRef.current === 'disabled' || stateRef.current === 'transcribing') return;
      if (isProcessing) return;
      isProcessing = true;
      try {
        const { prob } = await NativeWhisper.vadProcessBuffer(frame);
        const isSpeech = prob > 0.4;
        if (isMounted) setProb(` ${prob.toFixed(2)}`);
        if (isSpeech) {
          silenceCount = 0;
          speechBuffer.push(...frame);
          if (stateRef.current === 'listening') onStateChange('speaking');
        } else if (stateRef.current === 'speaking') {
          silenceCount++;
          if (silenceCount >= 30) {
            await stopVadStreaming();
            onStateChange('transcribing');
            const text = await NativeWhisper.pcmBufferToText(speechBuffer);
            onTranscript?.(text);
            speechBuffer.length = 0;
            silenceCount = 0;
            await startVadStreaming(onFrame);
            onStateChange('listening');
          }
        }
      } finally {
        isProcessing = false;
      }
    };

    if (isVadActive) {
      startVadStreaming(onFrame);
    }
    return () => {
      isMounted = false;
      stopVadStreaming();
    };
  }, [isVadActive, onStateChange, onTranscript]);
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

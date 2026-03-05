import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Pressable, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native';
import { useWindowDimensions } from 'react-native';
import RNFS from 'react-native-fs';
import NativeWhisper from 'whisper/src/NativeWhisper';
import NativeKokoro from 'kokoro/src/NativeKokoro';
import { VoiceProcessor } from '@picovoice/react-native-voice-processor';
import { FRAME_LENGTH, FREQUENCY_HZ } from '../services/audio/voiceProcessor';
import AudioVisualizer from '../components/AudioVisualizer';
import VoiceListener, { VoiceListenerState } from '../components/VoiceListener';

const MODEL_FILENAME = 'ggml-tiny.en-q5_1.bin';
const VAD_FILENAME = 'ggml-silero-v6.2.0.bin';
const MODEL_PATH = `${RNFS.MainBundlePath}/${MODEL_FILENAME}`;
const VAD_PATH = `${RNFS.MainBundlePath}/${VAD_FILENAME}`;
const KOKORO_MODEL_DIR = `${RNFS.MainBundlePath}/sherpa-onnx-kokoro-en-v0_19`;

export default function VoiceDashboard2() {
  const { height } = useWindowDimensions();
  const [voiceListenerState, setVoiceListenerState] = useState<VoiceListenerState>('disabled');
  const [transcript, setTranscript] = useState('');
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        await VoiceProcessor.instance.start(FRAME_LENGTH, FREQUENCY_HZ);
        await VoiceProcessor.instance.stop();
      } catch (_) {}
    };
    requestMicPermission();
  }, []);

  const handleLoadModel = async () => {
    setModelStatus('loading');
    setStatusMsg('Loading models...');
    try {
      await NativeWhisper.loadModel(MODEL_PATH);
      await NativeKokoro.loadModel(KOKORO_MODEL_DIR);
      await NativeWhisper.initVad(VAD_PATH);
      setModelStatus('ready');
      setStatusMsg('');
      setVoiceListenerState('listening');
    } catch (e: any) {
      setModelStatus('error');
      setStatusMsg(`Error: ${e.message}`);
    }
  };

  const handleTranscript = useCallback((text: string) => {
    if (text.trim()) setTranscript(text.trim());
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.topbar}>
        <Text style={styles.topbarTitle}>Voice</Text>
        {modelStatus !== 'ready' && (
          <Pressable
            style={[styles.loadBtn, modelStatus === 'loading' && styles.loadBtnDisabled]}
            onPress={handleLoadModel}
            disabled={modelStatus === 'loading'}
          >
            {modelStatus === 'loading'
              ? <ActivityIndicator size="small" color="#e8fff6" />
              : <Text style={styles.loadBtnText}>Load Model</Text>
            }
          </Pressable>
        )}
        {modelStatus === 'ready' && (
          <View style={styles.readyBadge}>
            <Text style={styles.readyBadgeText}>Ready</Text>
          </View>
        )}
      </View>

      <View style={[styles.visualizerContainer, { paddingTop: height * 0.15 }]}>
        <AudioVisualizer mode={voiceListenerState} />
        <Text style={styles.modeLabel}>{voiceListenerState}</Text>
      </View>

      {statusMsg ? (
        <Text style={styles.statusMsg}>{statusMsg}</Text>
      ) : null}

      <View style={styles.transcriptBox}>
        <ScrollView
          style={styles.transcriptScroll}
          contentContainerStyle={styles.transcriptContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={transcript ? styles.transcriptText : styles.transcriptPlaceholder}>
            {transcript || 'Say something...'}
          </Text>
        </ScrollView>
      </View>

      <View style={styles.voiceListenerWrapper}>
        <VoiceListener
          state={voiceListenerState}
          onStateChange={setVoiceListenerState}
          onTranscript={handleTranscript}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f271f',
  },
  topbar: {
    height: 80,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#08110e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  topbarTitle: {
    color: '#e5e7eb',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  loadBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(232,255,246,0.25)',
    backgroundColor: 'rgba(232,255,246,0.07)',
    minWidth: 100,
    alignItems: 'center',
  },
  loadBtnDisabled: {
    opacity: 0.5,
  },
  loadBtnText: {
    color: '#e8fff6',
    fontSize: 13,
    fontWeight: '600',
  },
  readyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  readyBadgeText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '600',
  },
  visualizerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modeLabel: {
    marginTop: 12,
    color: 'rgba(232,255,246,0.45)',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusMsg: {
    textAlign: 'center',
    color: 'rgba(229,231,235,0.5)',
    fontSize: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  transcriptBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    maxHeight: 120,
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  transcriptScroll: {
    flex: 1,
  },
  transcriptContent: {
    padding: 14,
  },
  transcriptText: {
    color: '#e5e7eb',
    fontSize: 15,
    lineHeight: 22,
  },
  transcriptPlaceholder: {
    color: 'rgba(154,164,178,0.7)',
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  voiceListenerWrapper: {
    position: 'absolute',
    bottom: -999,
    opacity: 0,
  },
});

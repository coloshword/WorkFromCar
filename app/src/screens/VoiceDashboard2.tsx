import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Pressable, Text, View, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { StyleSheet } from 'react-native';
import { useWindowDimensions } from 'react-native';
import RNFS from 'react-native-fs';
import NativeWhisper from 'whisper/src/NativeWhisper';
import NativeKokoro from 'kokoro/src/NativeKokoro';
import { VoiceProcessor } from '@picovoice/react-native-voice-processor';
import { FRAME_LENGTH, FREQUENCY_HZ } from '../services/audio/voiceProcessor';
import AudioVisualizer from '../components/AudioVisualizer';
import VoiceListener, { VoiceListenerState } from '../components/VoiceListener';
import { sendAgentMessage, callSummarize } from '../utils/useSendMessage';
import { Message, AgentTool } from '../../../types/Agent';
import { speak } from '../utils/ttsUtils';
import { executeTool } from '../api/toolExecutor';
import { useAccessToken } from '../context/AccessTokenContext';

const MODEL_FILENAME = 'ggml-tiny.en-q5_1.bin';
const VAD_FILENAME = 'ggml-silero-v6.2.0.bin';
const MODEL_PATH = `${RNFS.MainBundlePath}/${MODEL_FILENAME}`;
const VAD_PATH = `${RNFS.MainBundlePath}/${VAD_FILENAME}`;
const KOKORO_MODEL_DIR = `${RNFS.MainBundlePath}/sherpa-onnx-kokoro-en-v0_19`;

export default function VoiceDashboard2() {
  const { height } = useWindowDimensions();
  const { authToken } = useAccessToken();
  const [voiceListenerState, setVoiceListenerState] = useState<VoiceListenerState>('disabled');
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingTool, setPendingTool] = useState<AgentTool | null>(null);
  const activeTtsCountRef = useRef(0);
  const [speaking, setSpeaking] = useState(false);
  const [tool, setTool] = useState<AgentTool | null>(null);
  const [devInput, setDevInput] = useState('');
  const [devMode] = useState(__DEV__ && true);

  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        await VoiceProcessor.instance.start(FRAME_LENGTH, FREQUENCY_HZ);
        await VoiceProcessor.instance.stop();
      } catch (_) {}
    };
    requestMicPermission();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const handleLoadModel = async () => {
      if (cancelled) return;
      setModelStatus('loading');
      setStatusMsg('Loading models...');
      try {
        await NativeWhisper.loadModel(MODEL_PATH);
        await NativeKokoro.loadModel(KOKORO_MODEL_DIR);
        await NativeWhisper.initVad(VAD_PATH);
        setModelStatus('ready');
        setStatusMsg('');
        if (!devMode) setVoiceListenerState('listening');
      } catch (e: any) {
        setModelStatus('error');
        setStatusMsg(`Error: ${e.message}`);
      }
    };
    handleLoadModel();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTranscript = useCallback(async (text: string) => {
    setVoiceListenerState('disabled');
    console.log('[handleTranscript] text:', text);
    try {
      const userMessage: Message = { role: 'user', content: text.trim() };
      let currentMessages = [...messages, userMessage];
      setMessages(currentMessages);

      // --- permission / execute path (pendingTool already set) ---
      if (pendingTool) {
        const result = await sendAgentMessage(currentMessages, pendingTool);
        setMessages(prev => [...prev, result.message]);
        if (result.tool) setTool(result.tool);

        if (result.executePermissionGranted) {
          if (!authToken) throw new Error('No auth gmail accesstoken');
          const toolLog = await executeTool(result.tool, authToken);
          const summary = await callSummarize(currentMessages, toolLog);
          setMessages(prev => [...prev, { role: 'assistant', content: summary.assistant }]);
          await speak({ text: summary.assistant, voiceListenerState: 'disabled', setVoiceListenerState, activeTtsCountRef, setSpeaking });
        } else {
          await speak({ text: result.message.content, voiceListenerState: 'disabled', setVoiceListenerState, activeTtsCountRef, setSpeaking });
        }
        setPendingTool(null);
        return;
      }

      // --- planning path with silent tool loop ---
      let result = await sendAgentMessage(currentMessages, null);
      if (result.tool) setTool(result.tool);

      while (result.tool?.silent === true) {
        if (!authToken) throw new Error('No auth gmail accesstoken');
        const toolLog = await executeTool(result.tool, authToken);
        // inject tool result as user-role context, skip the silent assistant message
        currentMessages = [
          ...currentMessages,
          { role: 'user', content: `Tool result: ${JSON.stringify(toolLog.result)}` },
        ];
        setMessages(currentMessages);
        result = await sendAgentMessage(currentMessages, null);
        if (result.tool) setTool(result.tool);
      }

      // non-silent step — speak and optionally set pending tool
      setMessages(prev => [...prev, result.message]);
      await speak({ text: result.message.content, voiceListenerState: 'disabled', setVoiceListenerState, activeTtsCountRef, setSpeaking });
      if (result.tool?.toolParameters && Object.values(result.tool.toolParameters).every(v => v !== null)) {
        setPendingTool(result.tool);
      }
    } catch (e: any) {
      console.log('[handleTranscript] error:', e?.message ?? e);
    } finally {
      if (!devMode) setVoiceListenerState('listening');
    }
  }, [messages, pendingTool, authToken, devMode]);

  return (
    <View style={styles.root}>
      <View style={styles.topbar}>
        {modelStatus !== 'ready' && (
          <Pressable
            style={[styles.loadBtn, modelStatus === 'loading' && styles.loadBtnDisabled]}
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
        {voiceListenerState === 'disabled' && !speaking
          ? <ActivityIndicator size="large" color="#e8fff6" style={{ height: 150 }} />
          : <AudioVisualizer mode={voiceListenerState} />
        }
        <Text style={styles.modeLabel}>
          {voiceListenerState === 'disabled'
            ? speaking ? 'Speaking...' : 'Processing...'
            : voiceListenerState}
        </Text>

        {tool && (
          <View style={styles.toolPanel}>
            <View style={styles.toolHeader}>
              <Text style={styles.toolHeaderLabel}>Current tool</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tool.tool}</Text>
              </View>
            </View>
            {tool.toolParameters && Object.entries(tool.toolParameters).map(([k, v]) => (
              <View key={k} style={styles.kv}>
                <Text style={styles.kvKey}>{k}</Text>
                <Text style={[styles.kvVal, !v && styles.kvValNull]}>{v ?? 'null'}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {statusMsg ? (
        <Text style={styles.statusMsg}>{statusMsg}</Text>
      ) : null}

      {__DEV__ && (
        <View style={styles.devRow}>
          <TextInput
            style={styles.devInput}
            value={devInput}
            onChangeText={setDevInput}
            placeholder="Type a message..."
            placeholderTextColor="rgba(232,255,246,0.3)"
            returnKeyType="send"
            onSubmitEditing={() => {
              if (devInput.trim()) {
                handleTranscript(devInput.trim());
                setDevInput('');
              }
            }}
          />
          <Pressable
            style={styles.devSendBtn}
            onPress={() => {
              if (devInput.trim()) {
                handleTranscript(devInput.trim());
                setDevInput('');
              }
            }}
          >
            <Text style={styles.devSendBtnText}>Send</Text>
          </Pressable>
        </View>
      )}

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
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    marginTop: 30,
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
    marginTop: 30,
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
  toolPanel: {
    marginTop: 24,
    width: '90%',
    borderRadius: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 14,
    gap: 10,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  toolHeaderLabel: {
    color: 'rgba(229,231,235,0.9)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
  },
  badgeText: {
    color: '#9aa4b2',
    fontSize: 11,
  },
  kv: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    gap: 10,
  },
  kvKey: {
    width: 72,
    color: '#9aa4b2',
    fontSize: 12,
  },
  kvVal: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 12,
  },
  kvValNull: {
    color: 'rgba(229,231,235,0.45)',
    fontStyle: 'italic',
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#08110e',
  },
  devInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,255,246,0.18)',
    backgroundColor: 'rgba(232,255,246,0.05)',
    color: '#e8fff6',
    fontSize: 13,
  },
  devSendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
  },
  devSendBtnText: {
    color: '#22c55e',
    fontSize: 13,
    fontWeight: '600',
  },
});

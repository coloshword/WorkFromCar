import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Pressable, Text, View, ScrollView, ActivityIndicator, TextInput, Alert } from 'react-native';
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
import * as Keychain from 'react-native-keychain';
import OnboardingOverlay from '../components/OnboardingOverlay';

const MODEL_FILENAME = 'ggml-tiny.en-q5_1.bin';
const VAD_FILENAME = 'ggml-silero-v6.2.0.bin';
const MODEL_PATH = `${RNFS.MainBundlePath}/${MODEL_FILENAME}`;
const VAD_PATH = `${RNFS.MainBundlePath}/${VAD_FILENAME}`;
const KOKORO_MODEL_DIR = `${RNFS.MainBundlePath}/sherpa-onnx-kokoro-en-v0_19`;

const DEV_TEXT_MODE = false;

export default function VoiceDashboard2() {
  const { height } = useWindowDimensions();
  const { authToken, setAuthToken } = useAccessToken();
  const [voiceListenerState, setVoiceListenerState] = useState<VoiceListenerState>('disabled');
  const [modelStatus, setModelStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingTool, setPendingTool] = useState<AgentTool | null>(null);
  const activeTtsCountRef = useRef(0);
  const [speaking, setSpeaking] = useState(false);
  const [tool, setTool] = useState<AgentTool | null>(null);
  const [devText, setDevText] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log out?',
      'You will need to sign in again to use Gmail from the car.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: async () => {
            await Keychain.resetGenericPassword();
            setAuthToken(null);
          },
        },
      ],
    );
  }, [setAuthToken]);

  useEffect(() => {
    if (DEV_TEXT_MODE) return;
    const requestMicPermission = async () => {
      try {
        await VoiceProcessor.instance.start(FRAME_LENGTH, FREQUENCY_HZ);
        await VoiceProcessor.instance.stop();
      } catch (_) {}
    };
    requestMicPermission();
  }, []);

  useEffect(() => {
    if (DEV_TEXT_MODE) {
      setModelStatus('loading');
      NativeKokoro.loadModel(KOKORO_MODEL_DIR)
        .then(() => setModelStatus('ready'))
        .catch((e: any) => {
          setModelStatus('error');
          setStatusMsg(`Error: ${e.message}`);
        });
      return;
    }

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
        setVoiceListenerState('listening');
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
    if (!DEV_TEXT_MODE) setVoiceListenerState('transcribing');
    try {
      const userMessage: Message = { role: 'user', content: text.trim() };
      let currentMessages = [...messages, userMessage];
      setMessages([...currentMessages]);

      const result = await sendAgentMessage(currentMessages, pendingTool);
      currentMessages = [...currentMessages, result.message];
      setMessages([...currentMessages]);

      if (result.tool) {
        setTool(result.tool);
      }

      if (pendingTool) {
        if (result.executePermissionGranted) {
          if (!authToken) {
            throw new Error('No auth gmail accesstoken');
          }
          const toolLog = await executeTool(result.tool, authToken);
          const summary = await callSummarize(currentMessages, toolLog);
          currentMessages = [...currentMessages, { role: 'assistant', content: summary.assistant }];
          setMessages([...currentMessages]);
          await speak({
            text: summary.assistant,
            voiceListenerState: 'transcribing',
            setVoiceListenerState,
            activeTtsCountRef,
            setSpeaking
          });
        } else {
          await speak({
            text: result.message.content,
            voiceListenerState: 'transcribing',
            setVoiceListenerState,
            activeTtsCountRef,
            setSpeaking
          });
        }
        setPendingTool(null);
      } else {
        const MAX_SILENT_ITERATIONS = 3;
        let currentResult = result;
        let iterations = 0;

        while (currentResult.tool?.silent && iterations < MAX_SILENT_ITERATIONS) {
          iterations++;
          if (!authToken) {
            throw new Error('No auth gmail accesstoken');
          }
          const toolLog = await executeTool(currentResult.tool, authToken);
          currentMessages = [...currentMessages, { role: 'system', content: JSON.stringify(toolLog) }];
          setMessages([...currentMessages]);

          currentResult = await sendAgentMessage(currentMessages, null);
          currentMessages = [...currentMessages, currentResult.message];
          setMessages([...currentMessages]);

          if (currentResult.tool) {
            setTool(currentResult.tool);
          }
        }

        const hitLoopLimit = iterations >= MAX_SILENT_ITERATIONS && currentResult.tool?.silent;

        await speak({
          text: currentResult.message.content?.trim()
            || "Sorry, I wasn't able to finish processing. Please try again.",
          voiceListenerState: 'transcribing',
          setVoiceListenerState,
          activeTtsCountRef,
          setSpeaking
        });

        if (!hitLoopLimit && currentResult.tool && !currentResult.tool.silent &&
            currentResult.tool.toolParameters &&
            Object.values(currentResult.tool.toolParameters).every(v => v !== null)) {
          setPendingTool(currentResult.tool);
        }
      }
    } catch (e: any) {
      const errorMessage = e?.message || 'Something went wrong';
      console.log('[handleTranscript] error:', errorMessage);
      const userMessage = errorMessage.includes('network') || errorMessage.includes('fetch')
        ? "I'm having trouble connecting. Please check your internet connection and try again."
        : "Sorry, something went wrong. Please try again.";
      await speak({
        text: userMessage,
        voiceListenerState: 'transcribing',
        setVoiceListenerState,
        activeTtsCountRef,
        setSpeaking
      });
      console.log('[handleTranscript] error:', e?.message ?? e);
    } finally {
      if (!DEV_TEXT_MODE) setVoiceListenerState('listening');
    }
  }, [messages, pendingTool, authToken]);

  const handleDevSubmit = useCallback(() => {
    if (!devText.trim()) return;
    const text = devText.trim();
    setDevText('');
    handleTranscript(text);
  }, [devText, handleTranscript]);

  return (
    <View style={styles.root}>
      <View style={styles.topbar}>
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </Pressable>
        <View style={styles.topbarRight}>
          <Pressable style={styles.helpBtn} onPress={() => setShowOnboarding(true)}>
            <Text style={styles.helpBtnText}>?</Text>
          </Pressable>
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
      </View>

      <View style={[styles.visualizerContainer, { paddingTop: height * 0.15 }]}>
        {(voiceListenerState === 'disabled' || voiceListenerState === 'transcribing') && !speaking
          ? <ActivityIndicator size="large" color="#e8fff6" style={{ height: 150 }} />
          : <AudioVisualizer mode={voiceListenerState} />
        }
        <Text style={styles.modeLabel}>
          {(voiceListenerState === 'disabled' || voiceListenerState === 'transcribing')
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

      {DEV_TEXT_MODE && (
        <View style={styles.devInputRow}>
          <TextInput
            style={styles.devTextInput}
            value={devText}
            onChangeText={setDevText}
            placeholder="Type a message..."
            placeholderTextColor="rgba(232,255,246,0.3)"
            onSubmitEditing={handleDevSubmit}
            returnKeyType="send"
          />
          <Pressable
            style={[styles.devSendBtn, !devText.trim() && styles.devSendBtnDisabled]}
            onPress={handleDevSubmit}
            disabled={!devText.trim()}
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

      <OnboardingOverlay
        visible={showOnboarding}
        onDismiss={() => setShowOnboarding(false)}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#08110e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  logoutBtn: {
    marginTop: 30,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(232,255,246,0.25)',
  },
  logoutBtnText: {
    color: 'rgba(232,255,246,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 30,
  },
  helpBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(232,255,246,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtnText: {
    color: 'rgba(232,255,246,0.7)',
    fontSize: 14,
    fontWeight: '700',
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
  devInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  devTextInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#e5e7eb',
    fontSize: 14,
  },
  devSendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.4)',
  },
  devSendBtnDisabled: {
    opacity: 0.4,
  },
  devSendBtnText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
});

import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView, ActivityIndicator, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import NativeWhisper from 'whisper/src/NativeWhisper';
import NativeKokoro from "kokoro/src/NativeKokoro"; 
import VoiceListener from '../components/VoiceListener';
import { VoiceProcessor } from '@picovoice/react-native-voice-processor';
import { FRAME_LENGTH, FREQUENCY_HZ } from '../services/audio/voiceProcessor';
import { authFetch } from '../utils/fetchUtils';
import { sendEmail } from '../api/sendEmail';
import * as Keychain from 'react-native-keychain';
import { useAccessToken } from '../context/AccessTokenContext';

const MODEL_FILENAME = 'ggml-tiny.en-q5_1.bin';
const MODEL_PATH = `${RNFS.MainBundlePath}/${MODEL_FILENAME}`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function VoiceDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [planOrExecute, setPlanOrExecute] = useState<'plan' | 'execute'>('plan');
  const [executeObj, setExecuteObj] = useState<any>(null);
  const [statusText, setStatusText] = useState('');
  const { authToken, setAuthToken } = useAccessToken();

  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        await VoiceProcessor.instance.start(FRAME_LENGTH, FREQUENCY_HZ);
        await VoiceProcessor.instance.stop();
      } catch (e) {}
    };
    requestMicPermission();
  }, []);

  const handleLoadModel = async () => {
    setStatusText('Loading model...');
    try {
      const modelExists = await RNFS.exists(MODEL_PATH);
      if (!modelExists) {
        setStatusText(`Model not found at ${MODEL_PATH}`);
        return;
      }
      const MODEL_DIR_TEST = `/TESTPATHtest_model`;
      const ok = await NativeWhisper.loadModel(MODEL_PATH);
      const ok2 = await NativeKokoro.loadModel(MODEL_DIR_TEST);
      console.log('ok2', ok2);
      setStatusText(ok ? '✓ Model loaded' : '✗ Returned false');
    } catch (e: any) {
      setStatusText(`Error: ${e.message}`);
    }
  };

  const handleLogout = async () => {
    await Keychain.resetGenericPassword();
    setAuthToken(null);
  };

  const sendMessage = async (transcript: string) => {
    if (!transcript.trim()) return;

    setLoading(true);
    setStatusText('Sending...');

    try {
      const userMessage: Message = { role: 'user', content: transcript.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      let response;
      if (planOrExecute === 'execute') {
        response = await authFetch('/api/agent/executePermission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...executeObj, messages: updatedMessages }),
        });
      } else {
        response = await authFetch('/api/agent/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: updatedMessages }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (planOrExecute === 'execute') {
        setPlanOrExecute('plan');
        setExecuteObj(null);

        if (data.executePermissionGranted) {
          try {
            if (authToken && executeObj.tool.tool === 'gmail.createDraft') {
              const { to, subject, body } = executeObj.tool.toolParameters;
              await sendEmail({ to, subject, body, accessToken: authToken });
              setStatusText('✓ Email sent successfully');
            } else {
              setStatusText('✓ Tool execution permitted');
            }
          } catch (emailError: any) {
            setStatusText(`Error sending email: ${emailError.message}`);
          }
        } else {
          setStatusText('✗ Tool execution denied');
        }

        if (data.assistant) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.assistant }]);
        }
      } else {
        const assistantMessage = data.message;
        setMessages(prev => [...prev, assistantMessage]);
        setStatusText(`✓ Response received (tool: ${data.tool.tool})`);

        if (data.tool.toolParameters && Object.values(data.tool.toolParameters).every(param => param !== null)) {
          setPlanOrExecute('execute');
          setExecuteObj({ messages: [...updatedMessages, assistantMessage], tool: data.tool });
          setStatusText(`✓ Plan ready. Next message will execute: ${data.tool.tool}`);
        }
      }
    } catch (error: any) {
      setStatusText(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Dashboard</Text>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.messagesContainer} contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map((msg, index) => (
          <View key={index} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
            <Text style={styles.messageRole}>{msg.role}:</Text>
            <Text style={styles.messageText}>{msg.content}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator size="small" color="#0000ff" style={{ marginTop: 10 }} />}
      </ScrollView>

      {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}

      <View style={styles.inputContainer}>
        <Button title="Load Model" onPress={handleLoadModel} />
        <VoiceListener onTranscript={sendMessage} disabled={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  logoutButtonText: {
    fontSize: 14,
    color: '#333',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    maxWidth: '80%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#e3f2fd',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5f5',
  },
  messageRole: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  messageText: {
    fontSize: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginVertical: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});

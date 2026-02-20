// this is the voice dashboard screen, the most important screen for the voice agent. 
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import RNFS from 'react-native-fs';
import NativeWhisper from 'whisper/src/NativeWhisper';

const MODEL_FILENAME = 'ggml-tiny.en-q5_1.bin';
const MODEL_PATH = `${RNFS.MainBundlePath}/${MODEL_FILENAME}`;

export default function VoiceDashboard() {
  const [status, setStatus] = useState<string>('idle');

  const handleLoadModel = async () => {
    setStatus('loading...');
    try {
      const modelExists = await RNFS.exists(MODEL_PATH);
      if (!modelExists) {
        setStatus(`Model not found at ${MODEL_PATH}`);
        return;
      }

      const ok = await NativeWhisper.loadModel(MODEL_PATH);
      setStatus(ok ? 'Model loaded!' : 'Returned false');
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{status}</Text>
      <Button title="Load Whisper Model" onPress={handleLoadModel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  status: { marginBottom: 24, fontSize: 16 },
});
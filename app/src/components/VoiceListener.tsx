import React, { useState } from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { startStreaming, stopStreaming } from "../services/audio/voiceProcessor";
import NativeWhisper from 'whisper/src/NativeWhisper';

export default function VoiceListener() {
  const [isRecording, setIsRecording] = useState(false);

  const handlePress = async () => {
    if (isRecording) {
      try {
        const pcm = await stopStreaming();
        const text = await NativeWhisper.pcmBufferToText(pcm);
        console.log(text);
      } catch (e) {
        console.error('stopStreaming failed:', e);
      } finally {
        setIsRecording(false);
      }
    } else {
      try {
        await startStreaming();
        setIsRecording(true);
      } catch (e) {
        console.error('startStreaming failed:', e);
      }
    }
  };

  return (
    <Pressable 
      onPress={handlePress}
      style={[styles.button, isRecording ? styles.recording : styles.idle]}
    >
      <View style={styles.content}>
        <View style={[styles.indicator, isRecording && styles.indicatorActive]} />
        <Text style={styles.text}>
          {isRecording ? "Stop Listening" : "Start Listening"}
        </Text>
      </View>
    </Pressable>
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
  text: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
